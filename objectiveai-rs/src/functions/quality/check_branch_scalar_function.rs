//! Quality checks for branch scalar functions (depth > 0: function/placeholder tasks only).

use std::collections::HashMap;

use crate::functions::{RemoteFunction, TaskExpression};

use super::check_description::check_description;
use super::compile_and_validate::{
    compile_and_validate_task_inputs, validate_scalar_function_input_diversity,
};

/// Validates quality requirements for a branch scalar function.
///
/// Branch scalar functions are at depth > 0 and contain only function or
/// placeholder tasks (no vector.completion).
///
/// # Checks
///
/// 1. No `input_maps` — scalar functions must not use input maps
/// 2. All tasks must be scalar-like: `scalar.function` or `placeholder.scalar.function`
/// 3. No `map` on any task — branch scalar tasks are never mapped
/// 4. No `vector.completion` tasks (branch functions delegate to child functions)
/// 5. No vector-like tasks (`vector.function`, `placeholder.vector.function`)
/// 6. Example inputs compile successfully and placeholder task inputs match their schemas
pub fn check_branch_scalar_function(
    function: &RemoteFunction,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let (description, input_maps, tasks) = match function {
        RemoteFunction::Scalar {
            description, input_maps, tasks, ..
        } => (description, input_maps, tasks),
        RemoteFunction::Vector { .. } => {
            return Err(
                "Expected scalar function, got vector function".to_string()
            );
        }
    };

    // 1. Description
    check_description(description)?;

    // 2. No input_maps
    if input_maps.is_some() {
        return Err("Scalar functions must not have input_maps".to_string());
    }

    // 2. Must have at least one task
    if tasks.is_empty() {
        return Err("Functions must have at least one task".to_string());
    }

    // 3-6. Check each task
    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::ScalarFunction(sf) => {
                // 3. No map
                if sf.map.is_some() {
                    return Err(format!(
                        "Task [{}]: branch scalar function tasks must not have map",
                        i
                    ));
                }
            }
            TaskExpression::PlaceholderScalarFunction(psf) => {
                // 3. No map
                if psf.map.is_some() {
                    return Err(format!(
                        "Task [{}]: branch scalar function tasks must not have map",
                        i
                    ));
                }
            }
            TaskExpression::VectorFunction(_) => {
                return Err(format!(
                    "Task [{}]: branch scalar functions must only contain scalar-like tasks, \
                     found vector.function",
                    i
                ));
            }
            TaskExpression::PlaceholderVectorFunction(_) => {
                return Err(format!(
                    "Task [{}]: branch scalar functions must only contain scalar-like tasks, \
                     found placeholder.vector.function",
                    i
                ));
            }
            TaskExpression::VectorCompletion(_) => {
                return Err(format!(
                    "Task [{}]: branch functions must not contain vector.completion tasks",
                    i
                ));
            }
        }
    }

    // 6. Compile tasks with example inputs and validate placeholder inputs
    compile_and_validate_task_inputs(function, children)?;

    // 7. Function input diversity — compiled inputs must vary with parent input
    validate_scalar_function_input_diversity(function)?;

    Ok(())
}
