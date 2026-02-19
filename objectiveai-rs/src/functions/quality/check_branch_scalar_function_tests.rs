//! Tests for check_branch_scalar_function.

#![cfg(test)]

use crate::chat::completions::request::{
    RichContentExpression, RichContentPartExpression, UserMessageExpression,
};
use crate::functions::expression::{
    ArrayInputSchema, BooleanInputSchema, Expression, InputSchema,
    IntegerInputSchema, ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::functions::quality::check_branch_scalar_function;
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression,
    PlaceholderVectorFunctionTaskExpression, RemoteFunction,
    ScalarFunctionTaskExpression, TaskExpression,
    VectorCompletionTaskExpression, VectorFunctionTaskExpression,
};
use crate::util::index_map;

fn test(f: &RemoteFunction) {
    check_branch_scalar_function(f, None).unwrap();
}

fn test_err(f: &RemoteFunction, expected: &str) {
    let err = check_branch_scalar_function(f, None).unwrap_err();
    assert!(err.contains(expected), "expected '{expected}' in error, got: {err}");
}

#[test]
fn wrong_type_vector() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(10),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "label" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["items".to_string(), "label".to_string()]),
        }),
        input_maps: None,
        tasks: vec![],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['items'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'items': [x], 'label': input['label']} for x in input['items']]"
                .to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'items': [x['items'][0] for x in input], 'label': input[0]['label']}"
                .to_string(),
        )),
    };
    test_err(&f, "BS01");
}

#[test]
fn has_input_maps() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
        }),
        input_maps: Some(crate::functions::expression::InputMaps::One(
            Expression::Starlark("input".to_string()),
        )),
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
    test_err(&f, "BS02");
}

#[test]
fn scalar_function_has_map() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::ScalarFunction(
            ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark(
                    "[x / sum(output) for x in output]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "BS04");
}

#[test]
fn placeholder_scalar_has_map() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark(
                    "[x / sum(output) for x in output]".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "BS05");
}

#[test]
fn contains_vector_function() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
    test_err(&f, "BS06");
}

#[test]
fn contains_placeholder_vector() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
                    Expression::Starlark("len(input['items'])".to_string()),
                ),
                input_split: WithExpression::Expression(Expression::Starlark(
                    "[{'items': [x]} for x in input['items']]".to_string(),
                )),
                input_merge: WithExpression::Expression(Expression::Starlark(
                    "{'items': [x['items'][0] for x in input]}".to_string(),
                )),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            },
        )],
    };
    test_err(&f, "BS07");
}

#[test]
fn contains_vector_completion() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    crate::chat::completions::request::MessageExpression::User(
                        UserMessageExpression {
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
                        },
                    ),
                )]),
                tools: None,
                responses: WithExpression::Value(vec![
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        ),
                    ])),
                    WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(
                            RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Option A".to_string(),
                                ),
                            },
                        ),
                    ])),
                ]),
                output: Expression::Starlark("output['scores'][0]".to_string()),
            },
        )],
    };
    test_err(&f, "BS08");
}

// --- Success cases ---

#[test]
fn valid_single_scalar_function() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
    test(&f);
}

#[test]
fn valid_single_placeholder_scalar() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
    test(&f);
}

#[test]
fn valid_multiple_tasks() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::PlaceholderScalarFunction(
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
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
        }),
        input_maps: None,
        tasks: vec![],
    };
    test_err(&f, "BS03");
}

// --- Description tests ---

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
    test_err(&f, "QD01");
}

// --- Diversity failures ---

#[test]
fn scalar_diversity_fail_fixed_input() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "'always_the_same'".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test_err(&f, "BS10");
}

#[test]
fn scalar_diversity_fail_fixed_integer() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(100),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "42".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "99".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test_err(&f, "BS10");
}

#[test]
fn scalar_diversity_fail_third_task_fixed_object() {
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
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input['name']".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "{'name': 'fixed', 'score': 50}".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test_err(&f, "BS10");
}

// --- Diversity passes ---

#[test]
fn scalar_diversity_pass_string_passthrough() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input + ' suffix'".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test(&f);
}

#[test]
fn scalar_diversity_pass_integer_derived() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(1000),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input + 1".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test(&f);
}

#[test]
fn scalar_diversity_pass_object_extract_field() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "title" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "author" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["title".to_string(), "author".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input['title']".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input['author']".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test(&f);
}

#[test]
fn scalar_diversity_pass_placeholder_with_transform() {
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
                "category" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["text".to_string(), "category".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::PlaceholderScalarFunction(
                PlaceholderScalarFunctionTaskExpression {
                    input_schema: InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    }),
                    skip: None,
                    map: None,
                    input: WithExpression::Expression(Expression::Starlark(
                        "input['text']".to_string(),
                    )),
                    output: Expression::Starlark("output".to_string()),
                },
            ),
            TaskExpression::PlaceholderScalarFunction(
                PlaceholderScalarFunctionTaskExpression {
                    input_schema: InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    }),
                    skip: None,
                    map: None,
                    input: WithExpression::Expression(Expression::Starlark(
                        "input['text'] + ' [' + input['category'] + ']'"
                            .to_string(),
                    )),
                    output: Expression::Starlark("output".to_string()),
                },
            ),
        ],
    };
    test(&f);
}

#[test]
fn scalar_diversity_pass_optional_field_used() {
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
                "notes" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["name".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input['name']".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test(&f);
}

#[test]
fn scalar_diversity_pass_array_input() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(5),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input[0]".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
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
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: Some(Expression::Starlark("input.get('skip_last_task', False)".to_string())),
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input['text']".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test(&f);
}

#[test]
fn valid_with_skip_on_low_priority() {
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
                "priority" => InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(1),
                    maximum: Some(10),
                })
            },
            required: Some(vec!["text".to_string(), "priority".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: Some(Expression::Starlark("input['priority'] < 4".to_string())),
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input['text'] + ' [p=' + str(input['priority']) + ']'".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test(&f);
}

// --- Output expression distribution tests ---

#[test]
fn output_distribution_fail_biased_output_expression() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
                output: Expression::Starlark(
                    "output * 0.1 + 0.45".to_string(),
                ),
            },
        )],
    };
    test_err(&f, "OD02");
}

#[test]
fn output_distribution_pass_identity() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(10),
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
    test(&f);
}

#[test]
fn rejects_single_permutation_string_enum() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: Some(vec!["only".to_string()]),
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
    test_err(&f, "QI01");
}

#[test]
fn rejects_single_permutation_integer() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(0),
            maximum: Some(0),
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
    test_err(&f, "QI01");
}

#[test]
fn all_tasks_skipped() {
    let f = RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: Some(Expression::Starlark("True".to_string())),
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test2".to_string(),
                commit: "abc123".to_string(),
                skip: Some(Expression::Starlark("True".to_string())),
                map: None,
                input: WithExpression::Expression(Expression::Starlark(
                    "input".to_string(),
                )),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
    };
    test_err(&f, "CV42");
}
