//! Shared logic for compiling tasks with example inputs and validating
//! compiled task constraints.

use std::collections::{HashMap, HashSet};

use rand::Rng;
use rust_decimal::Decimal;

use crate::chat::completions::request::{Message, RichContent, SimpleContent};
use crate::functions::expression::{
    FunctionOutput, InputSchema, Params, ParamsRef, TaskOutput, TaskOutputOwned,
    VectorCompletionOutput,
};
use crate::functions::{
    CompiledTask, Function, RemoteFunction, Task, VectorCompletionTask,
};

use super::example_inputs::generate_example_inputs;

/// Number of randomized output expression evaluations to verify variance.
const OUTPUT_EXPRESSION_TRIALS: usize = 100;

/// Whether the parent function is scalar or vector (with a known output_length).
enum FunctionType {
    Scalar,
    Vector { output_length: u64 },
}

/// Generates example inputs from the function's input schema, compiles tasks
/// for each input, and validates compiled task constraints:
/// - Placeholder task inputs match their embedded `input_schema`
/// - Vector completion tasks have content parts (not plain strings),
///   at least 2 responses, at least 1 message, etc.
/// - If `children` is provided, scalar/vector function task inputs are validated
///   against the referenced child function's `input_schema`
/// - Output expressions are evaluated with mock raw outputs and the resulting
///   `FunctionOutput` is validated against the parent function type
pub(super) fn compile_and_validate_task_inputs(
    function: &RemoteFunction,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.is_empty() {
        return Err("Failed to generate any example inputs from input_schema"
            .to_string());
    }

    compile_and_validate_for_inputs(function, &inputs, children)
}

/// Compiles tasks for each of the provided inputs and validates compiled task
/// constraints. Same checks as `compile_and_validate_task_inputs` but accepts
/// pre-generated inputs instead of generating from the schema.
pub(super) fn compile_and_validate_for_inputs(
    function: &RemoteFunction,
    inputs: &[crate::functions::expression::Input],
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    for (i, input) in inputs.iter().enumerate() {
        // Determine parent function type (scalar or vector with output_length)
        let function_type = match function {
            RemoteFunction::Scalar { .. } => FunctionType::Scalar,
            RemoteFunction::Vector { output_length, .. } => {
                let params = Params::Ref(ParamsRef {
                    input,
                    output: None,
                    map: None,
                });
                let len = output_length.clone().compile_one(&params).map_err(|e| {
                    format!(
                        "Input [{}]: output_length compilation failed: {}",
                        i, e
                    )
                })?;
                FunctionType::Vector {
                    output_length: len,
                }
            }
        };

        // compile_tasks takes self by value, so we clone into a Function
        let func = Function::Remote(function.clone());
        let compiled_tasks = func.compile_tasks(input).map_err(|e| {
            format!(
                "Input [{}]: task compilation failed: {}\n\nInput: {}",
                i,
                e,
                serde_json::to_string_pretty(input).unwrap_or_default()
            )
        })?;

        // Validate each compiled task
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let compiled_task = match compiled_task {
                Some(ct) => ct,
                None => continue, // skipped task
            };

            match compiled_task {
                CompiledTask::One(task) => {
                    validate_compiled_task(i, j, None, task, children)?;
                    validate_output_expression(
                        i,
                        j,
                        input,
                        compiled_task,
                        task,
                        &function_type,
                        children,
                    )?;
                }
                CompiledTask::Many(tasks) => {
                    for (k, task) in tasks.iter().enumerate() {
                        validate_compiled_task(
                            i, j, Some(k), task, children,
                        )?;
                    }
                    // Validate the mapped output expression using the first
                    // task as representative (all share the same output expr)
                    if let Some(first) = tasks.first() {
                        validate_output_expression(
                            i,
                            j,
                            input,
                            compiled_task,
                            first,
                            &function_type,
                            children,
                        )?;
                    }
                }
            }
        }
    }

    Ok(())
}

