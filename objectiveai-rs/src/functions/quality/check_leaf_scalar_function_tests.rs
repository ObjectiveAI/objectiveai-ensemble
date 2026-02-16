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
fn one_response_expression() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Value(vec![
                WithExpression::Expression(Expression::Starlark(
                    "[{'type': 'text', 'text': 'only one'}]".to_string(),
                )),
            ]),
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

/// A scalar VC task where the message derives from input, so the compiled
/// task varies across different example inputs.
fn input_derived_vc_task() -> TaskExpression {
    TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
        skip: None,
        map: None,
        messages: WithExpression::Expression(Expression::Starlark(
            "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                .to_string(),
        )),
        tools: None,
        responses: WithExpression::Value(vec![
            quality_response(),
            quality_response(),
        ]),
        output: vc_scalar_output_expr(),
    })
}

#[test]
fn valid_single_task() {
    let f = leaf_scalar(None, vec![input_derived_vc_task()]);
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn valid_multiple_tasks() {
    let f = leaf_scalar(
        None,
        vec![
            input_derived_vc_task(),
            input_derived_vc_task(),
            input_derived_vc_task(),
        ],
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

// --- Output expression uniqueness ---

#[test]
fn derived_scalar_output_expression_passes() {
    // Properly derives output from raw scores — produces unique values.
    // Messages derive from input so the compiled task varies.
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Expression(Expression::Starlark(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                    .to_string(),
            )),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: Expression::Starlark("output['scores'][0]".to_string()),
        });
    let f = leaf_scalar(None, vec![task]);
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn fixed_scalar_output_expression() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: Expression::Starlark("0.5".to_string()),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("duplicate results"), "expected duplicate results error, got: {err}");
}

#[test]
fn branching_scalar_output_three_values() {
    // Only 3 possible outputs — will collide within 100 trials
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: Expression::Starlark(
                "0.33 if output['scores'][0] < 0.33 else (0.66 if output['scores'][0] < 0.66 else 1.0)"
                    .to_string(),
            ),
        });
    let f = leaf_scalar(None, vec![task]);
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("duplicate results"), "expected duplicate results error, got: {err}");
}

#[test]
fn description_too_long() {
    let f = RemoteFunction::Scalar {
        description: "a".repeat(351),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![input_derived_vc_task()],
    };
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("351 bytes"), "expected byte count error, got: {err}");
}

#[test]
fn description_empty() {
    let f = RemoteFunction::Scalar {
        description: "  ".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![input_derived_vc_task()],
    };
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(err.contains("must not be empty"), "expected empty error, got: {err}");
}

