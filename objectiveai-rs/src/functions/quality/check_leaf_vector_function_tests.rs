//! Tests for check_leaf_vector_function.

#![cfg(test)]

use crate::chat::completions::request::{
    MessageExpression, RichContentExpression, RichContentPartExpression,
    SimpleContentExpression, SimpleContentPartExpression,
    SystemMessageExpression, UserMessageExpression,
};
use crate::functions::expression::{
    ArrayInputSchema, BooleanInputSchema, Expression, ImageInputSchema,
    InputSchema, IntegerInputSchema, ObjectInputSchema, StringInputSchema,
    WithExpression,
};
use crate::functions::quality::check_leaf_vector_function;
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression,
    PlaceholderVectorFunctionTaskExpression, RemoteFunction,
    ScalarFunctionTaskExpression, TaskExpression,
    VectorCompletionTaskExpression, VectorFunctionTaskExpression,
};
use crate::util::index_map;

fn test(f: &RemoteFunction) {
    check_leaf_vector_function(f).unwrap();
}

fn test_err(f: &RemoteFunction, expected: &str) {
    let err = check_leaf_vector_function(f).unwrap_err();
    assert!(
        err.contains(expected),
        "expected '{expected}' in error, got: {err}"
    );
}

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
        tasks: vec![],
    };
    test_err(&f, "LV01");
}

#[test]
fn rejects_input_maps() {
    use crate::functions::expression::InputMaps;
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
        input_maps: Some(InputMaps::One(Expression::Starlark(
            "input".to_string(),
        ))),
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "LV02");
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
    test_err(&f, "LV13");
}

#[test]
fn contains_scalar_function_task() {
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
    test_err(&f, "LV05");
}

#[test]
fn contains_vector_function_task() {
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
    test_err(&f, "LV06");
}

#[test]
fn contains_placeholder_scalar_task() {
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
    test_err(&f, "LV07");
}

#[test]
fn contains_placeholder_vector_task() {
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
        tasks: vec![TaskExpression::PlaceholderVectorFunction(
            PlaceholderVectorFunctionTaskExpression {
                input_schema: InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
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
    test_err(&f, "LV08");
}

#[test]
fn vc_task_has_map() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "LV04");
}

#[test]
fn responses_fixed_array() {
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
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "LS12");
}

// --- Output expression uniqueness ---

#[test]
fn derived_vector_output_expression_passes() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test(&f);
}

#[test]
fn fixed_vector_output_expression() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("[0.5, 0.5]".to_string()),
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
    test_err(&f, "CV11");
}

#[test]
fn branching_vector_output_two_values() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "[0.7, 0.3] if output['scores'][0] > 0.5 else [0.3, 0.7]"
                        .to_string(),
                ),
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
    test_err(&f, "CV11");
}

#[test]
fn branching_vector_output_three_values() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "[0.6, 0.4] if output['scores'][0] < 0.33 else ([0.5, 0.5] if output['scores'][0] < 0.66 else [0.4, 0.6])"
                        .to_string(),
                ),
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
    test_err(&f, "CV11");
}

// --- Response diversity ---

#[test]
fn responses_fixed_expression_fails_diversity() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'A'}], [{'type': 'text', 'text': 'B'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores']".to_string(),
                ),
            },
        )],
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
    test_err(&f, "LV16");
}

#[test]
fn responses_fixed_pool_expression_fails_diversity() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'cat'}], [{'type': 'text', 'text': 'dog'}]]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores']".to_string(),
                ),
            },
        )],
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
    test_err(&f, "LV16");
}

#[test]
fn responses_derived_from_input_passes_diversity() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input['items']]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores']".to_string(),
                ),
            },
        )],
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
    test(&f);
}

// --- Description tests ---

#[test]
fn description_too_long() {
    let f = RemoteFunction::Vector {
        description: "a".repeat(351),
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "QD02");
}

#[test]
fn description_empty() {
    let f = RemoteFunction::Vector {
        description: "  ".to_string(),
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "QD01");
}

// --- Full-function diversity tests ---