/// Validates a single compiled task's inputs.
fn validate_compiled_task(
    input_index: usize,
    task_index: usize,
    map_index: Option<usize>,
    task: &Task,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let location = match map_index {
        Some(k) => {
            format!("Input [{}], task [{}][{}]", input_index, task_index, k)
        }
        None => format!("Input [{}], task [{}]", input_index, task_index),
    };

    match task {
        Task::PlaceholderScalarFunction(t) => {
            if !t.input_schema.validate_input(&t.input) {
                return Err(format!(
                    "{}: compiled input does not match placeholder's input_schema\n\nInput: {}\n\nSchema: {}",
                    location,
                    serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                    serde_json::to_string_pretty(&t.input_schema)
                        .unwrap_or_default(),
                ));
            }
        }
        Task::PlaceholderVectorFunction(t) => {
            if !t.input_schema.validate_input(&t.input) {
                return Err(format!(
                    "{}: compiled input does not match placeholder's input_schema\n\nInput: {}\n\nSchema: {}",
                    location,
                    serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                    serde_json::to_string_pretty(&t.input_schema)
                        .unwrap_or_default(),
                ));
            }
        }
        Task::VectorCompletion(vc) => {
            check_compiled_vector_completion(&location, vc)?;
        }
        Task::ScalarFunction(t) => {
            if let Some(children) = children {
                let key = format!("{}/{}", t.owner, t.repository);
                let child = children.get(&key).ok_or_else(|| {
                    format!(
                        "{}: referenced scalar.function '{}' not found in children",
                        location, key
                    )
                })?;
                if !child.input_schema().validate_input(&t.input) {
                    return Err(format!(
                        "{}: compiled input does not match child function's input_schema ({})\n\nInput: {}\n\nSchema: {}",
                        location,
                        key,
                        serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                        serde_json::to_string_pretty(child.input_schema())
                            .unwrap_or_default(),
                    ));
                }
            }
        }
        Task::VectorFunction(t) => {
            if let Some(children) = children {
                let key = format!("{}/{}", t.owner, t.repository);
                let child = children.get(&key).ok_or_else(|| {
                    format!(
                        "{}: referenced vector.function '{}' not found in children",
                        location, key
                    )
                })?;
                if !child.input_schema().validate_input(&t.input) {
                    return Err(format!(
                        "{}: compiled input does not match child function's input_schema ({})\n\nInput: {}\n\nSchema: {}",
                        location,
                        key,
                        serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                        serde_json::to_string_pretty(child.input_schema())
                            .unwrap_or_default(),
                    ));
                }
            }
        }
    }

    Ok(())
}

/// Generates randomized mock raw outputs, evaluates the output expression
/// multiple times, validates each result against the parent function type,
/// and checks that all results are distinct (ensuring the expression actually
/// derives its output from the raw result, not returning a fixed value).
fn validate_output_expression(
    input_index: usize,
    task_index: usize,
    input: &crate::functions::expression::Input,
    compiled_task: &CompiledTask,
    representative_task: &Task,
    function_type: &FunctionType,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let location = format!("Input [{}], task [{}]", input_index, task_index);

    // Determine the output shape info we need for random generation
    // (returns None if we can't construct mocks, e.g. vector.function without children)
    let shape = match compiled_task {
        CompiledTask::One(task) => {
            task_output_shape(task, children, &location)?
        }
        CompiledTask::Many(tasks) => {
            mapped_task_output_shape(tasks, children, &location)?
        }
    };

    let Some(shape) = shape else {
        return Ok(());
    };

    let mut rng = rand::rng();
    let mut seen = HashSet::new();

    for trial in 0..OUTPUT_EXPRESSION_TRIALS {
        let mock_output = random_task_output(&shape, &mut rng);

        let result = representative_task
            .compile_output(input, mock_output)
            .map_err(|e| {
                format!(
                    "{}: output expression evaluation failed (trial {}): {}",
                    location, trial, e
                )
            })?;

        // Validate against parent function type
        validate_function_output(&location, function_type, &result)?;

        // Check uniqueness — serialize to string for comparison
        let key = serde_json::to_string(&result).unwrap_or_default();
        if !seen.insert(key) {
            return Err(format!(
                "{}: output expression produced duplicate results across \
                 {} randomized trials — the expression must derive its \
                 output from the raw task result, not return a fixed value",
                location,
                trial + 1,
            ));
        }
    }

    Ok(())
}

