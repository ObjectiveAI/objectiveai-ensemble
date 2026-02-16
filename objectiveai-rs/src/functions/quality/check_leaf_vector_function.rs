//! Quality checks for leaf vector functions (depth 0: vector.completion tasks only).

use crate::functions::expression::InputSchema;
use crate::functions::{Function, RemoteFunction, TaskExpression};

use super::check_description::check_description;
use super::check_leaf_scalar_function::{
    check_vector_completion_messages, check_vector_vector_completion_responses,
};
use super::check_vector_fields::{
    VectorFieldsValidation, check_vector_fields, random_subsets,
};
use super::compile_and_validate::{
    compile_and_validate_for_inputs, compile_and_validate_task_inputs,
    validate_response_diversity,
};
use super::example_inputs::generate_example_inputs;

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
    let (description, input_maps, input_schema, tasks, output_length, input_split, input_merge) =
        match function {
            RemoteFunction::Vector {
                description,
                input_maps,
                input_schema,
                tasks,
                output_length,
                input_split,
                input_merge,
                ..
            } => (description, input_maps, input_schema, tasks, output_length, input_split, input_merge),
            RemoteFunction::Scalar { .. } => {
                return Err(
                    "Expected vector function, got scalar function".to_string()
                );
            }
        };

    // 1. Description
    check_description(description)?;

    // 2. No input_maps
    if input_maps.is_some() {
        return Err("Leaf vector functions must not have input_maps".to_string());
    }

    // 2. Input schema must be array or object with ≥1 required array property
    check_vector_input_schema(input_schema)?;

    // 2. Must have at least one task
    if tasks.is_empty() {
        return Err("Functions must have at least one task".to_string());
    }

    // 3. All tasks must be vector.completion, no map, content parts only
    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::VectorCompletion(vc) => {
                // 3. No map
                if vc.map.is_some() {
                    return Err(format!(
                        "Task [{}]: vector.completion tasks must not have map",
                        i
                    ));
                }
                // 4. Check message content parts
                check_vector_completion_messages(i, vc)?;
                // 5. Responses must be a single expression
                check_vector_vector_completion_responses(i, vc)?;
            }
            TaskExpression::ScalarFunction(_) => {
                return Err(format!(
                    "Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found scalar.function",
                    i
                ));
            }
            TaskExpression::VectorFunction(_) => {
                return Err(format!(
                    "Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found vector.function",
                    i
                ));
            }
            TaskExpression::PlaceholderScalarFunction(_) => {
                return Err(format!(
                    "Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found placeholder.scalar.function",
                    i
                ));
            }
            TaskExpression::PlaceholderVectorFunction(_) => {
                return Err(format!(
                    "Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found placeholder.vector.function",
                    i
                ));
            }
        }
    }

    // Compile tasks against example inputs and validate compiled output
    compile_and_validate_task_inputs(function, None)?;

    // 7. Response diversity — compiled responses must vary with input
    validate_response_diversity(function)?;

    // 9. Vector fields round-trip validation
    check_vector_fields(VectorFieldsValidation {
        input_schema: input_schema.clone(),
        output_length: output_length.clone(),
        input_split: input_split.clone(),
        input_merge: input_merge.clone(),
    })?;

    // 10. Compile and validate tasks for merged sub-inputs
    validate_tasks_for_merged_inputs(function, None)?;

    Ok(())
}

/// Generates example inputs, splits each, merges random subsets, and compiles
/// & validates the function's tasks against each merged input.
///
/// This validates that the function works correctly not just for "normal" inputs
/// but also for the merged sub-inputs produced during swiss_system execution.
pub(super) fn validate_tasks_for_merged_inputs(
    function: &RemoteFunction,
    children: Option<&std::collections::HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    let func_template = Function::Remote(function.clone());
    let mut merged_inputs = Vec::new();

    for (i, input) in inputs.iter().enumerate() {
        // Split the input
        let splits = func_template
            .clone()
            .compile_input_split(input)
            .map_err(|e| {
                format!(
                    "Merged input validation, input [{}]: input_split failed: {}",
                    i, e
                )
            })?
            .ok_or_else(|| {
                format!(
                    "Merged input validation, input [{}]: input_split returned None",
                    i
                )
            })?;

        if splits.len() < 2 {
            continue; // can't form meaningful subsets
        }

        // Generate random subsets and merge each
        let subsets = random_subsets(splits.len(), 3);
        for subset in &subsets {
            let sub_splits: Vec<crate::functions::expression::Input> =
                subset.iter().map(|&idx| splits[idx].clone()).collect();
            let merge_input =
                crate::functions::expression::Input::Array(sub_splits);
            let merged = func_template
                .clone()
                .compile_input_merge(&merge_input)
                .map_err(|e| {
                    format!(
                        "Merged input validation, input [{}], subset {:?}: \
                         input_merge failed: {}",
                        i, subset, e
                    )
                })?
                .ok_or_else(|| {
                    format!(
                        "Merged input validation, input [{}], subset {:?}: \
                         input_merge returned None",
                        i, subset
                    )
                })?;
            merged_inputs.push(merged);
        }
    }

    if !merged_inputs.is_empty() {
        compile_and_validate_for_inputs(function, &merged_inputs, children)?;
    }

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
                    "Vector function input_schema must be an array, or an object with \
                     at least one required array property"
                        .to_string(),
                )
            }
        }
        _ => Err(
            "Vector function input_schema must be an array, or an object with \
             at least one required array property"
                .to_string(),
        ),
    }
}