#[test]
fn diversity_fail_third_task_object_schema() {
    let f = RemoteFunction::Vector {
        description: "Pick the better candidate".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "candidates" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "category" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["candidates".to_string(), "category".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': c}] for c in input['candidates']]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': input['category'] + ': ' + c}] for c in input['candidates']]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': 'Yes'}], [{'type': 'text', 'text': 'No'}]]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['candidates'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'candidates': [c], 'category': input['category']} for c in input['candidates']]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'candidates': [x['candidates'][0] for x in input], 'category': input[0]['category']}".to_string(),
        )),
    };
    test_err(&f, "LV16");
}

#[test]
fn diversity_fail_third_task_with_labels() {
    let f = RemoteFunction::Vector {
        description: "Rank entries".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "entries" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
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
            required: Some(vec!["entries".to_string(), "label".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': e}] for e in input['entries']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': input['label'] + ': ' + e}] for e in input['entries']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': ['First', 'Second', 'Third'][i]}] for i in range(len(input['entries']))]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['entries'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'entries': [e], 'label': input['label']} for e in input['entries']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'entries': [x['entries'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test_err(&f, "LV16");
}

// --- Passing diversity ---

#[test]
fn diversity_pass_ranking_with_enum_categories() {
    let f = RemoteFunction::Vector {
        description: "Compare options by criterion".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "options" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema { description: None, r#enum: None })),
                }),
                "criterion" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: Some(vec!["quality".to_string(), "speed".to_string(), "cost".to_string()]),
                })
            },
            required: Some(vec!["options".to_string(), "criterion".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': o}] for o in input['options']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': input['criterion'] + ': ' + o}] for o in input['options']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['options'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'options': [o], 'criterion': input['criterion']} for o in input['options']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'options': [x['options'][0] for x in input], 'criterion': input[0]['criterion']}".to_string())),
    };
    test(&f);
}

#[test]
fn diversity_pass_array_of_integers() {
    let f = RemoteFunction::Vector {
        description: "Rank integers by preference".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None, min_items: Some(2), max_items: Some(4),
            items: Box::new(InputSchema::Integer(IntegerInputSchema { description: None, minimum: Some(0), maximum: Some(999) })),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': str(n)}] for n in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': 'Value #' + str(i) + ': ' + str(input[i])}] for i in range(len(input))]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input)".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[[x] for x in input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("[x[0] for x in input]".to_string())),
    };
    test(&f);
}