/// Validates a `FunctionOutput` against the expected parent function type.
fn validate_function_output(
    location: &str,
    function_type: &FunctionType,
    result: &FunctionOutput,
) -> Result<(), String> {
    match (function_type, result) {
        (FunctionType::Scalar, FunctionOutput::Scalar(s)) => {
            if *s < Decimal::new(-1, 2) || *s > Decimal::new(101, 2) {
                return Err(format!(
                    "{}: output expression produced scalar {} which is outside \
                     the valid range [-0.01, 1.01]",
                    location, s
                ));
            }
        }
        (FunctionType::Scalar, FunctionOutput::Vector(v)) => {
            return Err(format!(
                "{}: output expression produced a vector of length {} but \
                 parent is a scalar function (expected a scalar value)",
                location,
                v.len()
            ));
        }
        (
            FunctionType::Vector { output_length },
            FunctionOutput::Vector(v),
        ) => {
            if v.len() as u64 != *output_length {
                return Err(format!(
                    "{}: output expression produced a vector of length {} but \
                     parent function's output_length is {}",
                    location,
                    v.len(),
                    output_length
                ));
            }
            let sum: Decimal = v.iter().copied().sum();
            if sum < Decimal::new(99, 2) || sum > Decimal::new(101, 2) {
                return Err(format!(
                    "{}: output expression produced a vector summing to {} \
                     which is outside the valid range [0.99, 1.01]",
                    location, sum
                ));
            }
        }
        (FunctionType::Vector { .. }, FunctionOutput::Scalar(s)) => {
            return Err(format!(
                "{}: output expression produced scalar {} but parent is a \
                 vector function (expected a vector)",
                location, s
            ));
        }
        (_, FunctionOutput::Err(e)) => {
            return Err(format!(
                "{}: output expression produced an error: {}",
                location,
                serde_json::to_string(e).unwrap_or_default()
            ));
        }
    }
    Ok(())
}

// --- Output shape descriptors (what random output to generate) ---

/// Describes the shape of a task's raw output for random generation.
enum OutputShape {
    /// Vector completion with `n` responses.
    VectorCompletion(usize),
    /// Scalar function output (single value in [0, 1]).
    Scalar,
    /// Vector function output with `n` elements.
    Vector(u64),
    /// Mapped vector completion — one VectorCompletion per task instance.
    MapVectorCompletion(Vec<usize>),
    /// Mapped scalar function — one scalar per task instance.
    MapScalar(usize),
    /// Mapped vector function — one vector per task instance.
    MapVector(Vec<u64>),
}

/// Determines the output shape for a single (non-mapped) compiled task.
/// Returns `None` if shape can't be determined (e.g., vector.function without children).
fn task_output_shape(
    task: &Task,
    children: Option<&HashMap<String, RemoteFunction>>,
    location: &str,
) -> Result<Option<OutputShape>, String> {
    match task {
        Task::VectorCompletion(vc) => {
            Ok(Some(OutputShape::VectorCompletion(vc.responses.len())))
        }
        Task::ScalarFunction(_) | Task::PlaceholderScalarFunction(_) => {
            Ok(Some(OutputShape::Scalar))
        }
        Task::VectorFunction(t) => {
            let Some(n) = resolve_vector_function_output_length(
                &t.owner,
                &t.repository,
                &t.input,
                children,
                location,
            )?
            else {
                return Ok(None);
            };
            Ok(Some(OutputShape::Vector(n)))
        }
        Task::PlaceholderVectorFunction(t) => {
            let params = Params::Ref(ParamsRef {
                input: &t.input,
                output: None,
                map: None,
            });
            let n =
                t.output_length.clone().compile_one(&params).map_err(|e| {
                    format!(
                        "{}: placeholder vector function output_length \
                         compilation failed: {}",
                        location, e
                    )
                })?;
            Ok(Some(OutputShape::Vector(n)))
        }
    }
}

/// Determines the output shape for a mapped (Many) compiled task.
fn mapped_task_output_shape(
    tasks: &[Task],
    children: Option<&HashMap<String, RemoteFunction>>,
    location: &str,
) -> Result<Option<OutputShape>, String> {
    if tasks.is_empty() {
        return Err(format!("{}: mapped task has no instances", location));
    }

    match &tasks[0] {
        Task::VectorCompletion(_) => {
            let sizes: Vec<usize> = tasks
                .iter()
                .map(|task| match task {
                    Task::VectorCompletion(vc) => Ok(vc.responses.len()),
                    _ => Err(format!(
                        "{}: mixed task types in mapped task",
                        location
                    )),
                })
                .collect::<Result<_, _>>()?;
            Ok(Some(OutputShape::MapVectorCompletion(sizes)))
        }
        Task::ScalarFunction(_) | Task::PlaceholderScalarFunction(_) => {
            Ok(Some(OutputShape::MapScalar(tasks.len())))
        }
        Task::VectorFunction(_) => {
            let mut lengths = Vec::with_capacity(tasks.len());
            for task in tasks {
                match task {
                    Task::VectorFunction(t) => {
                        let Some(n) =
                            resolve_vector_function_output_length(
                                &t.owner,
                                &t.repository,
                                &t.input,
                                children,
                                location,
                            )?
                        else {
                            return Ok(None);
                        };
                        lengths.push(n);
                    }
                    _ => {
                        return Err(format!(
                            "{}: mixed task types in mapped task",
                            location
                        ))
                    }
                }
            }
            Ok(Some(OutputShape::MapVector(lengths)))
        }
        Task::PlaceholderVectorFunction(_) => {
            let lengths: Vec<u64> = tasks
                .iter()
                .map(|task| match task {
                    Task::PlaceholderVectorFunction(t) => {
                        let params = Params::Ref(ParamsRef {
                            input: &t.input,
                            output: None,
                            map: None,
                        });
                        t.output_length.clone().compile_one(&params).map_err(
                            |e| {
                                format!(
                                    "{}: placeholder vector output_length \
                                     compilation failed: {}",
                                    location, e
                                )
                            },
                        )
                    }
                    _ => Err(format!(
                        "{}: mixed task types in mapped task",
                        location
                    )),
                })
                .collect::<Result<_, _>>()?;
            Ok(Some(OutputShape::MapVector(lengths)))
        }
    }
}

