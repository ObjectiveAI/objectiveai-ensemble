//! Tests for check_branch_vector_function.

#![cfg(test)]

use crate::chat::completions::request::{
    MessageExpression, RichContentExpression, RichContentPartExpression,
    UserMessageExpression,
};
use crate::functions::expression::{
    ArrayInputSchema, Expression, InputMaps, InputSchema, ObjectInputSchema,
    StringInputSchema, WithExpression,
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

fn test_err(f: &RemoteFunction, expected: &[&str]) {
    let err = check_branch_vector_function(f, None).unwrap_err();
    for s in expected {
        assert!(err.contains(s), "expected '{s}' in error, got: {err}");
    }
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
    test_err(&f, &["Expected vector function, got scalar function"]);
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
    test_err(&f, &["must be an array, or an object"]);
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
    test_err(&f, &["must be an array, or an object"]);
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
    test_err(&f, &["scalar.function in a vector function must have map"]);
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
    test_err(
        &f,
        &["placeholder.scalar.function in a vector function must have map"],
    );
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
    test_err(
        &f,
        &["vector.function in a vector function must not have map"],
    );
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
    test_err(
        &f,
        &["placeholder.vector.function in a vector function must not have map"],
    );
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
    test_err(&f, &["must not contain vector.completion tasks"]);
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
            output: Expression::Starlark("[x / sum(output) for x in output]".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, &["single task must use an unmapped vector-like task"]);
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
                output: Expression::Starlark("[x / sum(output) for x in output]".to_string()),
            }),
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
    test_err(&f, &["At most 50%"]);
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("351 bytes"),
        "expected byte count error, got: {err}"
    );
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("must not be empty"),
        "expected empty error, got: {err}"
    );
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed value"),
        "expected Task [2] fixed value error, got: {err}"
    );
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
                output: Expression::Starlark("[x / sum(output) for x in output]".to_string()),
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed value"),
        "expected Task [2] fixed value error, got: {err}"
    );
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("violates input_schema") && err.contains("min_items"),
        "Expected min_items violation from input_merge, got: {err}"
    );
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
                output: Expression::Starlark("[x / sum(output) for x in output]".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [1]") && err.contains("fixed value"),
        "expected Task [1] fixed value error, got: {err}"
    );
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
    test_err(&f, &["at least one task"]);
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("not referenced by any task's map field"),
        "expected unused input_maps error, got: {err}"
    );
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
                output: Expression::Starlark("[x / sum(output) for x in output]".to_string()),
            }),
            TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
                owner: "test".to_string(),
                repository: "test".to_string(),
                commit: "abc123".to_string(),
                skip: None,
                map: Some(1), // index 1 doesn't exist
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("map index 1") && err.contains("only 1 sub-arrays"),
        "expected out-of-bounds map error, got: {err}"
    );
}
