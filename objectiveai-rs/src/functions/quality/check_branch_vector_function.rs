//! Quality checks for branch vector functions (depth > 0: function/placeholder tasks only).

use std::collections::{HashMap, HashSet};

use crate::functions::expression::{Input, Params, ParamsRef};
use crate::functions::{CompiledTask, Function, RemoteFunction, TaskExpression};

use super::check_description::check_description;
use super::check_input_schema::check_input_schema;
use super::check_output_expression::{
    VectorOutputShape, check_vector_distribution,
};
use super::check_leaf_vector_function::check_vector_input_schema;
use super::check_scalar_fields::{ScalarFieldsValidation, check_scalar_fields};
use super::check_vector_fields::{
    VectorFieldsValidation, check_vector_fields, check_vector_fields_for_input,
    random_subsets,
};
use super::compile_and_validate::{
    compile_and_validate_one_input, extract_task_input, extract_task_input_value,
};
use super::example_inputs;

/// Validates quality requirements for a branch vector function.
///
/// Branch vector functions are at depth > 0 and contain only function or
/// placeholder tasks (no vector.completion). Each task must be either:
/// - A mapped scalar-like task (scalar.function or placeholder.scalar.function WITH map)
/// - An unmapped vector-like task (vector.function or placeholder.vector.function WITHOUT map)
///
/// # Checks
///
/// 1. Input schema must be an array or an object with at least one required array property
/// 2. No `vector.completion` tasks (branch functions delegate to child functions)
/// 3. Scalar-like tasks must have `map` (they produce scalar output, need mapping for vector)
/// 4. Vector-like tasks must NOT have `map` (they already produce vector output)
/// 5. If only 1 task, it must be unmapped vector
/// 6. At most 50% of tasks may be mapped scalar
/// 7. Vector fields (output_length, input_split, input_merge) round-trip correctly
/// 8. Example inputs compile successfully and placeholder task inputs match their schemas
pub fn check_branch_vector_function(
    function: &RemoteFunction,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let (
        description,
        input_schema,
        tasks,
        output_length,
        input_split,
        input_merge,
    ) = match function {
        RemoteFunction::Vector {
            description,
            input_schema,
            tasks,
            output_length,
            input_split,
            input_merge,
            ..
        } => (
            description,
            input_schema,
            tasks,
            output_length,
            input_split,
            input_merge,
        ),
        RemoteFunction::Scalar { .. } => {
            return Err(
                "BV01: Expected vector function, got scalar function".to_string()
            );
        }
    };

    // Description
    check_description(description)?;

    // Input schema permutations
    check_input_schema(input_schema)?;

    // Input schema check
    check_vector_input_schema(input_schema)?;

    // Must have at least one task
    if tasks.is_empty() {
        return Err("BV02: Functions must have at least one task".to_string());
    }

    // Check each task and count mapped scalar vs unmapped vector
    let mut mapped_scalar_count: usize = 0;
    let mut unmapped_vector_count: usize = 0;

    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::ScalarFunction(sf) => {
                // Scalar-like must have map
                if sf.map.is_none() {
                    return Err(format!(
                        "BV03: Task [{}]: scalar.function in a vector function must have map \
                         (scalar-like tasks must be mapped to produce vector output)",
                        i
                    ));
                }
                mapped_scalar_count += 1;
            }
            TaskExpression::PlaceholderScalarFunction(psf) => {
                // Scalar-like must have map
                if psf.map.is_none() {
                    return Err(format!(
                        "BV04: Task [{}]: placeholder.scalar.function in a vector function must have map \
                         (scalar-like tasks must be mapped to produce vector output)",
                        i
                    ));
                }
                mapped_scalar_count += 1;
            }
            TaskExpression::VectorFunction(vf) => {
                // Vector-like must NOT have map
                if vf.map.is_some() {
                    return Err(format!(
                        "BV05: Task [{}]: vector.function in a vector function must not have map \
                         (vector-like tasks are already vector-producing)",
                        i
                    ));
                }
                unmapped_vector_count += 1;
            }
            TaskExpression::PlaceholderVectorFunction(pvf) => {
                // Vector-like must NOT have map
                if pvf.map.is_some() {
                    return Err(format!(
                        "BV06: Task [{}]: placeholder.vector.function in a vector function must not \
                         have map (vector-like tasks are already vector-producing)",
                        i
                    ));
                }
                unmapped_vector_count += 1;
            }
            TaskExpression::VectorCompletion(_) => {
                return Err(format!(
                    "BV07: Task [{}]: branch functions must not contain vector.completion tasks",
                    i
                ));
            }
        }
    }

    let total = mapped_scalar_count + unmapped_vector_count;

    // If only 1 task, it must be unmapped vector
    if total == 1 && unmapped_vector_count == 0 {
        return Err(
            "BV08: A branch vector function with a single task must use an unmapped \
             vector-like task (vector.function or placeholder.vector.function)"
                .to_string(),
        );
    }

    // At most 50% of tasks may be mapped scalar
    if total > 1 && mapped_scalar_count * 2 > total {
        return Err(format!(
            "BV09: At most 50% of tasks in a branch vector function may be mapped scalar-like, \
             found {}/{} ({:.0}%)",
            mapped_scalar_count,
            total,
            (mapped_scalar_count as f64 / total as f64) * 100.0
        ));
    }

    // --- Single generate() loop ---
    let vector_fields = VectorFieldsValidation {
        input_schema: input_schema.clone(),
        output_length: output_length.clone(),
        input_split: input_split.clone(),
        input_merge: input_merge.clone(),
    };
    let func_template = Function::Remote(function.clone());
    let task_count = tasks.len();

    // Input maps validation setup
    let has_input_maps = function.input_maps().is_some();
    let task_map_indices: HashSet<u64> = function
        .tasks()
        .iter()
        .filter_map(|t| t.input_map())
        .collect();

    // Function input diversity tracking
    let mut per_task_inputs: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];
    // Mapped scalar per-index diversity
    let mut per_task_indexed: Vec<HashMap<usize, (usize, HashSet<String>)>> =
        vec![HashMap::new(); task_count];
    // Mapped scalar inputs not all equal
    let mut per_task_has_varying = vec![false; task_count];
    let mut per_task_is_mapped = vec![false; task_count];
    let mut per_task_skipped = vec![false; task_count];
    let mut seen_dist_tasks: HashSet<(usize, usize)> = HashSet::new();
    let mut count = 0usize;
    let mut merged_count = 0usize;

    for (i, ref input) in example_inputs::generate(input_schema).enumerate() {
        count += 1;

        // Input maps validation
        if has_input_maps {
            let compiled = func_template
                .clone()
                .compile_input_maps(input)
                .map_err(|e| {
                    format!(
                        "BV10: Input [{}]: input_maps compilation failed: {}",
                        i, e
                    )
                })?;

            if let Some(compiled_maps) = compiled {
                let len = compiled_maps.len() as u64;
                for &idx in &task_map_indices {
                    if idx >= len {
                        return Err(format!(
                            "BV11: Input [{}]: task has map index {} but compiled \
                             input_maps has only {} sub-arrays",
                            i, idx, len
                        ));
                    }
                }
                for idx in 0..len {
                    if !task_map_indices.contains(&idx) {
                        return Err(format!(
                            "BV12: Input [{}]: compiled input_maps has {} sub-arrays \
                             but index {} is not referenced by any task's map field",
                            i, len, idx
                        ));
                    }
                }
            }
        }

        // Vector fields validation
        check_vector_fields_for_input(&vector_fields, i, input)?;

        // Compile and validate
        let compiled_tasks =
            compile_and_validate_one_input(i, function, input, children)?;

        // Output expression distribution check (once per task+length pair)
        {
            let params = Params::Ref(ParamsRef {
                input,
                output: None,
                map: None,
            });
            let ol = output_length
                .clone()
                .compile_one(&params)
                .unwrap_or(0) as usize;

            for (j, compiled_task) in compiled_tasks.iter().enumerate() {
                match compiled_task {
                    Some(CompiledTask::Many(tasks)) => {
                        // Mapped scalar: key = (j, tasks.len())
                        let key = (j, tasks.len());
                        if seen_dist_tasks.insert(key) {
                            if let Some(first) = tasks.first() {
                                check_vector_distribution(
                                    j,
                                    input,
                                    first,
                                    &VectorOutputShape::MapScalar(tasks.len()),
                                    ol,
                                )?;
                            }
                        }
                    }
                    Some(CompiledTask::One(task)) => {
                        // Unmapped vector: key = (j, output_length)
                        let key = (j, ol);
                        if seen_dist_tasks.insert(key) {
                            check_vector_distribution(
                                j,
                                input,
                                task,
                                &VectorOutputShape::Vector(ol as u64),
                                ol,
                            )?;
                        }
                    }
                    None => {}
                }
            }
        }

        // Track per-task input diversity + mapped scalar diversity
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                per_task_skipped[j] = true;
                continue;
            };

            // Function input diversity
            let key = match compiled_task {
                CompiledTask::One(task) => extract_task_input(task),
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

            // Mapped scalar per-index diversity + not-all-equal
            if let CompiledTask::Many(tasks) = compiled_task {
                per_task_is_mapped[j] = true;

                // Per-index diversity
                for (mi, task) in tasks.iter().enumerate() {
                    if let Some(task_input) = extract_task_input_value(task) {
                        let k = serde_json::to_string(task_input)
                            .unwrap_or_default();
                        let entry = per_task_indexed[j]
                            .entry(mi)
                            .or_insert_with(|| (0, HashSet::new()));
                        entry.0 += 1;
                        entry.1.insert(k);
                    }
                }

                // Not all equal
                if !per_task_has_varying[j] && tasks.len() >= 2 {
                    let first = extract_task_input_value(&tasks[0])
                        .map(|v| serde_json::to_string(v).unwrap_or_default());
                    let has_different = tasks[1..].iter().any(|t| {
                        extract_task_input_value(t)
                            .map(|v| {
                                serde_json::to_string(v).unwrap_or_default()
                            })
                            != first
                    });
                    if has_different {
                        per_task_has_varying[j] = true;
                    }
                }
            }
        }

        // Merged sub-inputs validation
        let splits = func_template
            .clone()
            .compile_input_split(input)
            .map_err(|e| {
                format!(
                    "BV13: Merged input validation, input [{}]: input_split failed: {}",
                    i, e
                )
            })?
            .ok_or_else(|| {
                format!(
                    "BV14: Merged input validation, input [{}]: input_split returned None",
                    i
                )
            })?;

        if splits.len() >= 2 {
            let subsets = random_subsets(splits.len(), 3);
            for subset in &subsets {
                let sub_splits: Vec<Input> =
                    subset.iter().map(|&idx| splits[idx].clone()).collect();
                let merge_input = Input::Array(sub_splits);
                let merged = func_template
                    .clone()
                    .compile_input_merge(&merge_input)
                    .map_err(|e| {
                        format!(
                            "BV15: Merged input validation, input [{}], subset {:?}: \
                             input_merge failed: {}",
                            i, subset, e
                        )
                    })?
                    .ok_or_else(|| {
                        format!(
                            "BV16: Merged input validation, input [{}], subset {:?}: \
                             input_merge returned None",
                            i, subset
                        )
                    })?;
                compile_and_validate_one_input(
                    merged_count, function, &merged, children,
                )?;
                merged_count += 1;
            }
        }
    }

    if count == 0 {
        return Err(
            "BV17: Failed to generate any example inputs from input_schema"
                .to_string(),
        );
    }

    // Post-loop diversity checks
    if count >= 2 {
        // Function input diversity
        for (j, unique_inputs) in per_task_inputs.iter().enumerate() {
            let effective = unique_inputs.len()
                + if per_task_skipped[j] { 1 } else { 0 };
            if effective < 2 {
                return Err(format!(
                    "BV18: Task [{}]: task input is a fixed value — task inputs must \
                     be derived from the parent input, otherwise the score is useless",
                    j,
                ));
            }
        }

        // Mapped scalar per-index diversity
        for (j, indexed) in per_task_indexed.iter().enumerate() {
            for (&mi, (occurrences, unique_inputs)) in indexed {
                let total = *occurrences
                    + if per_task_skipped[j] { 1 } else { 0 };
                if total <= 1 {
                    continue;
                }
                let effective = unique_inputs.len()
                    + if per_task_skipped[j] { 1 } else { 0 };
                if effective < 2 {
                    return Err(format!(
                        "BV19: Task [{}]: mapped input at index {} is a fixed value — \
                         mapped inputs must be derived from the parent input",
                        j, mi,
                    ));
                }
            }
        }

        // Mapped scalar inputs not all equal
        for (j, has_varying) in per_task_has_varying.iter().enumerate() {
            if !per_task_is_mapped[j] {
                continue;
            }
            if !has_varying && !per_task_skipped[j] {
                return Err(format!(
                    "BV20: Task [{}]: all mapped inputs are equal to each other for \
                     every example input — rankings are useless if every item \
                     is the same",
                    j,
                ));
            }
        }
    }

    // Validate placeholder task fields as if they were standalone functions
    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::PlaceholderScalarFunction(psf) => {
                check_scalar_fields(ScalarFieldsValidation {
                    input_schema: psf.input_schema.clone(),
                })
                .map_err(|e| {
                    format!(
                        "BV21: Task [{}]: placeholder scalar field validation failed: {}",
                        i, e
                    )
                })?;
            }
            TaskExpression::PlaceholderVectorFunction(pvf) => {
                check_vector_fields(VectorFieldsValidation {
                    input_schema: pvf.input_schema.clone(),
                    output_length: pvf.output_length.clone(),
                    input_split: pvf.input_split.clone(),
                    input_merge: pvf.input_merge.clone(),
                })
                .map_err(|e| {
                    format!(
                        "BV22: Task [{}]: placeholder vector field validation failed: {}",
                        i, e
                    )
                })?;
            }
            _ => {}
        }
    }

    Ok(())
}