// --- Random output generation ---

/// Creates a randomized `TaskOutput` from an `OutputShape`.
fn random_task_output<'a>(
    shape: &OutputShape,
    rng: &mut impl Rng,
) -> TaskOutput<'a> {
    match shape {
        OutputShape::VectorCompletion(n) => TaskOutput::Owned(
            TaskOutputOwned::VectorCompletion(random_vc_output(*n, rng)),
        ),
        OutputShape::Scalar => TaskOutput::Owned(TaskOutputOwned::Function(
            random_scalar_output(rng),
        )),
        OutputShape::Vector(n) => TaskOutput::Owned(
            TaskOutputOwned::Function(random_vector_output(*n, rng)),
        ),
        OutputShape::MapVectorCompletion(sizes) => {
            let outputs = sizes
                .iter()
                .map(|&n| random_vc_output(n, rng))
                .collect();
            TaskOutput::Owned(TaskOutputOwned::MapVectorCompletion(outputs))
        }
        OutputShape::MapScalar(count) => {
            let outputs =
                (0..*count).map(|_| random_scalar_output(rng)).collect();
            TaskOutput::Owned(TaskOutputOwned::MapFunction(outputs))
        }
        OutputShape::MapVector(lengths) => {
            let outputs = lengths
                .iter()
                .map(|&n| random_vector_output(n, rng))
                .collect();
            TaskOutput::Owned(TaskOutputOwned::MapFunction(outputs))
        }
    }
}

/// Random scalar output in [0, 1].
fn random_scalar_output(rng: &mut impl Rng) -> FunctionOutput {
    let v: f64 = rng.random_range(0.01..0.99);
    FunctionOutput::Scalar(
        Decimal::from_f64_retain(v).unwrap_or(Decimal::new(5, 1)),
    )
}

/// Random vector output of length `n` summing to ~1.
fn random_vector_output(n: u64, rng: &mut impl Rng) -> FunctionOutput {
    let scores = random_scores(n as usize, rng);
    FunctionOutput::Vector(scores)
}

/// Random vector completion output with `n` responses.
fn random_vc_output(
    n: usize,
    rng: &mut impl Rng,
) -> VectorCompletionOutput {
    let scores = random_scores(n, rng);
    let weights = random_scores(n, rng);
    VectorCompletionOutput {
        votes: Vec::new(),
        scores,
        weights,
    }
}

/// Generates a random vector of `n` non-negative Decimals that sum to ~1.
fn random_scores(n: usize, rng: &mut impl Rng) -> Vec<Decimal> {
    if n == 0 {
        return vec![];
    }
    // Generate random f64 values, normalize to sum to 1
    let raw: Vec<f64> = (0..n).map(|_| rng.random_range(0.01_f64..1.0)).collect();
    let sum: f64 = raw.iter().sum();
    raw.iter()
        .map(|&v| {
            Decimal::from_f64_retain(v / sum).unwrap_or(Decimal::ZERO)
        })
        .collect()
}

/// Resolves the output_length for a vector.function task by looking up the
/// child function and compiling its output_length expression with the task input.
/// Returns `None` if children is `None` (output validation is skipped).
fn resolve_vector_function_output_length(
    owner: &str,
    repository: &str,
    task_input: &crate::functions::expression::Input,
    children: Option<&HashMap<String, RemoteFunction>>,
    location: &str,
) -> Result<Option<u64>, String> {
    let key = format!("{}/{}", owner, repository);
    let Some(children) = children else {
        return Ok(None); // skip output validation without children
    };
    let child = children.get(&key).ok_or_else(|| {
        format!(
            "{}: referenced vector.function '{}' not found in children",
            location, key
        )
    })?;
    let output_length_expr = child.output_length().ok_or_else(|| {
        format!(
            "{}: child function '{}' is not a vector function",
            location, key
        )
    })?;
    let params = Params::Ref(ParamsRef {
        input: task_input,
        output: None,
        map: None,
    });
    let n = output_length_expr
        .clone()
        .compile_one(&params)
        .map_err(|e| {
            format!(
                "{}: child function '{}' output_length compilation failed: {}",
                location, key, e
            )
        })?;
    Ok(Some(n))
}