#[test]
fn diversity_pass_nested_object_with_descriptions() {
    let f = RemoteFunction::Vector {
        description: "Rank items with descriptions".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema { description: None, min_items: Some(2), max_items: Some(2), items: Box::new(InputSchema::String(StringInputSchema { description: None, r#enum: None })) }),
                "descriptions" => InputSchema::Array(ArrayInputSchema { description: None, min_items: Some(2), max_items: Some(2), items: Box::new(InputSchema::String(StringInputSchema { description: None, r#enum: None })) }),
                "title" => InputSchema::String(StringInputSchema { description: None, r#enum: None })
            },
            required: Some(vec!["items".to_string(), "descriptions".to_string(), "title".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': x}] for x in input['items']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': input['items'][i] + ' - ' + input['descriptions'][i]}] for i in range(len(input['items']))]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': input['title'] + ': ' + x}] for x in input['items']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [input['items'][i]], 'descriptions': [input['descriptions'][i]], 'title': input['title']} for i in range(len(input['items']))]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'descriptions': [x['descriptions'][0] for x in input], 'title': input[0]['title']}".to_string())),
    };
    test(&f);
}

#[test]
fn diversity_pass_array_of_objects_with_nested_fields() {
    let f = RemoteFunction::Vector {
        description: "Compare tagged items".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None, min_items: Some(2), max_items: Some(2),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "name" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "tags" => InputSchema::Array(ArrayInputSchema { description: None, min_items: Some(1), max_items: Some(3), items: Box::new(InputSchema::String(StringInputSchema { description: None, r#enum: None })) })
                },
                required: Some(vec!["name".to_string(), "tags".to_string()]),
            })),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': x['name']}] for x in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': x['name'] + ' [' + x['tags'][0] + ']'}] for x in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input)".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[[x] for x in input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("[x[0] for x in input]".to_string())),
    };
    test(&f);
}

#[test]
fn diversity_pass_object_with_context_and_choices() {
    let f = RemoteFunction::Vector {
        description: "Weighted choice selector".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "context" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                "choices" => InputSchema::Array(ArrayInputSchema { description: None, min_items: Some(2), max_items: Some(2), items: Box::new(InputSchema::String(StringInputSchema { description: None, r#enum: None })) }),
                "weight" => InputSchema::Integer(IntegerInputSchema { description: None, minimum: Some(1), maximum: Some(10) })
            },
            required: Some(vec!["context".to_string(), "choices".to_string(), "weight".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': c}] for c in input['choices']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': input['context'] + ' -> ' + c}] for c in input['choices']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': c + ' (w=' + str(input['weight']) + ')'}] for c in input['choices']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['choices'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'context': input['context'], 'choices': [c], 'weight': input['weight']} for c in input['choices']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'context': input[0]['context'], 'choices': [x['choices'][0] for x in input], 'weight': input[0]['weight']}".to_string())),
    };
    test(&f);
}

// --- Within-input response diversity ---

#[test]
fn within_input_responses_all_cloned() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(4),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': input[0]}] for _ in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "LV17");
}

#[test]
fn within_input_responses_cloned_two_elements() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': input[0]}] for _ in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "LV17");
}

// --- Success cases ---

#[test]
fn valid_array_schema() {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test(&f);
}

#[test]
fn valid_object_with_required_array() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema { description: None, min_items: Some(2), max_items: Some(2), items: Box::new(InputSchema::String(StringInputSchema { description: None, r#enum: None })) }),
                "label" => InputSchema::String(StringInputSchema { description: None, r#enum: None })
            },
            required: Some(vec!["items".to_string(), "label".to_string()]),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None, map: None,
            messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': x}] for x in input['items']]".to_string())),
            output: Expression::Starlark("output['scores']".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'label': input['label']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'label': input[0]['label']}".to_string())),
    };
    test(&f);
}

#[test]
fn valid_multiple_tasks() {
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
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test(&f);
}

// --- People ranking tests (optional lastName) ---

#[test]
fn valid_people_ranking_with_skip() {
    let f = RemoteFunction::Vector {
        description: "Rank people by name quality".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None, min_items: Some(2), max_items: Some(4),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "fullName" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "firstName" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "lastName" => InputSchema::String(StringInputSchema { description: None, r#enum: None })
                },
                required: Some(vec!["fullName".to_string(), "firstName".to_string()]),
            })),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': p['fullName']}] for p in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': p['firstName']}] for p in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark("any([p.get('lastName') == None for p in input])".to_string())),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': p['lastName']}] for p in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input)".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[[x] for x in input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("[x[0] for x in input]".to_string())),
    };
    test(&f);
}

#[test]
fn people_ranking_null_lastname_replaced() {
    let f = RemoteFunction::Vector {
        description: "Rank people by name quality".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None, min_items: Some(2), max_items: Some(4),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "fullName" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "firstName" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "lastName" => InputSchema::String(StringInputSchema { description: None, r#enum: None })
                },
                required: Some(vec!["fullName".to_string(), "firstName".to_string()]),
            })),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': p['fullName']}] for p in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': p['firstName']}] for p in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': p.get('lastName', 'NULL')}] for p in input]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input)".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[[x] for x in input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("[x[0] for x in input]".to_string())),
    };
    test(&f);
}

#[test]
fn rejects_no_tasks() {
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
    test_err(&f, "LV03");
}

// --- Response diversity: optional-field array items ---

#[test]
fn response_diversity_pass_boolean_derived() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None, min_items: Some(2), max_items: Some(4),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "label" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "flag" => InputSchema::Boolean(BooleanInputSchema { description: None })
                },
                required: None,
            })),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None, map: None,
            messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': str(x.get('flag', 'NULL'))}] for x in input]".to_string())),
            output: Expression::Starlark("output['scores']".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input)".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[[x] for x in input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("[x[0] for x in input]".to_string())),
    };
    test(&f);
}

