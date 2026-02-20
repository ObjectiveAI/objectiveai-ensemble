//! Tests for check_scalar_fields validation.

#![cfg(test)]

use super::check_scalar_fields::{ScalarFieldsValidation, check_scalar_fields};
use crate::functions::expression::{
    InputSchema, IntegerInputSchema, ObjectInputSchema, StringInputSchema,
};
use crate::util::index_map;

// ── wrappers ─────────────────────────────────────────────────────────

fn test(fields: ScalarFieldsValidation) {
    check_scalar_fields(fields).unwrap();
}

fn test_err(fields: ScalarFieldsValidation, expected: &str) {
    let err = check_scalar_fields(fields).unwrap_err();
    assert!(err.contains(expected), "expected '{expected}' in error, got: {err}");
}

// ── tests ────────────────────────────────────────────────────────────

#[test]
fn rejects_single_permutation_string_enum() {
    test_err(
        ScalarFieldsValidation {
            input_schema: InputSchema::String(StringInputSchema {
                description: None,
                r#enum: Some(vec!["only".to_string()]),
            }),
        },
        "QI01",
    );
}

#[test]
fn valid_string_schema() {
    test(ScalarFieldsValidation {
        input_schema: InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
    });
}

#[test]
fn valid_object_schema() {
    test(ScalarFieldsValidation {
        input_schema: InputSchema::Object(ObjectInputSchema {
            description: None,
            properties: index_map! {
                "name" => InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
                "age" => InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(0),
                    maximum: Some(100),
                })
            },
            required: Some(vec!["name".to_string(), "age".to_string()]),
        }),
    });
}
