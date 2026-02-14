//! Quality checks for leaf vector functions (depth 0: vector.completion tasks only).

use crate::functions::expression::InputSchema;
use crate::functions::{RemoteFunction, TaskExpression};

use super::check_leaf_scalar_function::check_vector_completion_content;
use super::check_vector_fields::{VectorFieldsValidation, check_vector_fields};

/// Validates quality requirements for a leaf vector function.
///
/// Leaf vector functions are at depth 0 and contain only vector.completion tasks.
///
/// # Checks
///
/// 1. Input schema must be an array or an object with at least one required array property
/// 2. All tasks must be `vector.completion`
/// 3. No `map` on vector.completion tasks
/// 4. Message content must be content parts arrays, not plain strings
/// 5. Response content must be content parts arrays, not plain strings
/// 6. Vector fields (output_length, input_split, input_merge) round-trip correctly
pub fn check_leaf_vector_function(
    function: &RemoteFunction,
) -> Result<(), String> {
    let (input_schema, tasks, output_length, input_split, input_merge) =
        match function {
            RemoteFunction::Vector {
                input_schema,
                tasks,
                output_length,
                input_split,
                input_merge,
                ..
            } => (input_schema, tasks, output_length, input_split, input_merge),
            RemoteFunction::Scalar { .. } => {
                return Err(
                    "Expected vector function, got scalar function".to_string()
                );
            }
        };

    // 1. Input schema must be array or object with ≥1 required array property
    check_vector_input_schema(input_schema)?;

    // 2. All tasks must be vector.completion, no map, content parts only
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
                // 4 & 5. Check content parts
                check_vector_completion_content(i, vc)?;
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

    // 6. Vector fields round-trip validation
    check_vector_fields(VectorFieldsValidation {
        input_schema: input_schema.clone(),
        output_length: output_length.clone(),
        input_split: input_split.clone(),
        input_merge: input_merge.clone(),
    })?;

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