#[test]
fn response_diversity_fail_fixed_responses() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None, min_items: Some(2), max_items: Some(3),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "label" => InputSchema::String(StringInputSchema { description: None, r#enum: None }),
                    "flag" => InputSchema::Boolean(BooleanInputSchema { description: None })
                },
                required: None,
            })),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None, map: None,
            messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': str(i)}] for i in range(len(input))]".to_string())),
            output: Expression::Starlark("output['scores']".to_string()),
        })],
        output_length: WithExpression::Expression(Expression::Starlark("len(input)".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[[x] for x in input]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("[x[0] for x in input]".to_string())),
    };
    test_err(&f, "LV16");
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
                "skip_last_task" => InputSchema::Boolean(BooleanInputSchema {
                    description: None,
                })
            },
            required: Some(vec!["items".to_string(), "skip_last_task".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': x}] for x in input['items']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark("input['skip_last_task']".to_string())),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': 'alt: ' + x}] for x in input['items']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'skip_last_task': input['skip_last_task']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'skip_last_task': input[0]['skip_last_task']}".to_string())),
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
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None, map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': x}] for x in input['items']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark("input['mode'] == 'quick'".to_string())),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(MessageExpression::User(UserMessageExpression { content: WithExpression::Value(RichContentExpression::Parts(vec![WithExpression::Value(RichContentPartExpression::Text { text: WithExpression::Value("Hello".to_string()) })])), name: None }))]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark("[[{'type': 'text', 'text': input['mode'] + ': ' + x}] for x in input['items']]".to_string())),
                output: Expression::Starlark("output['scores']".to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark("len(input['items'])".to_string())),
        input_split: WithExpression::Expression(Expression::Starlark("[{'items': [x], 'mode': input['mode']} for x in input['items']]".to_string())),
        input_merge: WithExpression::Expression(Expression::Starlark("{'items': [x['items'][0] for x in input], 'mode': input[0]['mode']}".to_string())),
    };
    test(&f);
}

// --- Output expression distribution tests ---

#[test]
fn output_distribution_fail_biased() {
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
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'rank these'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "[x * 0.1 + 0.45 for x in output['scores']]".to_string(),
                ),
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
    test_err(&f, "OD06");
}

#[test]
fn output_distribution_pass() {
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
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'rank these'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores']".to_string(),
                ),
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
    test(&f);
}

#[test]
fn output_distribution_pass_no_max_items() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: None,
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'rank these'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "output['scores']".to_string(),
                ),
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
    test(&f);
}

#[test]
fn output_distribution_fail_division_by_zero() {
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
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [{'type': 'text', 'text': 'rank these'}]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark(
                    "[x / sum(output['scores']) for x in output['scores']]".to_string(),
                ),
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
    test_err(&f, "OD05");
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
                                        text: WithExpression::Expression(
                                            Expression::Starlark(
                                                "input[0]".to_string(),
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[{'type': 'text', 'text': x} for x in input]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
                                        text: WithExpression::Expression(
                                            Expression::Starlark(
                                                "str(input[0])".to_string(),
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
                responses: WithExpression::Expression(Expression::Starlark(
                    "[{'type': 'text', 'text': str(x)} for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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

// --- Multimodal coverage tests ---

#[test]
fn modality_fail_image_in_schema_but_text_only() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(4),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "photo" => InputSchema::Image(ImageInputSchema {
                        description: None,
                    }),
                    "name" => InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })
                },
                required: Some(vec!["photo".to_string(), "name".to_string()]),
            })),
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
                                            "rank these".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x['name']}] for x in input]"
                        .to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test_err(&f, "LV18");
}

#[test]
fn modality_fail_image_in_nested_schema_but_text_only() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "candidates" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(4),
                    items: Box::new(InputSchema::Object(ObjectInputSchema {
                        description: None,
                        properties: index_map! {
                            "avatar" => InputSchema::Image(ImageInputSchema {
                                description: None,
                            }),
                            "bio" => InputSchema::String(StringInputSchema {
                                description: None,
                                r#enum: None,
                            })
                        },
                        required: Some(vec!["avatar".to_string(), "bio".to_string()]),
                    })),
                })
            },
            required: Some(vec!["candidates".to_string()]),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(
                            vec![WithExpression::Value(
                                RichContentPartExpression::Text {
                                    text: WithExpression::Value("rank".to_string()),
                                },
                            )],
                        )),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': c['bio']}] for c in input['candidates']]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
            },
        )],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['candidates'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'candidates': [c]} for c in input['candidates']]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'candidates': [x['candidates'][0] for x in input]}".to_string(),
        )),
    };
    test_err(&f, "LV18");
}

