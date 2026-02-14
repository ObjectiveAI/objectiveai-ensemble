//! Shared logic for compiling tasks with example inputs and validating
//! that placeholder task inputs match their embedded schemas.

use crate::functions::{CompiledTask, Function, RemoteFunction, Task};

use super::example_inputs::generate_example_inputs;

/// Generates example inputs from the function's input schema, compiles tasks
/// for each input, and validates that every placeholder task's compiled input
/// matches its embedded `input_schema`.
pub(super) fn compile_and_validate_task_inputs(
    function: &RemoteFunction,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.is_empty() {
        return Err("Failed to generate any example inputs from input_schema"
            .to_string());
    }

    for (i, input) in inputs.iter().enumerate() {
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
                    validate_task_input(i, j, None, task)?;
                }
                CompiledTask::Many(tasks) => {
                    for (k, task) in tasks.iter().enumerate() {
                        validate_task_input(i, j, Some(k), task)?;
                    }
                }
            }
        }
    }

    Ok(())
}

/// Validates that a compiled task's input matches its schema (for placeholder tasks).
fn validate_task_input(
    input_index: usize,
    task_index: usize,
    map_index: Option<usize>,
    task: &Task,
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
        // scalar.function and vector.function reference remote functions
        // whose schemas we don't have locally — skip validation
        Task::ScalarFunction(_) | Task::VectorFunction(_) => {}
        // vector.completion tasks shouldn't appear in branch functions,
        // but if they do that's caught by the structural checks above
        Task::VectorCompletion(_) => {}
    }

    Ok(())
}
