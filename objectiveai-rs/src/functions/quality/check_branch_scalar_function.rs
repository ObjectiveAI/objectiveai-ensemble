//! Quality checks for branch scalar functions (depth > 0: function/placeholder tasks only).

use std::collections::{HashMap, HashSet};

use crate::functions::{CompiledTask, RemoteFunction, TaskExpression};

use super::check_description::check_description;
use super::compile_and_validate::{
    compile_and_validate_one_input, extract_task_input,
};
use super::example_inputs;

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
            description,
            input_maps,
            tasks,
            ..
        } => (description, input_maps, tasks),
        RemoteFunction::Vector { .. } => {
            return Err(
                "BS01: Expected scalar function, got vector function".to_string()
            );
        }
    };

    // Description
    check_description(description)?;

    // No input_maps
    if input_maps.is_some() {
        return Err("BS02: Scalar functions must not have input_maps".to_string());
    }

    // Must have at least one task
    if tasks.is_empty() {
        return Err("BS03: Functions must have at least one task".to_string());
    }

    // Check each task
    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::ScalarFunction(sf) => {
                // No map
                if sf.map.is_some() {
                    return Err(format!(
                        "BS04: Task [{}]: branch scalar function tasks must not have map",
                        i
                    ));
                }
            }
            TaskExpression::PlaceholderScalarFunction(psf) => {
                // No map
                if psf.map.is_some() {
                    return Err(format!(
                        "BS05: Task [{}]: branch scalar function tasks must not have map",
                        i
                    ));
                }
            }
            TaskExpression::VectorFunction(_) => {
                return Err(format!(
                    "BS06: Task [{}]: branch scalar functions must only contain scalar-like tasks, \
                     found vector.function",
                    i
                ));
            }
            TaskExpression::PlaceholderVectorFunction(_) => {
                return Err(format!(
                    "BS07: Task [{}]: branch scalar functions must only contain scalar-like tasks, \
                     found placeholder.vector.function",
                    i
                ));
            }
            TaskExpression::VectorCompletion(_) => {
                return Err(format!(
                    "BS08: Task [{}]: branch functions must not contain vector.completion tasks",
                    i
                ));
            }
        }
    }

    // --- Single generate() loop: compile + validate + diversity tracking ---
    let input_schema = function.input_schema();
    let task_count = tasks.len();
    let mut per_task_inputs: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];
    let mut count = 0usize;

    for (i, ref input) in example_inputs::generate(input_schema).enumerate() {
        count += 1;
        let compiled_tasks =
            compile_and_validate_one_input(i, function, input, children)?;

        // Track per-task input diversity
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                continue;
            };
            if let CompiledTask::One(task) = compiled_task {
                let key = extract_task_input(task);
                if !key.is_empty() {
                    per_task_inputs[j].insert(key);
                }
            }
        }
    }

    if count == 0 {
        return Err(
            "BS09: Failed to generate any example inputs from input_schema"
                .to_string(),
        );
    }

    // Post-loop: function input diversity check
    if count >= 2 {
        for (j, unique_inputs) in per_task_inputs.iter().enumerate() {
            if unique_inputs.len() < 2 {
                return Err(format!(
                    "BS10: Task [{}]: task input is a fixed value — task inputs must \
                     be derived from the parent input, otherwise the score is useless",
                    j,
                ));
            }
        }
    }

    Ok(())
}