#[test]
fn valid_developer_message_parts() {
    // Developer message uses content parts (not plain string) — passes structural check.
    // The text derives from input so the compiled task varies.
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::Developer(
            DeveloperMessageExpression {
                content: WithExpression::Value(SimpleContentExpression::Parts(
                    vec![WithExpression::Value(
                        SimpleContentPartExpression::Text {
                            text: WithExpression::Expression(
                                Expression::Starlark("input".to_string()),
                            ),
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

// --- VC task diversity tests ---

use crate::chat::completions::request::RichContentPartExpression;
use crate::functions::expression::{
    InputSchema, IntegerInputSchema, ObjectInputSchema, StringInputSchema,
};
use indexmap::IndexMap;

/// Helper: inline leaf scalar function with custom input schema and tasks.
fn inline_leaf_scalar(
    input_schema: InputSchema,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema,
        input_maps: None,
        tasks,
    }
}

/// Helper: VC task with custom message and response expressions.
fn vc_task_exprs(
    messages_expr: &str,
    responses_expr: &str,
    output_expr: &str,
) -> TaskExpression {
    TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
        skip: None,
        map: None,
        messages: WithExpression::Expression(Expression::Starlark(
            messages_expr.to_string(),
        )),
        tools: None,
        responses: WithExpression::Expression(Expression::Starlark(
            responses_expr.to_string(),
        )),
        output: Expression::Starlark(output_expr.to_string()),
    })
}

// --- Diversity failures ---

#[test]
fn diversity_fail_all_fixed_parameters() {
    // All VC parameters are fixed — nothing derives from input.
    let f = inline_leaf_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': 'hello'}]}]",
                "[[{'type': 'text', 'text': 'A'}], [{'type': 'text', 'text': 'B'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(
        err.contains("Task [0]") && err.contains("fixed parameters"),
        "expected Task [0] fixed parameters error, got: {err}"
    );
}

#[test]
fn diversity_fail_second_task_fixed() {
    // Task 0 derives from input, task 1 is completely fixed.
    let f = inline_leaf_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]",
                "[[{'type': 'text', 'text': 'A'}], [{'type': 'text', 'text': 'B'}]]",
                "output['scores'][0]",
            ),
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': 'static prompt'}]}]",
                "[[{'type': 'text', 'text': 'X'}], [{'type': 'text', 'text': 'Y'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(
        err.contains("Task [1]") && err.contains("fixed parameters"),
        "expected Task [1] fixed parameters error, got: {err}"
    );
}

#[test]
fn diversity_fail_object_input_ignored() {
    // Object input with name + score, but the task ignores all fields.
    let schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "name".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m.insert(
                "score".to_string(),
                InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(0),
                    maximum: Some(100),
                }),
            );
            m
        },
        required: Some(vec!["name".to_string(), "score".to_string()]),
    });
    let f = inline_leaf_scalar(
        schema,
        vec![
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': 'rate this'}]}]",
                "[[{'type': 'text', 'text': 'good'}], [{'type': 'text', 'text': 'bad'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    let err = check_leaf_scalar_function(&f).unwrap_err();
    assert!(
        err.contains("Task [0]") && err.contains("fixed parameters"),
        "expected Task [0] fixed parameters error, got: {err}"
    );
}

// --- Diversity passes ---

#[test]
fn diversity_pass_message_derives_from_input() {
    // Message embeds input string, responses are fixed — overall task varies.
    let f = inline_leaf_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]",
                "[[{'type': 'text', 'text': 'yes'}], [{'type': 'text', 'text': 'no'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn diversity_pass_responses_derive_from_input() {
    // Messages are fixed but responses derive from input — overall task varies.
    let f = inline_leaf_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': 'which is better?'}]}]",
                "[[{'type': 'text', 'text': input}], [{'type': 'text', 'text': input + ' alt'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn diversity_pass_object_fields_in_messages() {
    // Object input, messages embed different fields.
    let schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "question".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m.insert(
                "context".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["question".to_string(), "context".to_string()]),
    });
    let f = inline_leaf_scalar(
        schema,
        vec![
            // Task 0: uses question in message
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': input['question']}]}]",
                "[[{'type': 'text', 'text': 'yes'}], [{'type': 'text', 'text': 'no'}]]",
                "output['scores'][0]",
            ),
            // Task 1: uses context in message
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': input['context']}]}]",
                "[[{'type': 'text', 'text': 'agree'}], [{'type': 'text', 'text': 'disagree'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn diversity_pass_both_messages_and_responses_derived() {
    // Both messages and responses derive from input.
    let f = inline_leaf_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': 'Evaluate: ' + input}]}]",
                "[[{'type': 'text', 'text': input + ' is good'}], [{'type': 'text', 'text': input + ' is bad'}]]",
                "output['scores'][0]",
            ),
            vc_task_exprs(
                "[{'role': 'user', 'content': [{'type': 'text', 'text': 'Rate: ' + input}]}]",
                "[[{'type': 'text', 'text': 'approve'}], [{'type': 'text', 'text': 'reject'}]]",
                "output['scores'][0]",
            ),
        ],
    );
    check_leaf_scalar_function(&f).unwrap();
}

#[test]
fn diversity_pass_value_messages_with_expression_text() {
    // Messages are Value (not Expression) but the text part is an expression
    // that derives from input — compiled task still varies.
    let msg = WithExpression::Value(
        crate::chat::completions::request::MessageExpression::User(
            UserMessageExpression {
                content: WithExpression::Value(RichContentExpression::Parts(
                    vec![WithExpression::Value(
                        RichContentPartExpression::Text {
                            text: WithExpression::Expression(
                                Expression::Starlark("input".to_string()),
                            ),
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
