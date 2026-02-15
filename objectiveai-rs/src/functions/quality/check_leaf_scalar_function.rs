//! Quality checks for leaf scalar functions (depth 0: vector.completion tasks only).

use crate::chat::completions::request::{
    MessageExpression, RichContentExpression, SimpleContentExpression,
};
use crate::functions::expression::WithExpression;
use crate::functions::{
    RemoteFunction, TaskExpression, VectorCompletionTaskExpression,
};

use super::compile_and_validate::{
    compile_and_validate_task_inputs, validate_vc_task_diversity,
};

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
    let (input_maps, tasks) = match function {
        RemoteFunction::Scalar {
            input_maps, tasks, ..
        } => (input_maps, tasks),
        RemoteFunction::Vector { .. } => {
            return Err(
                "Expected scalar function, got vector function".to_string()
            );
        }
    };

    // 1. No input_maps
    if input_maps.is_some() {
        return Err("Scalar functions must not have input_maps".to_string());
    }

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
                // 4 & 5. Check content parts
                check_vector_completion_messages(i, vc)?;
                check_scalar_vector_completion_responses(i, vc)?;
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

    // 6. VC task diversity — compiled tasks must vary with parent input
    validate_vc_task_diversity(function)?;

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
                "Task [{}]: messages must have at least 1 message",
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
                "Task [{}]: responses must have at least 2 responses, found {}",
                task_index,
                responses.len()
            ));
        }
        for (j, resp_expr) in responses.iter().enumerate() {
            if let WithExpression::Value(resp) = resp_expr {
                if matches!(resp, RichContentExpression::Text(_)) {
                    return Err(format!(
                        "Task [{}], response [{}]: response must be an array of content parts, \
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
            "Task [{}]: vector function responses must be a single expression, \
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
                        "Task [{}], message [{}] (developer): content must be an array of \
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
                        "Task [{}], message [{}] (system): content must be an array of \
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
                        "Task [{}], message [{}] (user): content must be an array of \
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
                        "Task [{}], message [{}] (assistant): content must be an array of \
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
                        "Task [{}], message [{}] (tool): content must be an array of \
                         content parts, not a plain string",
                        task_index, msg_index
                    ));
                }
            }
        }
    }
    Ok(())
}
