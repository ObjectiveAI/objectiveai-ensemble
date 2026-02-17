//! Quality checks for leaf scalar functions (depth 0: vector.completion tasks only).

use std::collections::HashSet;

use crate::chat::completions::request::{
    MessageExpression, RichContentExpression, SimpleContentExpression,
};
use crate::functions::expression::WithExpression;
use crate::functions::{
    CompiledTask, RemoteFunction, Task, TaskExpression,
    VectorCompletionTaskExpression,
};

use super::check_description::check_description;
use super::compile_and_validate::compile_and_validate_one_input;
use super::example_inputs;

/// Validates quality requirements for a leaf scalar function.
///
/// Leaf scalar functions are at depth 0 and contain only vector.completion tasks.
///
/// # Checks
///
/// 1. No `input_maps` — scalar functions must not use input maps
/// 2. All tasks must be `vector.completion`
/// 3. No `map` on any task — scalar leaf tasks are never mapped
/// 4. Message content must be content parts arrays, not plain strings
/// 5. Response content must be content parts arrays, not plain strings
pub fn check_leaf_scalar_function(
    function: &RemoteFunction,
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
                "LS01: Expected scalar function, got vector function".to_string()
            );
        }
    };

    // Description length
    check_description(description)?;

    // No input_maps
    if input_maps.is_some() {
        return Err("LS02: Scalar functions must not have input_maps".to_string());
    }

    // Must have at least one task
    if tasks.is_empty() {
        return Err("LS03: Functions must have at least one task".to_string());
    }

    // All tasks must be vector.completion, no map, content parts only
    for (i, task) in tasks.iter().enumerate() {
        match task {
            TaskExpression::VectorCompletion(vc) => {
                // No map
                if vc.map.is_some() {
                    return Err(format!(
                        "LS04: Task [{}]: vector.completion tasks must not have map",
                        i
                    ));
                }
                // Check content parts
                check_vector_completion_messages(i, vc)?;
                check_scalar_vector_completion_responses(i, vc)?;
            }
            TaskExpression::ScalarFunction(_) => {
                return Err(format!(
                    "LS05: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found scalar.function",
                    i
                ));
            }
            TaskExpression::VectorFunction(_) => {
                return Err(format!(
                    "LS06: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found vector.function",
                    i
                ));
            }
            TaskExpression::PlaceholderScalarFunction(_) => {
                return Err(format!(
                    "LS07: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found placeholder.scalar.function",
                    i
                ));
            }
            TaskExpression::PlaceholderVectorFunction(_) => {
                return Err(format!(
                    "LS08: Task [{}]: leaf functions must only contain vector.completion tasks, \
                     found placeholder.vector.function",
                    i
                ));
            }
        }
    }

    // --- Single generate() loop: compile + validate + diversity tracking ---
    let input_schema = function.input_schema();
    let task_count = tasks.len();
    let mut per_task_serialized: Vec<HashSet<String>> =
        vec![HashSet::new(); task_count];
    let mut per_task_skipped = vec![false; task_count];
    let mut count = 0usize;

    for (i, ref input) in example_inputs::generate(input_schema).enumerate() {
        count += 1;
        let compiled_tasks =
            compile_and_validate_one_input(i, function, input, None)?;

        // Track VC task diversity
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let Some(compiled_task) = compiled_task else {
                per_task_skipped[j] = true;
                continue;
            };
            if let CompiledTask::One(Task::VectorCompletion(vc)) = compiled_task
            {
                let key = serde_json::to_string(vc).unwrap_or_default();
                per_task_serialized[j].insert(key);
            }
        }
    }

    if count == 0 {
        return Err(
            "LS18: Failed to generate any example inputs from input_schema"
                .to_string(),
        );
    }

    // Post-loop: VC task diversity check
    if count >= 2 {
        for (j, unique_tasks) in per_task_serialized.iter().enumerate() {
            let effective = unique_tasks.len()
                + if per_task_skipped[j] { 1 } else { 0 };
            if effective < 2 {
                return Err(format!(
                    "LS19: Task [{}]: task has fixed parameters — messages, tools, and/or \
                     responses must be derived from the parent input, otherwise \
                     the score is useless",
                    j,
                ));
            }
        }
    }

    Ok(())
}

