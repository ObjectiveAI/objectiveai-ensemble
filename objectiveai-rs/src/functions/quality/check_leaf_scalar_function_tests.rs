//! Tests for check_leaf_scalar_function.

#![cfg(test)]

use crate::chat::completions::request::{
    AssistantMessageExpression, DeveloperMessageExpression, MessageExpression,
    RichContentExpression, RichContentPartExpression,
    SimpleContentExpression, SimpleContentPartExpression,
    SystemMessageExpression, ToolMessageExpression, UserMessageExpression,
};
use crate::functions::expression::{
    ArrayInputSchema, BooleanInputSchema, Expression, InputSchema,
    IntegerInputSchema, ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::functions::quality::check_leaf_scalar_function;
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression,
    PlaceholderVectorFunctionTaskExpression, RemoteFunction,
    ScalarFunctionTaskExpression, TaskExpression,
    VectorCompletionTaskExpression, VectorFunctionTaskExpression,
};
use crate::util::index_map;

fn test(f: &RemoteFunction) {
    check_leaf_scalar_function(f).unwrap();
}

fn test_err(f: &RemoteFunction, expected: &str) {
    let err = check_leaf_scalar_function(f).unwrap_err();
    assert!(err.contains(expected), "expected '{expected}' in error, got: {err}");
}

#[test]
fn wrong_type_vector() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(10),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
        }),
        input_maps: None,
        tasks: vec![],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input)".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[[x] for x in input]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "[x[0] for x in input]".to_string(),
        )),
    };
    test_err(&f, "LS01");
}

#[test]
fn has_input_maps() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: Some(crate::functions::expression::InputMaps::One(
            Expression::Starlark("input".to_string()),
        )),
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS02");
}

#[test]
fn vc_task_has_map() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: Some(0),
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS04");
}

#[test]
fn contains_scalar_function_task() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::ScalarFunction(
            ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            },
        )],
    };
    test_err(&f, "LS05");
}

#[test]
fn contains_vector_function_task() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorFunction(
            VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            },
        )],
    };
    test_err(&f, "LS06");
}

#[test]
fn contains_placeholder_scalar_task() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::PlaceholderScalarFunction(
            PlaceholderScalarFunctionTaskExpression {
                input_schema: InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(1),
                    maximum: Some(10),
                }),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            },
        )],
    };
    test_err(&f, "LS07");
}

#[test]
fn contains_placeholder_vector_task() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::PlaceholderVectorFunction(
            PlaceholderVectorFunctionTaskExpression {
                input_schema: InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(10),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                output_length: WithExpression::Expression(
                    Expression::Starlark(
                        "len(input['items'])".to_string(),
                    ),
                ),
                input_split: WithExpression::Expression(
                    Expression::Starlark(
                        "[{'items': [x]} for x in input['items']]"
                            .to_string(),
                    ),
                ),
                input_merge: WithExpression::Expression(
                    Expression::Starlark(
                        "{'items': [x['items'][0] for x in input]}"
                            .to_string(),
                    ),
                ),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            },
        )],
    };
    test_err(&f, "LS08");
}

#[test]
fn empty_messages() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS09");
}

#[test]
fn one_response() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS10");
}

#[test]
fn one_response_expression() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Expression(Expression::Starlark(
                        "[{'type': 'text', 'text': 'only one'}]".to_string(),
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS10");
}

#[test]
fn response_plain_string() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Text(
                        "bad".to_string(),
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS11");
}

#[test]
fn developer_message_plain_string() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::Developer(
                        DeveloperMessageExpression {
                            content: WithExpression::Value(
                                SimpleContentExpression::Text(
                                    "bad".to_string(),
                                ),
                            ),
                            name: None,
                        },
                    ),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS13");
}

#[test]
fn system_message_plain_string() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::System(SystemMessageExpression {
                        content: WithExpression::Value(
                            SimpleContentExpression::Text(
                                "bad".to_string(),
                            ),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS14");
}

#[test]
fn user_message_plain_string() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Text("bad".to_string()),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS15");
}

#[test]
fn assistant_message_plain_string() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::Assistant(
                        AssistantMessageExpression {
                            content: Some(WithExpression::Value(Some(
                                RichContentExpression::Text(
                                    "bad".to_string(),
                                ),
                            ))),
                            name: None,
                            refusal: None,
                            tool_calls: None,
                            reasoning: None,
                        },
                    ),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS16");
}

