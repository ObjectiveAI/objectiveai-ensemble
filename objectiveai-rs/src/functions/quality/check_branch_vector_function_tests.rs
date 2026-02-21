//! Tests for check_branch_vector_function.

#![cfg(test)]

use crate::chat::completions::request::{
    MessageExpression, RichContentExpression, RichContentPartExpression,
    UserMessageExpression,
};
use crate::functions::expression::{
    AnyOfInputSchema, ArrayInputSchema, BooleanInputSchema, Expression, InputMaps, InputSchema,
    IntegerInputSchema, ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::functions::quality::check_branch_vector_function;
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression,
    PlaceholderVectorFunctionTaskExpression, RemoteFunction,
    ScalarFunctionTaskExpression, TaskExpression,
    VectorCompletionTaskExpression, VectorFunctionTaskExpression,
};
use crate::util::index_map;

fn test(f: &RemoteFunction) {
    check_branch_vector_function(f, None).unwrap();
}

fn test_err(f: &RemoteFunction, expected: &str) {
    let err = check_branch_vector_function(f, None).unwrap_err();
    assert!(err.contains(expected), "expected '{expected}' in error, got: {err}");
}

// --- Structural checks ---

#[test]
fn wrong_type_scalar() {
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
    test_err(&f, "BV01");
}

#[test]
fn input_schema_string() {
    let f = RemoteFunction::Vector {
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
    test_err(&f, "LV14");
}

#[test]
fn input_schema_object_no_required_array() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "name" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["name".to_string()]),
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
    test_err(&f, "LV13");
}

#[test]
fn scalar_function_without_map() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None, // missing map
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV03");
}

#[test]
fn placeholder_scalar_without_map() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            TaskExpression::PlaceholderScalarFunction(PlaceholderScalarFunctionTaskExpression {
                input_schema: InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                skip: None,
                map: None, // missing map
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV04");
}

#[test]
fn vector_function_with_map() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::VectorFunction(VectorFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV05");
}

#[test]
fn placeholder_vector_with_map() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression {
            input_schema: InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "items" => InputSchema::Array(ArrayInputSchema {
                        description: None,
                        min_items: Some(2),
                        max_items: Some(2),
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
            output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
            input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
            input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV06");
}

#[test]
fn contains_vector_completion() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![WithExpression::Value(
                MessageExpression::User(UserMessageExpression {
                    content: WithExpression::Value(RichContentExpression::Parts(vec![
                        WithExpression::Value(RichContentPartExpression::Text {
                            text: WithExpression::Value("Hello".to_string()),
                        }),
                    ])),
                    name: None,
                }),
            )]),
            tools: None,
            responses: WithExpression::Value(vec![
                WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("A".to_string()) })])),
                WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("B".to_string()) })])),
            ]),
            output: Expression::Starlark("output['scores']".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV07");
}

#[test]
fn single_mapped_scalar_task() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("map".to_string())),
            output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV08");
}

#[test]
fn over_50_percent_mapped_scalar() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV09");
}

// --- Success cases ---

#[test]
fn valid_single_vector_function() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::VectorFunction(VectorFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn valid_single_placeholder_vector() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression {
            input_schema: InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "items" => InputSchema::Array(ArrayInputSchema {
                        description: None,
                        min_items: Some(2),
                        max_items: Some(2),
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
            output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
            input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
            input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn valid_50_50_split() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn valid_mixed_tasks() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn valid_all_unmapped_vector() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

// --- Description tests ---

#[test]
fn description_too_long() {
    let f = RemoteFunction::Vector {
        description: "a".repeat(351),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                })
            },
            required: Some(vec!["items".to_string()]),
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
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['items'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'items': [x]} for x in input['items']]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'items': [x['items'][0] for x in input]}".to_string(),
        )),
    };
    test_err(&f, "QD02");
}

#[test]
fn description_empty() {
    let f = RemoteFunction::Vector {
        description: "  ".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                })
            },
            required: Some(vec!["items".to_string()]),
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
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['items'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'items': [x]} for x in input['items']]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'items': [x['items'][0] for x in input]}".to_string(),
        )),
    };
    test_err(&f, "QD01");
}

// --- Full-function input diversity tests ---

#[test]
fn input_diversity_fail_third_task_fixed_input() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            // Task 0: passes parent input through — OK
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            // Task 1: passes input with label modification — OK
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label'] + ' v2'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            // Task 2: FIXED input — ignores parent input
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': ['A', 'B'], 'label': 'fixed'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV18");
}

