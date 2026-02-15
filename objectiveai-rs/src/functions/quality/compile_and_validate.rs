//! Shared logic for compiling tasks with example inputs and validating
//! compiled task constraints.

use std::collections::HashMap;

use crate::chat::completions::request::{Message, RichContent, SimpleContent};
use crate::functions::{
    CompiledTask, Function, RemoteFunction, Task, VectorCompletionTask,
};

use super::example_inputs::generate_example_inputs;

/// Generates example inputs from the function's input schema, compiles tasks
/// for each input, and validates compiled task constraints:
/// - Placeholder task inputs match their embedded `input_schema`
/// - Vector completion tasks have content parts (not plain strings),
///   at least 2 responses, at least 1 message, etc.
/// - If `children` is provided, scalar/vector function task inputs are validated
///   against the referenced child function's `input_schema`
pub(super) fn compile_and_validate_task_inputs(
    function: &RemoteFunction,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let input_schema = function.input_schema();
    let inputs = generate_example_inputs(input_schema);

    if inputs.is_empty() {
        return Err("Failed to generate any example inputs from input_schema"
            .to_string());
    }

    for (i, input) in inputs.iter().enumerate() {
        // compile_tasks takes self by value, so we clone into a Function
        let func = Function::Remote(function.clone());
        let compiled_tasks = func.compile_tasks(input).map_err(|e| {
            format!(
                "Input [{}]: task compilation failed: {}\n\nInput: {}",
                i,
                e,
                serde_json::to_string_pretty(input).unwrap_or_default()
            )
        })?;

        // Validate each compiled task
        for (j, compiled_task) in compiled_tasks.iter().enumerate() {
            let compiled_task = match compiled_task {
                Some(ct) => ct,
                None => continue, // skipped task
            };

            match compiled_task {
                CompiledTask::One(task) => {
                    validate_compiled_task(i, j, None, task, children)?;
                }
                CompiledTask::Many(tasks) => {
                    for (k, task) in tasks.iter().enumerate() {
                        validate_compiled_task(
                            i, j, Some(k), task, children,
                        )?;
                    }
                }
            }
        }
    }

    Ok(())
}

/// Validates a single compiled task.
fn validate_compiled_task(
    input_index: usize,
    task_index: usize,
    map_index: Option<usize>,
    task: &Task,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    let location = match map_index {
        Some(k) => {
            format!("Input [{}], task [{}][{}]", input_index, task_index, k)
        }
        None => format!("Input [{}], task [{}]", input_index, task_index),
    };

    match task {
        Task::PlaceholderScalarFunction(t) => {
            if !t.input_schema.validate_input(&t.input) {
                return Err(format!(
                    "{}: compiled input does not match placeholder's input_schema\n\nInput: {}\n\nSchema: {}",
                    location,
                    serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                    serde_json::to_string_pretty(&t.input_schema)
                        .unwrap_or_default(),
                ));
            }
        }
        Task::PlaceholderVectorFunction(t) => {
            if !t.input_schema.validate_input(&t.input) {
                return Err(format!(
                    "{}: compiled input does not match placeholder's input_schema\n\nInput: {}\n\nSchema: {}",
                    location,
                    serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                    serde_json::to_string_pretty(&t.input_schema)
                        .unwrap_or_default(),
                ));
            }
        }
        Task::VectorCompletion(vc) => {
            check_compiled_vector_completion(&location, vc)?;
        }
        Task::ScalarFunction(t) => {
            if let Some(children) = children {
                let key = format!("{}/{}", t.owner, t.repository);
                let child = children.get(&key).ok_or_else(|| {
                    format!(
                        "{}: referenced scalar.function '{}' not found in children",
                        location, key
                    )
                })?;
                if !child.input_schema().validate_input(&t.input) {
                    return Err(format!(
                        "{}: compiled input does not match child function's input_schema ({})\n\nInput: {}\n\nSchema: {}",
                        location,
                        key,
                        serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                        serde_json::to_string_pretty(child.input_schema())
                            .unwrap_or_default(),
                    ));
                }
            }
        }
        Task::VectorFunction(t) => {
            if let Some(children) = children {
                let key = format!("{}/{}", t.owner, t.repository);
                let child = children.get(&key).ok_or_else(|| {
                    format!(
                        "{}: referenced vector.function '{}' not found in children",
                        location, key
                    )
                })?;
                if !child.input_schema().validate_input(&t.input) {
                    return Err(format!(
                        "{}: compiled input does not match child function's input_schema ({})\n\nInput: {}\n\nSchema: {}",
                        location,
                        key,
                        serde_json::to_string_pretty(&t.input).unwrap_or_default(),
                        serde_json::to_string_pretty(child.input_schema())
                            .unwrap_or_default(),
                    ));
                }
            }
        }
    }

    Ok(())
}

/// Validates a compiled vector completion task:
/// - At least 1 message
/// - Message content is content parts, not plain strings
/// - At least 2 responses
/// - Response content is content parts, not plain strings
fn check_compiled_vector_completion(
    location: &str,
    vc: &VectorCompletionTask,
) -> Result<(), String> {
    // At least 1 message
    if vc.messages.is_empty() {
        return Err(format!(
            "{}: compiled task must have at least 1 message",
            location
        ));
    }

    // Message content must be content parts
    for (j, msg) in vc.messages.iter().enumerate() {
        check_compiled_message_content(location, j, msg)?;
    }

    // At least 2 responses
    if vc.responses.len() < 2 {
        return Err(format!(
            "{}: compiled task must have at least 2 responses, found {}",
            location,
            vc.responses.len()
        ));
    }

    // Response content must be content parts
    for (j, resp) in vc.responses.iter().enumerate() {
        if matches!(resp, RichContent::Text(_)) {
            return Err(format!(
                "{}, response [{}]: compiled response must be an array of content parts, \
                 not a plain string",
                location, j
            ));
        }
    }

    Ok(())
}

/// Checks that a compiled message's content is parts, not a plain string.
fn check_compiled_message_content(
    location: &str,
    msg_index: usize,
    msg: &Message,
) -> Result<(), String> {
    match msg {
        Message::Developer(dev) => {
            if matches!(dev.content, SimpleContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (developer): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
        Message::System(sys) => {
            if matches!(sys.content, SimpleContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (system): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
        Message::User(user) => {
            if matches!(user.content, RichContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (user): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
        Message::Assistant(asst) => {
            if let Some(content) = &asst.content {
                if matches!(content, RichContent::Text(_)) {
                    return Err(format!(
                        "{}, message [{}] (assistant): compiled content must be an array of \
                         content parts, not a plain string",
                        location, msg_index
                    ));
                }
            }
        }
        Message::Tool(tool) => {
            if matches!(tool.content, RichContent::Text(_)) {
                return Err(format!(
                    "{}, message [{}] (tool): compiled content must be an array of \
                     content parts, not a plain string",
                    location, msg_index
                ));
            }
        }
    }
    Ok(())
}
