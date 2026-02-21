//! Tests for check_vector_fields validation.

#![cfg(test)]

use super::check_vector_fields::{
    VectorFieldsValidation, check_vector_fields, inputs_equal, random_subsets,
};
use crate::functions::expression::{
    AnyOfInputSchema, ArrayInputSchema, Expression, Input, InputSchema, IntegerInputSchema,
    ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::util::index_map;

// ── wrappers ─────────────────────────────────────────────────────────

fn test(fields: VectorFieldsValidation) {
    check_vector_fields(fields).unwrap();
}

fn test_err(fields: VectorFieldsValidation, expected: &str) {
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains(expected),
        "expected '{expected}' in error, got: {err}"
    );
}

// ── random_subsets tests ─────────────────────────────────────────────

#[test]
fn test_random_subsets_valid() {
    let subsets = random_subsets(5, 5);
    assert!(!subsets.is_empty());
    for subset in &subsets {
        assert!(subset.len() >= 2);
        for (i, &idx) in subset.iter().enumerate() {
            assert!(idx < 5);
            if i > 0 {
                assert!(idx > subset[i - 1], "Subsets should be sorted");
            }
        }
    }
}

#[test]
fn test_random_subsets_length_zero() {
    let subsets = random_subsets(0, 10);
    assert!(subsets.is_empty());
}

#[test]
fn test_random_subsets_length_one() {
    let subsets = random_subsets(1, 10);
    assert!(subsets.is_empty());
}

#[test]
fn test_random_subsets_length_two() {
    let subsets = random_subsets(2, 10);
    for subset in &subsets {
        assert_eq!(subset.len(), 2);
        assert_eq!(subset, &vec![0, 1]);
    }
}

// ── inputs_equal tests ───────────────────────────────────────────────

#[test]
fn test_inputs_equal_objects() {
    let a = Input::Object(index_map! { "x" => Input::Integer(1) });
    let b = Input::Object(index_map! { "x" => Input::Integer(1) });
    assert!(inputs_equal(&a, &b));
}

#[test]
fn test_inputs_equal_strings() {
    assert!(inputs_equal(
        &Input::String("hello".to_string()),
        &Input::String("hello".to_string()),
    ));
    assert!(!inputs_equal(
        &Input::String("hello".to_string()),
        &Input::String("world".to_string()),
    ));
}

#[test]
fn test_inputs_equal_integers() {
    assert!(inputs_equal(&Input::Integer(42), &Input::Integer(42)));
    assert!(!inputs_equal(&Input::Integer(42), &Input::Integer(43)));
}

#[test]
fn test_inputs_equal_numbers() {
    assert!(inputs_equal(&Input::Number(3.14), &Input::Number(3.14),));
    assert!(!inputs_equal(&Input::Number(3.14), &Input::Number(2.72),));
}

#[test]
fn test_inputs_equal_booleans() {
    assert!(inputs_equal(&Input::Boolean(true), &Input::Boolean(true)));
    assert!(!inputs_equal(&Input::Boolean(true), &Input::Boolean(false),));
}

#[test]
fn test_inputs_equal_arrays() {
    let a = Input::Array(vec![Input::Integer(1), Input::Integer(2)]);
    let b = Input::Array(vec![Input::Integer(1), Input::Integer(2)]);
    assert!(inputs_equal(&a, &b));

    let c = Input::Array(vec![Input::Integer(1), Input::Integer(3)]);
    assert!(!inputs_equal(&a, &c));

    let d = Input::Array(vec![Input::Integer(1)]);
    assert!(!inputs_equal(&a, &d));
}

#[test]
fn test_inputs_equal_different_types() {
    assert!(!inputs_equal(
        &Input::String("1".to_string()),
        &Input::Integer(1),
    ));
    assert!(!inputs_equal(&Input::Integer(1), &Input::Number(1.0),));
    assert!(!inputs_equal(&Input::Boolean(true), &Input::Integer(1),));
}

#[test]
fn test_inputs_equal_nested_objects() {
    let a = Input::Object(index_map! {
        "nested" => Input::Object(index_map! {
            "val" => Input::Integer(99)
        })
    });
    let b = Input::Object(index_map! {
        "nested" => Input::Object(index_map! {
            "val" => Input::Integer(99)
        })
    });
    assert!(inputs_equal(&a, &b));
}

#[test]
fn test_inputs_equal_objects_different_keys() {
    let a = Input::Object(index_map! { "x" => Input::Integer(1) });
    let b = Input::Object(index_map! { "y" => Input::Integer(1) });
    assert!(!inputs_equal(&a, &b));
}