#[test]
fn input_diversity_fail_third_task_mapped_fixed() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label'] + ' v2'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("'constant'".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': 'alt'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV18");
}

// --- Passing diversity ---

#[test]
fn input_diversity_pass_vector_function_passthrough() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label']}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn input_diversity_pass_mixed_mapped_and_unmapped() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn input_diversity_pass_placeholder_vector_tasks() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            TaskExpression::PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression {
                input_schema: InputSchema::Object(ObjectInputSchema {
                    description: None,
                    properties: index_map! {
                        "items" => InputSchema::Array(ArrayInputSchema {
                            description: None,
                            min_items: Some(2),
                            max_items: Some(2),
                            items: Box::new(InputSchema::String(StringInputSchema {
                                description: None,
                                r#enum: None,
                            })),
                        })
                    },
                    required: Some(vec!["items".to_string()]),
                }),
                output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
                input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x]} for x in input['items']]".to_string())),
                input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input]}".to_string())),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression {
                input_schema: InputSchema::Object(ObjectInputSchema {
                    description: None,
                    properties: index_map! {
                        "items" => InputSchema::Array(ArrayInputSchema {
                            description: None,
                            min_items: Some(2),
                            max_items: Some(2),
                            items: Box::new(InputSchema::String(StringInputSchema {
                                description: None,
                                r#enum: None,
                            })),
                        })
                    },
                    required: Some(vec!["items".to_string()]),
                }),
                output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
                input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x]} for x in input['items']]".to_string())),
                input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input]}".to_string())),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': [x + ' alt' for x in input['items']]}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn input_diversity_pass_mapped_scalar_with_two_vectors() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label'] + ' alt'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn input_diversity_fail_child_min_items_3() {
    let parent_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: index_map! {
            "entries" => InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(3),
                max_items: Some(3),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            "tag" => InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })
        },
        required: Some(vec!["entries".to_string(), "tag".to_string()]),
    });
    let child_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: index_map! {
            "entries" => InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(3),
                max_items: Some(3),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            })
        },
        required: Some(vec!["entries".to_string()]),
    });
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: parent_schema,
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression {
                input_schema: child_schema,
                output_length: WithExpression::Expression(Expression::Starlark("len(input['entries'])".to_string())),
                input_split: WithExpression::Expression(Expression::Starlark("[{'entries': [x]} for x in input['entries']]".to_string())),
                input_merge: WithExpression::Expression(Expression::Starlark("{'entries': [x['entries'][0] for x in input]}".to_string())),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'entries': input['entries']}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['entries'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'entries': [e], 'tag': input['tag']} for e in input['entries']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'entries': [x['entries'][0] for x in input], 'tag': input[0]['tag']}".to_string())),
    };
    test_err(&f, "VF21");
}

#[test]
fn input_diversity_pass_no_input_maps() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label'] + ' v2'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn input_diversity_fail_with_input_maps_fixed() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            // Task 0: unmapped vector passes input — OK
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            // Task 1: mapped scalar uses FIXED input, ignoring map element
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("'always_same'".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV18");
}

#[test]
fn rejects_no_tasks() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV02");
}

// --- Unused input_maps tests ---

#[test]
fn rejects_unused_input_maps() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label']}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV12");
}

// --- Skip expression tests ---

#[test]
fn valid_with_skip_last_task_boolean() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "label" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "skip_last_task" => InputSchema::Boolean(BooleanInputSchema {
                    description: None,
                })
            },
            required: Some(vec!["items".to_string(), "label".to_string(), "skip_last_task".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: Some(Expression::Starlark("input['skip_last_task']".to_string())),
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label'] + ' v2', 'skip_last_task': input['skip_last_task']}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label'], 'skip_last_task': input['skip_last_task']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label'], 'skip_last_task': input[0]['skip_last_task']}".to_string())),
    };
    test(&f);
}

#[test]
fn valid_with_skip_on_quick_mode() {
    let f = RemoteFunction::Vector {
        description: "Rank with optional deep analysis".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "mode" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: Some(vec!["quick".to_string(), "thorough".to_string()]),
                })
            },
            required: Some(vec!["items".to_string(), "mode".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: Some(Expression::Starlark("input['mode'] == 'quick'".to_string())),
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'mode': input['mode'] + '-deep'}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'mode': input['mode']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'mode': input[0]['mode']}".to_string())),
    };
    test(&f);
}