/// Validates a compiled vector completion task:
/// - At least 1 message
/// - Message content is content parts, not plain strings
/// - At least 2 responses
/// - Response content is content parts, not plain strings
fn check_compiled_vector_completion(
    location: &str,
    vc: &VectorCompletionTask,
) -> Result<(), String> {
    // At least 1 message
    if vc.messages.is_empty() {
        return Err(format!(
            "{}: compiled task must have at least 1 message",
            location
        ));
    }

    // Message content must be content parts
    for (j, msg) in vc.messages.iter().enumerate() {
        check_compiled_message_content(location, j, msg)?;
    }

    // At least 2 responses
    if vc.responses.len() < 2 {
        return Err(format!(
            "{}: compiled task must have at least 2 responses, found {}",
            location,
            vc.responses.len()
        ));
    }

    // Response content must be content parts
    for (j, resp) in vc.responses.iter().enumerate() {
        if matches!(resp, RichContent::Text(_)) {
            return Err(format!(
                "{}, response [{}]: compiled response must be an array of content parts, \
                 not a plain string",
                location, j
            ));
        }
    }

    Ok(())
}

/// Validates that compiled vector completion tasks vary with the parent input
/// for leaf scalar functions.
///
/// For each task, compiles across all example inputs and serializes the full
/// compiled VC task (messages, responses, tools). Then for each value path in
/// the input schema (including optional properties), counts unique values.
/// The task passes if `unique_tasks >= unique_values` for at least one path.
pub(super) fn validate_vc_task_diversity(
    function: &RemoteFunction,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.len() < 2 {
        return Ok(());
    }

    let path_unique_counts =
        compute_value_diversity(input_schema, &inputs);
    if path_unique_counts.is_empty() {
        return Ok(());
    }

    // Compile tasks for each input and collect serialized VC tasks per task index
    let task_count = function.tasks().len();
    let mut per_task_serialized: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];

    for input in &inputs {
        let func = Function::Remote(function.clone());
        let compiled_tasks = match func.compile_tasks(input) {
            Ok(ct) => ct,
            Err(_) => continue,
        };

        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                continue;
            };
            if let CompiledTask::One(Task::VectorCompletion(vc)) =
                compiled_task
            {
                // Serialize the full VC task (messages + responses + tools)
                let key =
                    serde_json::to_string(vc).unwrap_or_default();
                per_task_serialized[j].insert(key);
            }
        }
    }

    for (j, unique_tasks) in per_task_serialized.iter().enumerate() {
        let passes = path_unique_counts
            .iter()
            .any(|(_, unique_values)| unique_tasks.len() >= *unique_values);

        if !passes {
            let best_path = path_unique_counts
                .iter()
                .max_by_key(|(_, count)| *count)
                .unwrap();
            return Err(format!(
                "Task [{}]: compiled vector completion tasks have {} unique \
                 variations across {} example inputs, but the input value at \
                 '{}' has {} unique variations — tasks must derive from the \
                 input, not use fixed parameters",
                j,
                unique_tasks.len(),
                inputs.len(),
                best_path.0,
                best_path.1,
            ));
        }
    }

    Ok(())
}