/// Checks that a vector completion task's messages use content parts,
/// not plain strings, and enforces length constraints. Skips checks where expressions
/// are used (can't verify at compile time).
pub(super) fn check_vector_completion_messages(
    task_index: usize,
    vc: &VectorCompletionTaskExpression,
) -> Result<(), String> {
    if let WithExpression::Value(messages) = &vc.messages {
        if messages.is_empty() {
            return Err(format!(
                "LS09: Task [{}]: messages must have at least 1 message",
                task_index
            ));
        }
        for (j, msg_expr) in messages.iter().enumerate() {
            if let WithExpression::Value(msg) = msg_expr {
                check_message_content(task_index, j, msg)?;
            }
        }
    }

    Ok(())
}

/// Checks that a scalar function's vector completion task responses are an array
/// of content parts with at least 2 elements. Skips checks where expressions
/// are used (can't verify at compile time).
pub(super) fn check_scalar_vector_completion_responses(
    task_index: usize,
    vc: &VectorCompletionTaskExpression,
) -> Result<(), String> {
    if let WithExpression::Value(responses) = &vc.responses {
        if responses.len() < 2 {
            return Err(format!(
                "LS10: Task [{}]: responses must have at least 2 responses, found {}",
                task_index,
                responses.len()
            ));
        }
        for (j, resp_expr) in responses.iter().enumerate() {
            if let WithExpression::Value(resp) = resp_expr {
                if matches!(resp, RichContentExpression::Text(_)) {
                    return Err(format!(
                        "LS11: Task [{}], response [{}]: response must be an array of content parts, \
                         not a plain string",
                        task_index, j
                    ));
                }
            }
        }
    }

    Ok(())
}

/// Checks that a vector function's vector completion task responses are a single
/// expression (not a fixed array of responses or an array of expressions).
pub(super) fn check_vector_vector_completion_responses(
    task_index: usize,
    vc: &VectorCompletionTaskExpression,
) -> Result<(), String> {
    if !matches!(vc.responses, WithExpression::Expression(_)) {
        return Err(format!(
            "LS12: Task [{}]: vector function responses must be a single expression, \
             not a fixed array of responses",
            task_index
        ));
    }

    Ok(())
}

/// Checks that a message expression's content is parts, not a plain string.
fn check_message_content(
    task_index: usize,
    msg_index: usize,
    msg: &MessageExpression,
) -> Result<(), String> {
    match msg {
        MessageExpression::Developer(dev) => {
            if let WithExpression::Value(content) = &dev.content {
                if matches!(content, SimpleContentExpression::Text(_)) {
                    return Err(format!(
                        "LS13: Task [{}], message [{}] (developer): content must be an array of \
                         content parts, not a plain string",
                        task_index, msg_index
                    ));
                }
            }
        }
        MessageExpression::System(sys) => {
            if let WithExpression::Value(content) = &sys.content {
                if matches!(content, SimpleContentExpression::Text(_)) {
                    return Err(format!(
                        "LS14: Task [{}], message [{}] (system): content must be an array of \
                         content parts, not a plain string",
                        task_index, msg_index
                    ));
                }
            }
        }
        MessageExpression::User(user) => {
            if let WithExpression::Value(content) = &user.content {
                if matches!(content, RichContentExpression::Text(_)) {
                    return Err(format!(
                        "LS15: Task [{}], message [{}] (user): content must be an array of \
                         content parts, not a plain string",
                        task_index, msg_index
                    ));
                }
            }
        }
        MessageExpression::Assistant(asst) => {
            if let Some(WithExpression::Value(Some(content))) = &asst.content {
                if matches!(content, RichContentExpression::Text(_)) {
                    return Err(format!(
                        "LS16: Task [{}], message [{}] (assistant): content must be an array of \
                         content parts, not a plain string",
                        task_index, msg_index
                    ));
                }
            }
        }
        MessageExpression::Tool(tool) => {
            if let WithExpression::Value(content) = &tool.content {
                if matches!(content, RichContentExpression::Text(_)) {
                    return Err(format!(
                        "LS17: Task [{}], message [{}] (tool): content must be an array of \
                         content parts, not a plain string",
                        task_index, msg_index
                    ));
                }
            }
        }
    }
    Ok(())
}
