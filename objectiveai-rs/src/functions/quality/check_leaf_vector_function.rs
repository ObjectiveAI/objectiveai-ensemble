//! Quality checks for leaf vector functions (depth 0: vector.completion tasks only).

use std::collections::{HashMap, HashSet};

use crate::functions::expression::{Input, InputSchema};
use crate::functions::{CompiledTask, Function, RemoteFunction, Task, TaskExpression};

use super::check_description::check_description;
use super::check_input_schema::check_input_schema;
use super::check_output_expression::{
    VectorOutputShape, check_vector_distribution,
};
use super::check_leaf_scalar_function::{
    check_vector_completion_messages, check_vector_vector_completion_responses,
};
use super::check_modalities::{
    ModalityFlags, check_modality_coverage, collect_schema_modalities,
    collect_task_modalities,
};
use super::check_vector_fields::{
    VectorFieldsValidation, check_vector_fields_for_input, random_subsets,
};
use super::compile_and_validate::compile_and_validate_one_input;
use super::example_inputs;

/// Validates quality requirements for a leaf vector function.
///
/// Leaf vector functions are at depth 0 and contain only vector.completion tasks.
///
/// # Checks
///
/// 1. No `input_maps` — leaf vector tasks are never mapped
/// 2. Input schema must be an array or an object with at least one required array property
/// 3. All tasks must be `vector.completion`
/// 4. No `map` on vector.completion tasks
/// 5. Message content must be content parts arrays, not plain strings
/// 6. Response content must be content parts arrays, not plain strings
/// 7. Vector fields (output_length, input_split, input_merge) round-trip correctly
pub fn check_leaf_vector_function(
    function: &RemoteFunction,
) -> Result<(), String> {
    let (
        description,
        input_maps,
        input_schema,
        tasks,
        output_length,
        input_split,
        input_merge,
    ) = match function {
        RemoteFunction::Vector {
            description,
            input_maps,
            input_schema,
            tasks,
            output_length,
            input_split,
            input_merge,
            ..
        } => (
            description,
            input_maps,
            input_schema,
            tasks,
            output_length,
            input_split,
            input_merge,
        ),
        RemoteFunction::Scalar { .. } => {
            return Err(
                "LV01: Expected vector function, got scalar function".to_string()
            );
        }
    };

    // Description
    check_description(description)?;

    // Input schema permutations
    check_input_schema(input_schema)?;

    // No input_maps
    if input_maps.is_some() {
        return Err(
            "LV02: Leaf vector functions must not have input_maps".to_string()
        );
    }

    // Input schema must be array or object with ≥1 required array property
    check_vector_input_schema(input_schema)?;

    // Must have at least one task
    if tasks.is_empty() {
        return Err("LV03: Functions must have at least one task".to_string());
    }

    // All tasks must be vector.completion, no map, content parts only
    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::VectorCompletion(vc) => {
                // No map
                if vc.map.is_some() {
                    return Err(format!(
                        "LV04: Task [{}]: vector.completion tasks must not have map",
                        i
                    ));
                }
                // Check message content parts
                check_vector_completion_messages(i, vc)?;
                // Responses must be a single expression
                check_vector_vector_completion_responses(i, vc)?;
            }
            TaskExpression::ScalarFunction(_) => {
                return Err(format!(
                    "LV05: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found scalar.function",
                    i
                ));
            }
            TaskExpression::VectorFunction(_) => {
                return Err(format!(
                    "LV06: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found vector.function",
                    i
                ));
            }
            TaskExpression::PlaceholderScalarFunction(_) => {
                return Err(format!(
                    "LV07: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found placeholder.scalar.function",
                    i
                ));
            }
            TaskExpression::PlaceholderVectorFunction(_) => {
                return Err(format!(
                    "LV08: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found placeholder.vector.function",
                    i
                ));
            }
        }
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

    // Response diversity tracking: per_task_indexed[j][i] = (occurrences, unique_values)
    let mut per_task_indexed: Vec<HashMap<usize, (usize, HashSet<String>)>> =
        vec![HashMap::new(); task_count];
    // Responses not all equal tracking
    let mut per_task_has_varying = vec![false; task_count];
    let mut per_task_skipped = vec![false; task_count];
    let mut seen_dist_tasks: HashSet<(usize, usize)> = HashSet::new();
    let mut count = 0usize;


    // Multimodal coverage tracking
    let mut schema_modalities: ModalityFlags = [false; 4];
    collect_schema_modalities(input_schema, &mut schema_modalities);
    let mut task_modalities: ModalityFlags = [false; 4];

    for ref input in example_inputs::generate(input_schema) {
        count += 1;
        let input_label = serde_json::to_string(input).unwrap_or_default();

        // Compile and validate
        let compiled_tasks =
            compile_and_validate_one_input(&input_label, function, input, None)?;

        // Output expression distribution check (once per task+response_count)
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            if let Some(CompiledTask::One(Task::VectorCompletion(vc))) =
                compiled_task
            {
                let key = (j, vc.responses.len());
                if seen_dist_tasks.insert(key) {
                    let ol = func_template
                        .clone()
                        .compile_output_length(input)
                        .ok()
                        .flatten()
                        .unwrap_or(0) as usize;
                    check_vector_distribution(
                        j,
                        input,
                        &Task::VectorCompletion(vc.clone()),
                        &VectorOutputShape::VectorCompletion(
                            vc.responses.len(),
                        ),
                        ol,
                    )?;
                }
            }
        }

        // Track response diversity and responses-not-all-equal
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                per_task_skipped[j] = true;
                continue;
            };
            if let CompiledTask::One(Task::VectorCompletion(vc)) = compiled_task
            {
                collect_task_modalities(vc, &mut task_modalities);

                // Response diversity: per-index tracking
                for (ri, response) in vc.responses.iter().enumerate() {
                    let key =
                        serde_json::to_string(response).unwrap_or_default();
                    let entry = per_task_indexed[j]
                        .entry(ri)
                        .or_insert_with(|| (0, HashSet::new()));
                    entry.0 += 1;
                    entry.1.insert(key);
                }

                // Responses not all equal
                if !per_task_has_varying[j] && vc.responses.len() >= 2 {
                    let first = serde_json::to_string(&vc.responses[0])
                        .unwrap_or_default();
                    let has_different = vc.responses[1..].iter().any(|r| {
                        serde_json::to_string(r).unwrap_or_default() != first
                    });
                    if has_different {
                        per_task_has_varying[j] = true;
                    }
                }
            }
        }

        // Vector fields validation
        check_vector_fields_for_input(&vector_fields, &input_label, input)?;

        // Merged sub-inputs validation
        let splits = func_template
            .clone()
            .compile_input_split(input)
            .map_err(|e| {
                format!(
                    "LV09: Merged input validation, input {}: input_split failed: {}",
                    input_label, e
                )
            })?
            .ok_or_else(|| {
                format!(
                    "LV10: Merged input validation, input {}: input_split returned None",
                    input_label
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
                            "LV11: Merged input validation, input {}, subset {:?}: \
                             input_merge failed: {}",
                            input_label, subset, e
                        )
                    })?
                    .ok_or_else(|| {
                        format!(
                            "LV12: Merged input validation, input {}, subset {:?}: \
                             input_merge returned None",
                            input_label, subset
                        )
                    })?;
                let merged_label =
                    serde_json::to_string(&merged).unwrap_or_default();
                compile_and_validate_one_input(
                    &merged_label, function, &merged, None,
                )?;
            }
        }
    }

    if count == 0 {
        return Err(
            "LV15: Failed to generate any example inputs from input_schema"
                .to_string(),
        );
    }

    // Post-loop: response diversity check
    if count >= 2 {
        for (j, indexed) in per_task_indexed.iter().enumerate() {
            for (&ri, (occurrences, unique_values)) in indexed {
                let total = *occurrences
                    + if per_task_skipped[j] { 1 } else { 0 };
                if total <= 1 {
                    continue;
                }
                let effective = unique_values.len()
                    + if per_task_skipped[j] { 1 } else { 0 };
                if effective < 2 {
                    return Err(format!(
                        "LV16: Task [{}]: response at index {} is a fixed value — \
                         responses must be derived from an array in the input",
                        j, ri,
                    ));
                }
            }
        }

        // Responses not all equal check
        for (j, has_varying) in per_task_has_varying.iter().enumerate() {
            if !has_varying && !per_task_skipped[j] {
                return Err(format!(
                    "LV17: Task [{}]: all responses are equal to each other for every \
                     example input — rankings are useless if every item is the same",
                    j,
                ));
            }
        }
    }

    // Multimodal coverage: every modality in the schema must appear in some task
    check_modality_coverage(&schema_modalities, &task_modalities, "LV18")?;

    Ok(())
}

/// Checks that an input schema is valid for a vector function:
/// either an array, or an object with at least one required array property.
pub(super) fn check_vector_input_schema(
    input_schema: &InputSchema,
) -> Result<(), String> {
    match input_schema {
        InputSchema::Array(_) => Ok(()),
        InputSchema::Object(obj) => {
            let required = obj.required.as_deref().unwrap_or(&[]);
            let has_required_array =
                obj.properties.iter().any(|(name, schema)| {
                    required.contains(name)
                        && matches!(schema, InputSchema::Array(_))
                });
            if has_required_array {
                Ok(())
            } else {
                Err(
                    "LV13: Vector function input_schema must be an array, or an object with \
                     at least one required array property"
                        .to_string(),
                )
            }
        }
        _ => Err(
            "LV14: Vector function input_schema must be an array, or an object with \
             at least one required array property"
                .to_string(),
        ),
    }
}