/// Validates that compiled vector completion responses vary with the input.
///
/// For each task, compiles across all example inputs and counts unique
/// compiled response sets. Then for each array path in the input schema,
/// counts unique arrays across all inputs. The task passes if
/// `unique_responses >= unique_arrays` for at least one array path.
pub(super) fn validate_response_diversity(
    function: &RemoteFunction,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.len() < 2 {
        return Ok(());
    }

    let (_array_paths, path_unique_counts) =
        compute_array_diversity(input_schema, &inputs);
    if path_unique_counts.is_empty() {
        return Ok(());
    }

    // Compile tasks for each input and collect serialized responses per task
    let task_count = function.tasks().len();
    let mut per_task_responses: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];

    for input in &inputs {
        let func = Function::Remote(function.clone());
        let compiled_tasks = match func.compile_tasks(input) {
            Ok(ct) => ct,
            Err(_) => continue, // skip inputs that fail to compile
        };

        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                continue;
            };
            if let CompiledTask::One(Task::VectorCompletion(vc)) =
                compiled_task
            {
                let key =
                    serde_json::to_string(&vc.responses).unwrap_or_default();
                per_task_responses[j].insert(key);
            }
        }
    }

    // For each task, check that unique responses >= unique arrays for at least one path
    for (j, unique_responses) in per_task_responses.iter().enumerate() {
        let passes = path_unique_counts
            .iter()
            .any(|(_, unique_arrays)| unique_responses.len() >= *unique_arrays);

        if !passes {
            let best_path = path_unique_counts
                .iter()
                .max_by_key(|(_, count)| *count)
                .unwrap();
            return Err(format!(
                "Task [{}]: compiled responses have {} unique variations \
                 across {} example inputs, but the input array at '{}' has \
                 {} unique variations — responses must derive from the input, \
                 not use a fixed pool",
                j,
                unique_responses.len(),
                inputs.len(),
                best_path.0,
                best_path.1,
            ));
        }
    }

    Ok(())
}

/// Validates that compiled function task inputs vary with the parent input.
///
/// Same approach as `validate_response_diversity` but for branch vector
/// functions: instead of checking VC responses, checks that the compiled
/// `input` field of function/placeholder tasks varies across example inputs.
/// For mapped tasks (`CompiledTask::Many`), serializes the full vector of
/// compiled inputs. For unmapped tasks (`CompiledTask::One`), serializes the
/// single compiled input.
pub(super) fn validate_function_input_diversity(
    function: &RemoteFunction,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.len() < 2 {
        return Ok(());
    }

    let (array_paths, path_unique_counts) =
        compute_array_diversity(input_schema, &inputs);
    if path_unique_counts.is_empty() {
        return Ok(());
    }

    // Compile tasks for each input and collect serialized task inputs per task
    let task_count = function.tasks().len();
    let mut per_task_inputs: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];

    for input in &inputs {
        let func = Function::Remote(function.clone());
        let compiled_tasks = match func.compile_tasks(input) {
            Ok(ct) => ct,
            Err(_) => continue,
        };

        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                continue;
            };
            let key = match compiled_task {
                CompiledTask::One(task) => {
                    extract_task_input(task)
                }
                CompiledTask::Many(tasks) => {
                    let inputs: Vec<_> = tasks
                        .iter()
                        .filter_map(|t| extract_task_input_value(t))
                        .collect::<Vec<_>>();
                    serde_json::to_string(&inputs).unwrap_or_default()
                }
            };
            if !key.is_empty() {
                per_task_inputs[j].insert(key);
            }
        }
    }

    for (j, unique_inputs) in per_task_inputs.iter().enumerate() {
        let passes = path_unique_counts
            .iter()
            .any(|(_, unique_arrays)| unique_inputs.len() >= *unique_arrays);

        if !passes {
            let best_path = path_unique_counts
                .iter()
                .max_by_key(|(_, count)| *count)
                .unwrap();
            return Err(format!(
                "Task [{}]: compiled function inputs have {} unique variations \
                 across {} example inputs, but the input array at '{}' has \
                 {} unique variations — function inputs must derive from the \
                 parent input, not use a fixed value",
                j,
                unique_inputs.len(),
                inputs.len(),
                best_path.0,
                best_path.1,
            ));
        }
    }

    Ok(())
}

/// Extracts the serialized input from a compiled function/placeholder task.
/// Returns empty string for vector.completion tasks (not applicable).
fn extract_task_input(task: &Task) -> String {
    match extract_task_input_value(task) {
        Some(input) => serde_json::to_string(input).unwrap_or_default(),
        None => String::new(),
    }
}

/// Returns a reference to the compiled input of a function/placeholder task.
fn extract_task_input_value(
    task: &Task,
) -> Option<&crate::functions::expression::Input> {
    match task {
        Task::ScalarFunction(t) => Some(&t.input),
        Task::VectorFunction(t) => Some(&t.input),
        Task::PlaceholderScalarFunction(t) => Some(&t.input),
        Task::PlaceholderVectorFunction(t) => Some(&t.input),
        Task::VectorCompletion(_) => None,
    }
}