#[test]
fn tool_message_plain_string() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::Tool(ToolMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Text("bad".to_string()),
                        ),
                        tool_call_id: WithExpression::Value(
                            "call_123".to_string(),
                        ),
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS17");
}

// --- Success cases ---

#[test]
fn valid_single_task() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

#[test]
fn valid_multiple_tasks() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Value(vec![
                        WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value(
                                        "Option A".to_string(),
                                    ),
                                },
                            )],
                        )),
                        WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value(
                                        "Option A".to_string(),
                                    ),
                                },
                            )],
                        )),
                    ]),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Value(vec![
                        WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value(
                                        "Option A".to_string(),
                                    ),
                                },
                            )],
                        )),
                        WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value(
                                        "Option A".to_string(),
                                    ),
                                },
                            )],
                        )),
                    ]),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Value(vec![
                        WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value(
                                        "Option A".to_string(),
                                    ),
                                },
                            )],
                        )),
                        WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value(
                                        "Option A".to_string(),
                                    ),
                                },
                            )],
                        )),
                    ]),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
        ],
    };
    test(&f);
}

#[test]
fn rejects_no_tasks() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![],
    };
    test_err(&f, "LS03");
}

#[test]
fn valid_expression_messages_skip_structural_check() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "text" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["text".to_string()]),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input['text']}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'option A'}], [{'type': 'text', 'text': 'option B'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

// --- Output expression uniqueness ---

#[test]
fn derived_scalar_output_expression_passes() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

#[test]
fn fixed_scalar_output_expression() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark("0.5".to_string()),
            },
        )],
    };
    test_err(&f, "CV11");
}

#[test]
fn branching_scalar_output_three_values() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text: WithExpression::Value(
                                            "Hello".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "0.33 if output['scores'][0] < 0.33 else (0.66 if output['scores'][0] < 0.66 else 1.0)"
                        .to_string(),
                ),
            },
        )],
    };
    test_err(&f, "CV11");
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
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "QD02");
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
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "QD01");
}

#[test]
fn valid_developer_message_parts() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::Developer(
                        DeveloperMessageExpression {
                            content: WithExpression::Value(
                                SimpleContentExpression::Parts(vec![
                                    WithExpression::Value(
                                        SimpleContentPartExpression::Text {
                                            text:
                                                WithExpression::Expression(
                                                    Expression::Starlark(
                                                        "input".to_string(),
                                                    ),
                                                ),
                                        },
                                    ),
                                ]),
                            ),
                            name: None,
                        },
                    ),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

// --- VC task diversity tests ---

// --- Diversity failures ---

#[test]
fn diversity_fail_all_fixed_parameters() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'hello'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'A'}], [{'type': 'text', 'text': 'B'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS19");
}

#[test]
fn diversity_fail_second_task_fixed() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Expression(
                        Expression::Starlark(
                            "[[{'type': 'text', 'text': 'A'}], [{'type': 'text', 'text': 'B'}]]"
                                .to_string(),
                        ),
                    ),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': 'static prompt'}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Expression(
                        Expression::Starlark(
                            "[[{'type': 'text', 'text': 'X'}], [{'type': 'text', 'text': 'Y'}]]"
                                .to_string(),
                        ),
                    ),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
        ],
    };
    test_err(&f, "LS19");
}

#[test]
fn diversity_fail_object_input_ignored() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "name" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "score" => InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(0),
                    maximum: Some(100),
                })
            },
            required: Some(vec!["name".to_string(), "score".to_string()]),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'rate this'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'good'}], [{'type': 'text', 'text': 'bad'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "LS19");
}

// --- Diversity passes ---