#[test]
fn modality_pass_image_in_responses() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(4),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "photo" => InputSchema::Image(ImageInputSchema {
                        description: None,
                    }),
                    "name" => InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })
                },
                required: Some(vec!["photo".to_string(), "name".to_string()]),
            })),
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
                                            "rank these photos".to_string(),
                                        ),
                                    },
                                ),
                            ]),
                        ),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[x['photo']] for x in input]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test(&f);
}

#[test]
fn modality_pass_image_in_messages() {
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(4),
            items: Box::new(InputSchema::Object(ObjectInputSchema {
                description: None,
                properties: index_map! {
                    "photo" => InputSchema::Image(ImageInputSchema {
                        description: None,
                    }),
                    "name" => InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })
                },
                required: Some(vec!["photo".to_string(), "name".to_string()]),
            })),
        }),
        input_maps: None,
        tasks: vec![TaskExpression::VectorCompletion(
            VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Expression(Expression::Starlark(
                    "[{'role': 'user', 'content': [x['photo'] for x in input]}]"
                        .to_string(),
                )),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    "[[{'type': 'text', 'text': x['name']}] for x in input]".to_string(),
                )),
                output: Expression::Starlark("output['scores']".to_string()),
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
    test(&f);
}

// fail due to all skipped tasks
#[test]
fn job_application_ranker_1() {
    let f = RemoteFunction::Vector {
        description: "Ranks job applications against a job description by evaluating six dimensions: relevance of experience, skills alignment, demonstrated impact, clarity of communication, career trajectory, and tailoring to the role. Produces a consistent, principled ordering that helps hiring teams prioritize the most promising candidates.".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: Some("An object containing job applications to rank and a job description".to_string()),
            properties: index_map! {
                "apps" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: None,
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "job_description" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["apps".to_string(), "job_description".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            // Task 1: skills alignment
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark(
                    r#"len(input["apps"]) < 3"#.to_string(),
                )),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""I am hiring for the following position:\n\n" + input["job_description"] + "\n\nDraft an application from a candidate who demonstrates strong alignment between their technical and interpersonal skills and the specific requirements listed in the job posting. The application should weave skills into a narrative of applied capability rather than simply listing them.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 2: skills alignment (skipped for single app)
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark(
                    r#"len(input["apps"]) < 3"#.to_string(),
                )),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""I am hiring for the following position:\n\n" + input["job_description"] + "\n\nDraft an application from a candidate who demonstrates strong alignment between their technical and interpersonal skills and the specific requirements listed in the job posting. The application should weave skills into a narrative of applied capability rather than simply listing them.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 3: demonstrated impact
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark(
                    r#"len(input["apps"]) < 3"#.to_string(),
                )),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""For this open role:\n\n" + input["job_description"] + "\n\nGenerate an application from a candidate who presents concrete, measurable accomplishments and tangible results from their prior work. The application should quantify achievements and describe specific outcomes the candidate has driven, such as growing revenue, reducing costs, improving processes, or shipping products.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 4: clarity of communication
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark(
                    r#"len(input["apps"]) < 3"#.to_string(),
                )),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Write a well-structured, professionally articulated, and concise job application. The application should demonstrate excellent communication skills through clear organization, precise language, appropriate tone, grammatical correctness, and attention to detail.".to_string(),
                                ),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 5: career trajectory (system + user message)
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark(
                    r#"len(input["apps"]) < 3"#.to_string(),
                )),
                map: None,
                messages: WithExpression::Value(vec![
                    WithExpression::Value(MessageExpression::System(SystemMessageExpression {
                        content: WithExpression::Value(SimpleContentExpression::Parts(vec![
                            WithExpression::Value(SimpleContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "You are a career advisor helping a client present a compelling narrative of professional growth. You value candidates who show patterns of increasing responsibility, skill development, and intentional career progression.".to_string(),
                                ),
                            }),
                        ])),
                        name: None,
                    })),
                    WithExpression::Value(MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""Your client is applying for this role:\n\n" + input["job_description"] + "\n\nDraft their application, emphasizing a career trajectory of increasing responsibility and professional growth that naturally leads to this position. The application should convey upward momentum, broadening scope, and a capacity for continuous learning.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    })),
                ]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 6: tailoring to the role
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: Some(Expression::Starlark(
                    r#"len(input["apps"]) < 3"#.to_string(),
                )),
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""Here is a job posting I want to apply for:\n\n" + input["job_description"] + "\n\nWrite my application, making sure to reference specific aspects of this role and draw direct connections between my background and what the employer is looking for. The application should clearly demonstrate that it was crafted specifically for this opportunity rather than being a generic submission.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            r#"len(input["apps"])"#.to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            r#"[{"apps": [app], "job_description": input["job_description"]} for app in input["apps"]]"#.to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            r#"{"apps": [app for sub in input for app in sub["apps"]], "job_description": input[0]["job_description"]}"#.to_string(),
        )),
    };
    test_err(&f, "CV42");
}