/// Validates that compiled function task inputs vary with the parent input
/// for branch scalar functions.
///
/// For each task, compiles across all example inputs and counts unique
/// compiled inputs. Then for each value path in the input schema (including
/// optional properties), counts unique values. The task passes if
/// `unique_inputs >= unique_values` for at least one path.
pub(super) fn validate_scalar_function_input_diversity(
    function: &RemoteFunction,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.len() < 2 {
        return Ok(());
    }

    let path_unique_counts =
        compute_value_diversity(input_schema, &inputs);
    if path_unique_counts.is_empty() {
        return Ok(());
    }

    // Compile tasks for each input and collect serialized task inputs per task
    let task_count = function.tasks().len();
    let mut per_task_inputs: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];

    for input in &inputs {
        let func = Function::Remote(function.clone());
        let compiled_tasks = match func.compile_tasks(input) {
            Ok(ct) => ct,
            Err(_) => continue,
        };

        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                continue;
            };
            // Branch scalar tasks are always CompiledTask::One (no map)
            if let CompiledTask::One(task) = compiled_task {
                let key = extract_task_input(task);
                if !key.is_empty() {
                    per_task_inputs[j].insert(key);
                }
            }
        }
    }

    for (j, unique_inputs) in per_task_inputs.iter().enumerate() {
        let passes = path_unique_counts
            .iter()
            .any(|(_, unique_values)| unique_inputs.len() >= *unique_values);

        if !passes {
            let best_path = path_unique_counts
                .iter()
                .max_by_key(|(_, count)| *count)
                .unwrap();
            return Err(format!(
                "Task [{}]: compiled function inputs have {} unique variations \
                 across {} example inputs, but the input value at '{}' has \
                 {} unique variations — function inputs must derive from the \
                 parent input, not use a fixed value",
                j,
                unique_inputs.len(),
                inputs.len(),
                best_path.0,
                best_path.1,
            ));
        }
    }

    Ok(())
}

/// Computes unique value counts for each path in the schema across all inputs.
/// Includes ALL properties (required and optional) and the root itself.
///
/// Returns `path_unique_counts` where only paths with ≥ 2 unique values are included.
fn compute_value_diversity(
    input_schema: &InputSchema,
    inputs: &[crate::functions::expression::Input],
) -> Vec<(String, usize)> {
    let value_paths = collect_value_paths(input_schema);
    let mut path_unique_counts: Vec<(String, usize)> =
        Vec::with_capacity(value_paths.len());

    for path in &value_paths {
        let mut seen = HashSet::new();
        for input in inputs {
            if let Some(value) = extract_value_at_path(input, path) {
                let key = serde_json::to_string(value).unwrap_or_default();
                seen.insert(key);
            }
        }
        if seen.len() >= 2 {
            let label = if path.is_empty() {
                "root".to_string()
            } else {
                path.join(".")
            };
            path_unique_counts.push((label, seen.len()));
        }
    }

    path_unique_counts
}

/// Collects all value paths in the input schema, including the root.
/// For objects, recurses into ALL properties (required and optional).
fn collect_value_paths(schema: &InputSchema) -> Vec<Vec<String>> {
    let mut paths = Vec::new();
    collect_value_paths_rec(schema, &[], &mut paths);
    paths
}

fn collect_value_paths_rec(
    schema: &InputSchema,
    prefix: &[String],
    paths: &mut Vec<Vec<String>>,
) {
    // Every node is a valid path (the root, any property, nested property, etc.)
    paths.push(prefix.to_vec());

    if let InputSchema::Object(obj) = schema {
        for (name, prop_schema) in &obj.properties {
            let mut child = prefix.to_vec();
            child.push(name.clone());
            collect_value_paths_rec(prop_schema, &child, paths);
        }
    }
}

/// Extracts the value at a given path from an input.
fn extract_value_at_path<'a>(
    input: &'a crate::functions::expression::Input,
    path: &[String],
) -> Option<&'a crate::functions::expression::Input> {
    use crate::functions::expression::Input;

    let mut current = input;
    for segment in path {
        match current {
            Input::Object(obj) => {
                current = obj.get(segment)?;
            }
            _ => return None,
        }
    }
    Some(current)
}

/// Shared logic: computes unique array counts for each array path in the schema
/// across all example inputs.
///
/// Returns `(array_paths, path_unique_counts)` where `path_unique_counts`
/// only includes paths with ≥ 2 unique arrays.
fn compute_array_diversity(
    input_schema: &InputSchema,
    inputs: &[crate::functions::expression::Input],
) -> (Vec<Vec<String>>, Vec<(String, usize)>) {
    let array_paths = collect_array_paths(input_schema);
    let mut path_unique_counts: Vec<(String, usize)> =
        Vec::with_capacity(array_paths.len());

    for path in &array_paths {
        let mut seen = HashSet::new();
        for input in inputs {
            if let Some(arr) = extract_array_at_path(input, path) {
                let key = serde_json::to_string(arr).unwrap_or_default();
                seen.insert(key);
            }
        }
        if seen.len() >= 2 {
            let label = if path.is_empty() {
                "root".to_string()
            } else {
                path.join(".")
            };
            path_unique_counts.push((label, seen.len()));
        }
    }

    (array_paths, path_unique_counts)
}