#[test]
fn diversity_pass_message_derives_from_input() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'yes'}], [{'type': 'text', 'text': 'no'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

#[test]
fn diversity_pass_responses_derive_from_input() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'which is better?'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': input}], [{'type': 'text', 'text': input + ' alt'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

#[test]
fn diversity_pass_object_fields_in_messages() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "question" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "context" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec![
                "question".to_string(),
                "context".to_string(),
            ]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': input['question']}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Expression(
                        Expression::Starlark(
                            "[[{'type': 'text', 'text': 'yes'}], [{'type': 'text', 'text': 'no'}]]"
                                .to_string(),
                        ),
                    ),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': input['context']}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Expression(
                        Expression::Starlark(
                            "[[{'type': 'text', 'text': 'agree'}], [{'type': 'text', 'text': 'disagree'}]]"
                                .to_string(),
                        ),
                    ),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
        ],
    };
    test(&f);
}

#[test]
fn diversity_pass_both_messages_and_responses_derived() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': 'Evaluate: ' + input}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Expression(
                        Expression::Starlark(
                            "[[{'type': 'text', 'text': input + ' is good'}], [{'type': 'text', 'text': input + ' is bad'}]]"
                                .to_string(),
                        ),
                    ),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
            TaskExpression::VectorCompletion(
                VectorCompletionTaskExpression {
                    skip: None,
                    map: None,
                    messages: WithExpression::Expression(
                        Expression::Starlark(
                            "[{'role': 'user', 'content': [{'type': 'text', 'text': 'Rate: ' + input}]}]"
                                .to_string(),
                        ),
                    ),
                    tools: None,
                    responses: WithExpression::Expression(
                        Expression::Starlark(
                            "[[{'type': 'text', 'text': 'approve'}], [{'type': 'text', 'text': 'reject'}]]"
                                .to_string(),
                        ),
                    ),
                    output: Expression::Starlark(
                        "output['scores'][0]".to_string(),
                    ),
                },
            ),
        ],
    };
    test(&f);
}

#[test]
fn diversity_pass_value_messages_with_expression_text() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(
                            RichContentExpression::Parts(vec![
                                WithExpression::Value(
                                    RichContentPartExpression::Text {
                                        text:
                                            WithExpression::Expression(
                                                Expression::Starlark(
                                                    "input".to_string(),
                                                ),
                                            ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                    WithExpression::Value(RichContentExpression::Parts(
                        vec![WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        )],
                    )),
                ]),
                output: Expression::Starlark(
                    "output['scores'][0]".to_string(),
                ),
            },
        )],
    };
    test(&f);
}

// --- Skip expression tests ---

#[test]
fn valid_with_skip_last_task_boolean() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "text" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "skip_last_task" => InputSchema::Boolean(BooleanInputSchema {
                    description: None,
                })
            },
            required: Some(vec!["text".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input['text']}]}]".to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Yes".to_string()),
                        }),
                    ])),
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("No".to_string()),
                        }),
                    ])),
                ]),
                output: Expression::Starlark("output['scores'][0]".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark("input.get('skip_last_task', False)".to_string())),
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'Review: ' + input['text']}]}]".to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Good".to_string()),
                        }),
                    ])),
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Bad".to_string()),
                        }),
                    ])),
                ]),
                output: Expression::Starlark("output['scores'][0]".to_string()),
            }),
        ],
    };
    test(&f);
}

#[test]
fn valid_with_skip_on_high_confidence() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "text" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "confidence" => InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(0),
                    maximum: Some(100),
                })
            },
            required: Some(vec!["text".to_string(), "confidence".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': input['text']}]}]".to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Agree".to_string()),
                        }),
                    ])),
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Disagree".to_string()),
                        }),
                    ])),
                ]),
                output: Expression::Starlark("output['scores'][0]".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark("input['confidence'] > 75".to_string())),
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'Confidence ' + str(input['confidence']) + ': ' + input['text']}]}]".to_string(),
                )),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Confirm".to_string()),
                        }),
                    ])),
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Reject".to_string()),
                        }),
                    ])),
                ]),
                output: Expression::Starlark("output['scores'][0]".to_string()),
            }),
        ],
    };
    test(&f);
}