#[test]
fn rejects_out_of_bounds_map_index() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(1), // index 1 doesn't exist
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("{'items': input['items'], 'label': input['label']}".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV11");
}

// --- Output expression distribution tests ---

#[test]
fn output_distribution_pass_mapped_scalar_max_items_10() {
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn output_distribution_pass_mixed_tasks_max_items_10() {
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) if sum(output) > 0 else 1.0 / len(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn output_distribution_fail_biased_mapped_scalar() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark(
                    "[x * 0.1 + 0.45 for x in [y / sum(output) if sum(output) > 0 else 1.0 / len(output) for y in output]]".to_string(),
                ),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "OD06");
}

#[test]
fn output_distribution_fail_biased_unmapped_vector() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::VectorFunction(VectorFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark(
                "[x * 0.1 + 0.45 for x in output]".to_string(),
            ),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "OD06");
}

#[test]
fn output_distribution_fail_mapped_scalar_division_by_zero() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(0),
                input: WithExpression::Expression(Expression::Starlark("map".to_string())),
                output: Expression::Starlark("[x / sum(output) for x in output]".to_string()),
            }),
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: None,
                input: WithExpression::Expression(Expression::Starlark("input".to_string())),
                output: Expression::Starlark("output".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "OD09");
}

#[test]
fn output_distribution_pass_identity() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        tasks: vec![TaskExpression::VectorFunction(VectorFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn rejects_single_permutation_string_enum() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(2),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: Some(vec!["only".to_string()]),
            })),
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
    test_err(&f, "QI01");
}

#[test]
fn all_tasks_skipped() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(2),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
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
            TaskExpression::VectorFunction(VectorFunctionTaskExpression {
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
    test_err(&f, "CV42");
}

#[test]
fn rejects_single_permutation_integer() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(2),
            items: Box::new(InputSchema::Integer(IntegerInputSchema {
                description: None,
                minimum: Some(0),
                maximum: Some(0),
            })),
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
    test_err(&f, "QI01");
}

#[test]
fn output_length_less_than_2() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(1),
            max_items: Some(3),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
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
    test_err(&f, "VF03");
}
#[test]
fn input_maps_compilation_fails() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("1 + ".to_string()), // Syntax error
        ])),
        tasks: vec![TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("map".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV10");
}

#[test]
fn input_merge_fails_on_subset() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(3),
                    max_items: Some(3),
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
        tasks: vec![TaskExpression::VectorFunction(VectorFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': 1/0}".to_string())),
    };
    test_err(&f, "BV15");
}

#[test]
fn no_example_inputs() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::AnyOf(AnyOfInputSchema { any_of: vec![] }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorFunction(VectorFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("1".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("input[0]".to_string())),
    };
    test_err(&f, "BV17");
}

#[test]
fn fixed_mapped_input() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("['fixed_val', 'fixed_val']".to_string()),
        ])),
        tasks: vec![TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("map".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV19");
}

#[test]
fn all_mapped_inputs_equal() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("[input['label'], input['label']]".to_string()),
        ])),
        tasks: vec![TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
            owner: "test".to_string(),
            repository: "test".to_string(),
            commit: "abc123".to_string(),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("map".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "BV20");
}

#[test]
fn placeholder_scalar_field_fails() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                })
            },
            required: Some(vec!["items".to_string()]),
        }),
        input_maps: Some(InputMaps::Many(vec![
            Expression::Starlark("input['items']".to_string()),
        ])),
        tasks: vec![TaskExpression::PlaceholderScalarFunction(PlaceholderScalarFunctionTaskExpression {
            input_schema: InputSchema::AnyOf(AnyOfInputSchema { any_of: vec![] }),
            skip: None,
            map: Some(0),
            input: WithExpression::Expression(Expression::Starlark("map".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x]} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input]}".to_string())),
    };
    test_err(&f, "BV21");
}

#[test]
fn placeholder_vector_field_fails() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                })
            },
            required: Some(vec!["items".to_string()]),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression {
            input_schema: InputSchema::AnyOf(AnyOfInputSchema { any_of: vec![] }),
            output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
            input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x]} for x in input['items']]".to_string())),
            input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input]}".to_string())),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark("input".to_string())),
            output: Expression::Starlark("output".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x]} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input]}".to_string())),
    };
    test_err(&f, "BV22");
}