/// Collects all paths to arrays in the input schema.
/// Each path is a `Vec<String>` — empty means the root is an array,
/// `["items"]` means `input.items` is an array, etc.
/// Only required properties of objects are traversed.
fn collect_array_paths(schema: &InputSchema) -> Vec<Vec<String>> {
    let mut paths = Vec::new();
    collect_array_paths_rec(schema, &[], &mut paths);
    paths
}

fn collect_array_paths_rec(
    schema: &InputSchema,
    prefix: &[String],
    paths: &mut Vec<Vec<String>>,
) {
    match schema {
        InputSchema::Array(_) => {
            paths.push(prefix.to_vec());
        }
        InputSchema::Object(obj) => {
            let required = obj.required.as_deref().unwrap_or(&[]);
            for (name, prop_schema) in &obj.properties {
                if required.contains(name) {
                    let mut new_prefix = prefix.to_vec();
                    new_prefix.push(name.clone());
                    collect_array_paths_rec(prop_schema, &new_prefix, paths);
                }
            }
        }
        _ => {} // leaf types — no arrays
    }
}

/// Extracts the array at a given path from an input value.
fn extract_array_at_path<'a>(
    input: &'a crate::functions::expression::Input,
    path: &[String],
) -> Option<&'a Vec<crate::functions::expression::Input>> {
    use crate::functions::expression::Input;

    let mut current = input;
    for segment in path {
        match current {
            Input::Object(obj) => {
                current = obj.get(segment)?;
            }
            _ => return None,
        }
    }

    match current {
        Input::Array(arr) => Some(arr),
        _ => None,
    }
}

/// Validates that every compiled input_maps sub-array is referenced by at
/// least one task's `map` field, and that no task references an out-of-bounds
/// index.
///
/// This check operates on **compiled** input_maps (not the raw expressions),
/// because `InputMaps::One` can produce a variable number of sub-arrays
/// depending on the input.
///
/// If the function has no `input_maps`, this is a no-op.
pub(super) fn check_no_unused_input_maps(
    function: &RemoteFunction,
) -> Result<(), String> {
    // Only applies if input_maps is present
    if function.input_maps().is_none() {
        return Ok(());
    }

    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);
    if inputs.is_empty() {
        return Ok(());
    }

    // Collect all task map indices
    let task_map_indices: HashSet<u64> = function
        .tasks()
        .iter()
        .filter_map(|t| t.input_map())
        .collect();

    for (i, input) in inputs.iter().enumerate() {
        let func = Function::Remote(function.clone());
        let compiled = func.compile_input_maps(input).map_err(|e| {
            format!("Input [{}]: input_maps compilation failed: {}", i, e)
        })?;

        let Some(compiled_maps) = compiled else {
            continue;
        };

        let len = compiled_maps.len() as u64;

        // Check no task references an out-of-bounds index
        for &idx in &task_map_indices {
            if idx >= len {
                return Err(format!(
                    "Input [{}]: task has map index {} but compiled \
                     input_maps has only {} sub-arrays",
                    i, idx, len
                ));
            }
        }

        // Check every index is referenced by at least one task
        for idx in 0..len {
            if !task_map_indices.contains(&idx) {
                return Err(format!(
                    "Input [{}]: compiled input_maps has {} sub-arrays \
                     but index {} is not referenced by any task's map field",
                    i, len, idx
                ));
            }
        }
    }

    Ok(())
}

/// Checks that a compiled message's content is parts, not a plain string.
fn check_compiled_message_content(
    location: &str,
    msg_index: usize,
    msg: &Message,
) -> Result<(), String> {
    match msg {
        Message::Developer(dev) => {
            if matches!(dev.content, SimpleContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (developer): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
        Message::System(sys) => {
            if matches!(sys.content, SimpleContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (system): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
        Message::User(user) => {
            if matches!(user.content, RichContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (user): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
        Message::Assistant(asst) => {
            if let Some(content) = &asst.content {
                if matches!(content, RichContent::Text(_)) {
                    return Err(format!(
                        "{}, message [{}] (assistant): compiled content must be an array of \
                         content parts, not a plain string",
                        location, msg_index
                    ));
                }
            }
        }
        Message::Tool(tool) => {
            if matches!(tool.content, RichContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (tool): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
    }
    Ok(())
}