// ── check_vector_fields success tests ────────────────────────────────

#[test]
fn test_valid_array_schema() {
    test(VectorFieldsValidation {
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(5),
            items: Box::new(InputSchema::String(StringInputSchema {
                description: None,
                r#enum: None,
            })),
        }),
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input)".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[[x] for x in input]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "[x[0] for x in input]".to_string(),
        )),
    });
}

#[test]
fn test_valid_object_schema() {
    test(VectorFieldsValidation {
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "items" => InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(5),
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
    });
}

// ── check_vector_fields error tests ──────────────────────────────────

#[test]
fn test_output_length_compilation_error() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "undefined_var".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF01",
    );
}

#[test]
fn test_input_split_compilation_error() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "undefined_var".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF04",
    );
}

#[test]
fn test_input_split_length_mismatch() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[input[0:1], input[1:2]]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF06",
    );
}

#[test]
fn test_split_element_output_length_not_one() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(4),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x, x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF09",
    );
}

#[test]
fn test_merge_does_not_reconstruct_original() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in reversed(input)]".to_string(),
            )),
        },
        "VF12",
    );
}

#[test]
fn test_input_merge_compilation_error() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "undefined_var".to_string(),
            )),
        },
        "VF10",
    );
}

#[test]
fn test_valid_with_integer_array_schema() {
    test(VectorFieldsValidation {
        input_schema: InputSchema::Array(ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(5),
            items: Box::new(InputSchema::Integer(IntegerInputSchema {
                description: None,
                minimum: Some(1),
                maximum: Some(100),
            })),
        }),
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input)".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[[x] for x in input]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "[x[0] for x in input]".to_string(),
        )),
    });
}

#[test]
fn test_merged_subset_violates_min_items() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Object(ObjectInputSchema {
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
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input['entries'])".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[{'entries': [e], 'tag': input['tag']} for e in input['entries']]"
                    .to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "{'entries': [x['entries'][0] for x in input], 'tag': input[0]['tag']}"
                    .to_string(),
            )),
        },
        "VF21",
    );
}

#[test]
fn test_output_length_wrong_type_returns_error() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "'not_a_number'".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF01",
    );
}

#[test]
fn rejects_single_permutation_string_enum() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(2),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: Some(vec!["only".to_string()]),
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "QI01",
    );
}

#[test]
fn rejects_single_permutation_integer() {
    test_err(
        VectorFieldsValidation {
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
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "QI01",
    );
}

#[test]
fn job_application_ranker_1() {
    test_err(VectorFieldsValidation {
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
        output_length: WithExpression::Expression(Expression::Starlark(
            r#"len(input["apps"])"#.to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            r#"[{"apps": [app], "job_description": input["job_description"]} for app in input["apps"]]"#.to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            r#"{"apps": [app for sub in input for app in sub["apps"]], "job_description": input[0]["job_description"]}"#.to_string(),
        )),
    }, "VF03")
}

#[test]
fn output_length_fails_for_split() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(5),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input) if len(input) > 5 else 1/0".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF07",
    );
}

#[test]
fn input_merge_fails_for_subset() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(3),
                max_items: Some(3),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input] if len(input) == 3 else 1/0".to_string(),
            )),
        },
        "VF16",
    );
}

#[test]
fn output_length_fails_for_merged_subset() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(3),
                max_items: Some(3),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input) if len(input) == 3 or len(input) == 1 else 1/0".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF18",
    );
}

#[test]
fn output_length_wrong_for_merged_subset() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(3),
                max_items: Some(3),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input) if len(input) == 3 or len(input) == 1 else 999".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF20",
    );
}

#[test]
fn no_example_inputs() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::AnyOf(AnyOfInputSchema { any_of: vec![] }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF22",
    );
}

#[test]
fn array_violates_min_items() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(3),
                max_items: Some(3),
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input]".to_string(),
            )),
        },
        "VF23",
    );
}

#[test]
fn array_violates_max_items() {
    test_err(
        VectorFieldsValidation {
            input_schema: InputSchema::Array(ArrayInputSchema {
                description: None,
                min_items: Some(2),
                max_items: Some(3), // subset can never be > 3 if original is 3, wait.
                items: Box::new(InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                })),
            }),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input)".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[[x] for x in input]".to_string(),
            )),
            // If we double the items in the merge!
            input_merge: WithExpression::Expression(Expression::Starlark(
                "[x[0] for x in input] if len(input) == 3 else [x[0] for x in input] + [x[0] for x in input]".to_string(),
            )),
        },
        "VF24",
    );
}