#[test]
fn job_application_ranker_2() {
    let f = RemoteFunction::Vector {
        description: "Ranks job applications against a job description by evaluating six dimensions: relevance of experience, skills alignment, demonstrated impact, clarity of communication, career trajectory, and tailoring to the role. Produces a consistent, principled ordering that helps hiring teams prioritize the most promising candidates.".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: Some("An object containing job applications to rank and a job description".to_string()),
            properties: index_map! {
                "apps" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(1),
                    max_items: None,
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "job_description" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["apps".to_string(), "job_description".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            // Task 1: skills alignment
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""I am hiring for the following position:\n\n" + input["job_description"] + "\n\nDraft an application from a candidate who demonstrates strong alignment between their technical and interpersonal skills and the specific requirements listed in the job posting. The application should weave skills into a narrative of applied capability rather than simply listing them.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 2: skills alignment (skipped for single app)
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""I am hiring for the following position:\n\n" + input["job_description"] + "\n\nDraft an application from a candidate who demonstrates strong alignment between their technical and interpersonal skills and the specific requirements listed in the job posting. The application should weave skills into a narrative of applied capability rather than simply listing them.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 3: demonstrated impact
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""For this open role:\n\n" + input["job_description"] + "\n\nGenerate an application from a candidate who presents concrete, measurable accomplishments and tangible results from their prior work. The application should quantify achievements and describe specific outcomes the candidate has driven, such as growing revenue, reducing costs, improving processes, or shipping products.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 4: clarity of communication
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Write a well-structured, professionally articulated, and concise job application. The application should demonstrate excellent communication skills through clear organization, precise language, appropriate tone, grammatical correctness, and attention to detail.".to_string(),
                                ),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 5: career trajectory (system + user message)
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![
                    WithExpression::Value(MessageExpression::System(SystemMessageExpression {
                        content: WithExpression::Value(SimpleContentExpression::Parts(vec![
                            WithExpression::Value(SimpleContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "You are a career advisor helping a client present a compelling narrative of professional growth. You value candidates who show patterns of increasing responsibility, skill development, and intentional career progression.".to_string(),
                                ),
                            }),
                        ])),
                        name: None,
                    })),
                    WithExpression::Value(MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""Your client is applying for this role:\n\n" + input["job_description"] + "\n\nDraft their application, emphasizing a career trajectory of increasing responsibility and professional growth that naturally leads to this position. The application should convey upward momentum, broadening scope, and a capacity for continuous learning.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    })),
                ]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 6: tailoring to the role
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""Here is a job posting I want to apply for:\n\n" + input["job_description"] + "\n\nWrite my application, making sure to reference specific aspects of this role and draw direct connections between my background and what the employer is looking for. The application should clearly demonstrate that it was crafted specifically for this opportunity rather than being a generic submission.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            r#"len(input["apps"])"#.to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            r#"[{"apps": [app], "job_description": input["job_description"]} for app in input["apps"]]"#.to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            r#"{"apps": [app for sub in input for app in sub["apps"]], "job_description": input[0]["job_description"]}"#.to_string(),
        )),
    };
    test_err(&f, "CV28");
}

