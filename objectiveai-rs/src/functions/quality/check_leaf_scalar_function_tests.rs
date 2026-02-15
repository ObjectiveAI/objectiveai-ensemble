//! Tests for check_leaf_scalar_function.

#![cfg(test)]

use crate::chat::completions::request::{
    AssistantMessageExpression, DeveloperMessageExpression,
    RichContentExpression, SimpleContentExpression,
    SimpleContentPartExpression, SystemMessageExpression,
    ToolMessageExpression, UserMessageExpression,
};
use crate::functions::expression::{Expression, WithExpression};
use crate::functions::quality::check_leaf_scalar_function;
use crate::functions::{
    RemoteFunction, TaskExpression, VectorCompletionTaskExpression,
};

use super::check_function_test_helpers::*;

#[test]
fn wrong_type_vector() {
    let f = leaf_vector(array_of_strings_schema(), vec![]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("Expected scalar function, got vector function"));
}

#[test]
fn has_input_maps() {
    let f = leaf_scalar(
        Some(crate::functions::expression::InputMaps::One(
            Expression::Starlark("input".to_string()),
        )),
        vec![valid_vc_task()],
    );
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("must not have input_maps"));
}

#[test]
fn vc_task_has_map() {
    let mut task = valid_vc_task();
    if let TaskExpression::VectorCompletion(ref mut vc) = task {
        vc.map = Some(0);
    }
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("must not have map"));
}

#[test]
fn contains_scalar_function_task() {
    let f = leaf_scalar(None, vec![valid_scalar_function_task(None)]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("found scalar.function"));
}

#[test]
fn contains_vector_function_task() {
    let f = leaf_scalar(None, vec![valid_vector_function_task(None)]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("found vector.function"));
}

#[test]
fn contains_placeholder_scalar_task() {
    let f = leaf_scalar(None, vec![valid_placeholder_scalar_task(None)]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.scalar.function"));
}

#[test]
fn contains_placeholder_vector_task() {
    let f = leaf_scalar(
        None,
        vec![valid_placeholder_vector_task(
            None,
            array_of_strings_schema(),
        )],
    );
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.vector.function"));
}

#[test]
fn empty_messages() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("at least 1 message"));
}

#[test]
fn one_response() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Value(vec![quality_response()]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("at least 2 responses"));
}

#[test]
fn response_plain_string() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Value(vec![
                WithExpression::Value(RichContentExpression::Text(
                    "bad".to_string(),
                )),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("response must be an array of content parts"));
}

#[test]
fn developer_message_plain_string() {
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::Developer(
            DeveloperMessageExpression {
                content: WithExpression::Value(SimpleContentExpression::Text(
                    "bad".to_string(),
                )),
                name: None,
            },
        ),
    );
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![msg]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("(developer): content must be an array"));
}

#[test]
fn system_message_plain_string() {
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::System(
            SystemMessageExpression {
                content: WithExpression::Value(SimpleContentExpression::Text(
                    "bad".to_string(),
                )),
                name: None,
            },
        ),
    );
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![msg]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("(system): content must be an array"));
}

#[test]
fn user_message_plain_string() {
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::User(
            UserMessageExpression {
                content: WithExpression::Value(RichContentExpression::Text(
                    "bad".to_string(),
                )),
                name: None,
            },
        ),
    );
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![msg]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("(user): content must be an array"));
}

#[test]
fn assistant_message_plain_string() {
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::Assistant(
            AssistantMessageExpression {
                content: Some(WithExpression::Value(Some(
                    RichContentExpression::Text("bad".to_string()),
                ))),
                name: None,
                refusal: None,
                tool_calls: None,
                reasoning: None,
            },
        ),
    );
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![msg]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("(assistant): content must be an array"));
}

#[test]
fn tool_message_plain_string() {
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::Tool(
            ToolMessageExpression {
                content: WithExpression::Value(RichContentExpression::Text(
                    "bad".to_string(),
                )),
                tool_call_id: WithExpression::Value("call_123".to_string()),
            },
        ),
    );
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![msg]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("(tool): content must be an array"));
}

// --- Success cases ---

#[test]
fn valid_single_task() {
    let f = leaf_scalar(None, vec![valid_vc_task()]);
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn valid_multiple_tasks() {
    let f = leaf_scalar(
        None,
        vec![valid_vc_task(), valid_vc_task(), valid_vc_task()],
    );
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn rejects_no_tasks() {
    let f = leaf_scalar(None, vec![]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("at least one task"));
}

#[test]
fn valid_expression_messages_skip_structural_check() {
    // Expression-level messages/responses skip the structural content check,
    // but compilation still validates the compiled output. Use an object
    // input schema that produces valid messages and responses when compiled.
    use indexmap::IndexMap;
    use crate::functions::expression::{ObjectInputSchema, InputSchema};

    let input_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert("text".to_string(), simple_string_schema());
            m
        },
        required: Some(vec!["text".to_string()]),
    });

    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Expression(Expression::Starlark(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': input['text']}]}]".to_string(),
            )),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': 'option A'}], [{'type': 'text', 'text': 'option B'}]]".to_string(),
            )),
            output: dummy_output_expr(),
        });
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema,
        input_maps: None,
        tasks: vec![task],
    };
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn valid_developer_message_parts() {
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::Developer(
            DeveloperMessageExpression {
                content: WithExpression::Value(SimpleContentExpression::Parts(
                    vec![WithExpression::Value(
                        SimpleContentPartExpression::Text {
                            text: WithExpression::Value("good".to_string()),
                        },
                    )],
                )),
                name: None,
            },
        ),
    );
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![msg]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        });
    let f = leaf_scalar(None, vec![task]);
    check_leaf_scalar_function(&f).unwrap();
}
