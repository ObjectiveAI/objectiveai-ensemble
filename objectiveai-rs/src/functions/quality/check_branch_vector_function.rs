//! Quality checks for branch vector functions (depth > 0: function/placeholder tasks only).

use std::collections::HashMap;

use crate::functions::{RemoteFunction, TaskExpression};

use super::check_description::check_description;
use super::check_leaf_vector_function::{
    check_vector_input_schema, validate_tasks_for_merged_inputs,
};
use super::check_vector_fields::{VectorFieldsValidation, check_vector_fields};
use super::compile_and_validate::{
    check_no_unused_input_maps, compile_and_validate_task_inputs,
    validate_function_input_diversity, validate_mapped_scalar_input_diversity,
    validate_mapped_scalar_inputs_not_all_equal,
};

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
                "Expected vector function, got scalar function".to_string()
            );
        }
    };

    // 1. Description
    check_description(description)?;

    // 2. Input schema check
    check_vector_input_schema(input_schema)?;

    // 2. Must have at least one task
    if tasks.is_empty() {
        return Err("Functions must have at least one task".to_string());
    }

    // 3-7. Check each task and count mapped scalar vs unmapped vector
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

    // 7. No unused input_maps (compiled)
    check_no_unused_input_maps(function)?;

    // 8. Vector fields round-trip validation
    check_vector_fields(VectorFieldsValidation {
        input_schema: input_schema.clone(),
        output_length: output_length.clone(),
        input_split: input_split.clone(),
        input_merge: input_merge.clone(),
    })?;

    // 9. Compile tasks with example inputs and validate placeholder inputs
    compile_and_validate_task_inputs(function, children)?;

    // 10. Function input diversity — compiled inputs must vary with parent input
    validate_function_input_diversity(function)?;

    // 11. Mapped scalar per-index input diversity
    validate_mapped_scalar_input_diversity(function)?;

    // 12. Mapped scalar inputs not all equal within each input
    validate_mapped_scalar_inputs_not_all_equal(function)?;

    // 13. Compile and validate tasks for merged sub-inputs
    validate_tasks_for_merged_inputs(function, children)?;

    Ok(())
}