// pass
#[test]
fn job_application_ranker_3() {
    let f = RemoteFunction::Vector {
        description: "Ranks job applications against a job description by evaluating six dimensions: relevance of experience, skills alignment, demonstrated impact, clarity of communication, career trajectory, and tailoring to the role. Produces a consistent, principled ordering that helps hiring teams prioritize the most promising candidates.".to_string(),
        changelog: None,
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: Some("An object containing job applications to rank and a job description".to_string()),
            properties: index_map! {
                "apps" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: None,
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
                "job_description" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })
            },
            required: Some(vec!["apps".to_string(), "job_description".to_string()]),
        }),
        input_maps: None,
        tasks: vec![
            // Task 1: skills alignment
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""I am hiring for the following position:\n\n" + input["job_description"] + "\n\nDraft an application from a candidate who demonstrates strong alignment between their technical and interpersonal skills and the specific requirements listed in the job posting. The application should weave skills into a narrative of applied capability rather than simply listing them.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 2: skills alignment (skipped for single app)
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""I am hiring for the following position:\n\n" + input["job_description"] + "\n\nDraft an application from a candidate who demonstrates strong alignment between their technical and interpersonal skills and the specific requirements listed in the job posting. The application should weave skills into a narrative of applied capability rather than simply listing them.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 3: demonstrated impact
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""For this open role:\n\n" + input["job_description"] + "\n\nGenerate an application from a candidate who presents concrete, measurable accomplishments and tangible results from their prior work. The application should quantify achievements and describe specific outcomes the candidate has driven, such as growing revenue, reducing costs, improving processes, or shipping products.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 4: clarity of communication
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "Write a well-structured, professionally articulated, and concise job application. The application should demonstrate excellent communication skills through clear organization, precise language, appropriate tone, grammatical correctness, and attention to detail.".to_string(),
                                ),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 5: career trajectory (system + user message)
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![
                    WithExpression::Value(MessageExpression::System(SystemMessageExpression {
                        content: WithExpression::Value(SimpleContentExpression::Parts(vec![
                            WithExpression::Value(SimpleContentPartExpression::Text {
                                text: WithExpression::Value(
                                    "You are a career advisor helping a client present a compelling narrative of professional growth. You value candidates who show patterns of increasing responsibility, skill development, and intentional career progression.".to_string(),
                                ),
                            }),
                        ])),
                        name: None,
                    })),
                    WithExpression::Value(MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""Your client is applying for this role:\n\n" + input["job_description"] + "\n\nDraft their application, emphasizing a career trajectory of increasing responsibility and professional growth that naturally leads to this position. The application should convey upward momentum, broadening scope, and a capacity for continuous learning.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    })),
                ]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
            // Task 6: tailoring to the role
            TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
                skip: None,
                map: None,
                messages: WithExpression::Value(vec![WithExpression::Value(
                    MessageExpression::User(UserMessageExpression {
                        content: WithExpression::Value(RichContentExpression::Parts(vec![
                            WithExpression::Value(RichContentPartExpression::Text {
                                text: WithExpression::Expression(Expression::Starlark(
                                    r#""Here is a job posting I want to apply for:\n\n" + input["job_description"] + "\n\nWrite my application, making sure to reference specific aspects of this role and draw direct connections between my background and what the employer is looking for. The application should clearly demonstrate that it was crafted specifically for this opportunity rather than being a generic submission.""#.to_string(),
                                )),
                            }),
                        ])),
                        name: None,
                    }),
                )]),
                tools: None,
                responses: WithExpression::Expression(Expression::Starlark(
                    r#"[[{"type": "text", "text": app}] for app in input["apps"]]"#.to_string(),
                )),
                output: Expression::Starlark(r#"output["scores"]"#.to_string()),
            }),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            r#"len(input["apps"])"#.to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            r#"[{"apps": [app], "job_description": input["job_description"]} for app in input["apps"]]"#.to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            r#"{"apps": [app for sub in input for app in sub["apps"]], "job_description": input[0]["job_description"]}"#.to_string(),
        )),
    };
    test(&f);
}
