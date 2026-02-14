//! Quality checks for branch vector functions (depth > 0: function/placeholder tasks only).

use crate::functions::{RemoteFunction, TaskExpression};

use super::check_leaf_vector_function::check_vector_input_schema;
use super::check_vector_fields::{VectorFieldsValidation, check_vector_fields};
use super::compile_and_validate::compile_and_validate_task_inputs;

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

    // 1. Input schema check
    check_vector_input_schema(input_schema)?;

    // 2-6. Check each task and count mapped scalar vs unmapped vector
    let mut mapped_scalar_count: usize = 0;
    let mut unmapped_vector_count: usize = 0;

    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::ScalarFunction(sf) => {
                // 3. Scalar-like must have map
                if sf.map.is_none() {
                    return Err(format!(
                        "Task [{}]: scalar.function in a vector function must have map \
                         (scalar-like tasks must be mapped to produce vector output)",
                        i
                    ));
                }
                mapped_scalar_count += 1;
            }
            TaskExpression::PlaceholderScalarFunction(psf) => {
                // 3. Scalar-like must have map
                if psf.map.is_none() {
                    return Err(format!(
                        "Task [{}]: placeholder.scalar.function in a vector function must have map \
                         (scalar-like tasks must be mapped to produce vector output)",
                        i
                    ));
                }
                mapped_scalar_count += 1;
            }
            TaskExpression::VectorFunction(vf) => {
                // 4. Vector-like must NOT have map
                if vf.map.is_some() {
                    return Err(format!(
                        "Task [{}]: vector.function in a vector function must not have map \
                         (vector-like tasks are already vector-producing)",
                        i
                    ));
                }
                unmapped_vector_count += 1;
            }
            TaskExpression::PlaceholderVectorFunction(pvf) => {
                // 4. Vector-like must NOT have map
                if pvf.map.is_some() {
                    return Err(format!(
                        "Task [{}]: placeholder.vector.function in a vector function must not \
                         have map (vector-like tasks are already vector-producing)",
                        i
                    ));
                }
                unmapped_vector_count += 1;
            }
            TaskExpression::VectorCompletion(_) => {
                return Err(format!(
                    "Task [{}]: branch functions must not contain vector.completion tasks",
                    i
                ));
            }
        }
    }

    let total = mapped_scalar_count + unmapped_vector_count;

    // 5. If only 1 task, it must be unmapped vector
    if total == 1 && unmapped_vector_count == 0 {
        return Err(
            "A branch vector function with a single task must use an unmapped \
             vector-like task (vector.function or placeholder.vector.function)"
                .to_string(),
        );
    }

    // 6. At most 50% of tasks may be mapped scalar
    if total > 1 && mapped_scalar_count * 2 > total {
        return Err(format!(
            "At most 50% of tasks in a branch vector function may be mapped scalar-like, \
             found {}/{} ({:.0}%)",
            mapped_scalar_count,
            total,
            (mapped_scalar_count as f64 / total as f64) * 100.0
        ));
    }

    // 7. Vector fields round-trip validation
    check_vector_fields(VectorFieldsValidation {
        input_schema: input_schema.clone(),
        output_length: output_length.clone(),
        input_split: input_split.clone(),
        input_merge: input_merge.clone(),
    })?;

    // 8. Compile tasks with example inputs and validate placeholder inputs
    compile_and_validate_task_inputs(function)?;

    Ok(())
}
