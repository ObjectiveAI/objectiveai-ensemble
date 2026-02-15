//! Tests for check_vector_fields validation.

#![cfg(test)]

use indexmap::IndexMap;

use super::check_vector_fields::{
    check_vector_fields, inputs_equal, random_subsets, VectorFieldsValidation,
};
use crate::functions::expression::{
    ArrayInputSchema, Expression, Input, InputSchema, IntegerInputSchema,
    ObjectInputSchema, StringInputSchema, WithExpression,
};

// ── helpers ──────────────────────────────────────────────────────────

fn array_of_strings_schema() -> InputSchema {
    InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(5),
        items: Box::new(InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        })),
    })
}

fn object_with_items_schema() -> InputSchema {
    InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert("items".to_string(), array_of_strings_schema());
            m.insert(
                "label".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["items".to_string(), "label".to_string()]),
    })
}

/// Correct vector fields for an array-of-strings schema.
fn valid_array_fields() -> VectorFieldsValidation {
    VectorFieldsValidation {
        input_schema: array_of_strings_schema(),
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input)".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[[x] for x in input]".to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "[x[0] for x in input]".to_string(),
        )),
    }
}

/// Correct vector fields for an object-with-items schema.
fn valid_object_fields() -> VectorFieldsValidation {
    VectorFieldsValidation {
        input_schema: object_with_items_schema(),
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
    }
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
    let a = Input::Object({
        let mut m = IndexMap::new();
        m.insert("x".to_string(), Input::Integer(1));
        m
    });
    let b = Input::Object({
        let mut m = IndexMap::new();
        m.insert("x".to_string(), Input::Integer(1));
        m
    });
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
    assert!(inputs_equal(
        &Input::Number(3.14),
        &Input::Number(3.14),
    ));
    assert!(!inputs_equal(
        &Input::Number(3.14),
        &Input::Number(2.72),
    ));
}

#[test]
fn test_inputs_equal_booleans() {
    assert!(inputs_equal(&Input::Boolean(true), &Input::Boolean(true)));
    assert!(!inputs_equal(
        &Input::Boolean(true),
        &Input::Boolean(false),
    ));
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
    assert!(!inputs_equal(
        &Input::Integer(1),
        &Input::Number(1.0),
    ));
    assert!(!inputs_equal(
        &Input::Boolean(true),
        &Input::Integer(1),
    ));
}

#[test]
fn test_inputs_equal_nested_objects() {
    let a = Input::Object({
        let mut m = IndexMap::new();
        m.insert(
            "nested".to_string(),
            Input::Object({
                let mut n = IndexMap::new();
                n.insert("val".to_string(), Input::Integer(99));
                n
            }),
        );
        m
    });
    let b = Input::Object({
        let mut m = IndexMap::new();
        m.insert(
            "nested".to_string(),
            Input::Object({
                let mut n = IndexMap::new();
                n.insert("val".to_string(), Input::Integer(99));
                n
            }),
        );
        m
    });
    assert!(inputs_equal(&a, &b));
}

#[test]
fn test_inputs_equal_objects_different_keys() {
    let a = Input::Object({
        let mut m = IndexMap::new();
        m.insert("x".to_string(), Input::Integer(1));
        m
    });
    let b = Input::Object({
        let mut m = IndexMap::new();
        m.insert("y".to_string(), Input::Integer(1));
        m
    });
    assert!(!inputs_equal(&a, &b));
}

// ── check_vector_fields success tests ────────────────────────────────

#[test]
fn test_valid_array_schema() {
    let result = check_vector_fields(valid_array_fields());
    assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
}

#[test]
fn test_valid_object_schema() {
    let result = check_vector_fields(valid_object_fields());
    assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
}

// ── check_vector_fields error tests ──────────────────────────────────

#[test]
fn test_output_length_compilation_error() {
    let fields = VectorFieldsValidation {
        output_length: WithExpression::Expression(Expression::Starlark(
            "undefined_var".to_string(),
        )),
        ..valid_array_fields()
    };
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains("output_length compilation failed"),
        "Unexpected error: {}",
        err,
    );
}

#[test]
fn test_input_split_compilation_error() {
    let fields = VectorFieldsValidation {
        input_split: WithExpression::Expression(Expression::Starlark(
            "undefined_var".to_string(),
        )),
        ..valid_array_fields()
    };
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains("input_split compilation failed"),
        "Unexpected error: {}",
        err,
    );
}

#[test]
fn test_input_split_length_mismatch() {
    // Split always returns 2 elements regardless of input length.
    let fields = VectorFieldsValidation {
        input_split: WithExpression::Expression(Expression::Starlark(
            "[input[0:1], input[1:2]]".to_string(),
        )),
        ..valid_array_fields()
    };
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains("input_split produced")
            && err.contains("but output_length is"),
        "Unexpected error: {}",
        err,
    );
}

#[test]
fn test_split_element_output_length_not_one() {
    // output_length = len(input), but split wraps each element in a
    // 2-element array, so output_length(split_element) = 2 != 1.
    let fields = VectorFieldsValidation {
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
    };
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains("output_length must be 1"),
        "Unexpected error: {}",
        err,
    );
}

#[test]
fn test_merge_does_not_reconstruct_original() {
    // Merge reverses instead of preserving order.
    let fields = VectorFieldsValidation {
        input_merge: WithExpression::Expression(Expression::Starlark(
            "[x[0] for x in reversed(input)]".to_string(),
        )),
        ..valid_array_fields()
    };
    let err = check_vector_fields(fields).unwrap_err();
    // Could be "merged input does not match original" or could fail earlier
    // if reversed() isn't available in starlark. Either way, it should error.
    assert!(err.contains("Input [0]"), "Unexpected error: {}", err);
}

#[test]
fn test_input_merge_compilation_error() {
    let fields = VectorFieldsValidation {
        input_merge: WithExpression::Expression(Expression::Starlark(
            "undefined_var".to_string(),
        )),
        ..valid_array_fields()
    };
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains("input_merge compilation failed"),
        "Unexpected error: {}",
        err,
    );
}

#[test]
fn test_valid_with_integer_array_schema() {
    let schema = InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(5),
        items: Box::new(InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(100),
        })),
    });
    let fields = VectorFieldsValidation {
        input_schema: schema,
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
    let result = check_vector_fields(fields);
    assert!(result.is_ok(), "Expected Ok, got: {:?}", result);
}

#[test]
fn test_output_length_wrong_type_returns_error() {
    // output_length expression returns a string instead of u64.
    let fields = VectorFieldsValidation {
        output_length: WithExpression::Expression(Expression::Starlark(
            "'not_a_number'".to_string(),
        )),
        ..valid_array_fields()
    };
    let err = check_vector_fields(fields).unwrap_err();
    assert!(
        err.contains("output_length compilation failed"),
        "Unexpected error: {}",
        err,
    );
}
