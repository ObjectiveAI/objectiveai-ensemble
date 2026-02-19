//! Tests for check_branch_scalar_function.

#![cfg(test)]

use crate::functions::expression::{
    ArrayInputSchema, Expression, InputSchema, IntegerInputSchema,
    ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression, RemoteFunction,
    ScalarFunctionTaskExpression, TaskExpression,
};
use crate::functions::quality::check_branch_scalar_function;
use indexmap::IndexMap;

use super::check_function_test_helpers::*;

#[test]
fn wrong_type_vector() {
    let f = branch_vector(object_with_required_array_schema(), vec![]);
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("Expected scalar function, got vector function"));
}

#[test]
fn has_input_maps() {
    let f = branch_scalar(
        Some(crate::functions::expression::InputMaps::One(
            Expression::Starlark("input".to_string()),
        )),
        vec![valid_scalar_function_task(None)],
    );
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("must not have input_maps"));
}

#[test]
fn scalar_function_has_map() {
    let f = branch_scalar(None, vec![valid_scalar_function_task(Some(0))]);
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("branch scalar function tasks must not have map"));
}

#[test]
fn placeholder_scalar_has_map() {
    let f = branch_scalar(None, vec![valid_placeholder_scalar_task(Some(0))]);
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("branch scalar function tasks must not have map"));
}

#[test]
fn contains_vector_function() {
    let f = branch_scalar(None, vec![valid_vector_function_task(None)]);
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("found vector.function"));
}

#[test]
fn contains_placeholder_vector() {
    let f = branch_scalar(
        None,
        vec![valid_placeholder_vector_task(
            None,
            array_of_strings_schema(),
        )],
    );
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("found placeholder.vector.function"));
}

#[test]
fn contains_vector_completion() {
    let f = branch_scalar(None, vec![valid_vc_task()]);
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("must not contain vector.completion tasks"));
}

// --- Success cases ---

#[test]
fn valid_single_scalar_function() {
    let f = branch_scalar(None, vec![valid_scalar_function_task(None)]);
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn valid_single_placeholder_scalar() {
    let f = branch_scalar(None, vec![valid_placeholder_scalar_task(None)]);
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn valid_multiple_tasks() {
    let f = branch_scalar(
        None,
        vec![
            valid_scalar_function_task(None),
            valid_placeholder_scalar_task(None),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn rejects_no_tasks() {
    let f = branch_scalar(None, vec![]);
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(err.contains("at least one task"));
}

// --- Full-function input diversity tests (inline RemoteFunction::Scalar) ---

/// Helper: scalar function task with custom input expression.
fn sf_task(input_expr: &str) -> TaskExpression {
    TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
        owner: "test".to_string(),
        repository: "test".to_string(),
        commit: "abc123".to_string(),
        skip: None,
        map: None,
        input: WithExpression::Expression(Expression::Starlark(
            input_expr.to_string(),
        )),
        output: Expression::Starlark("output".to_string()),
    })
}

/// Helper: placeholder scalar function task with custom input expression.
fn psf_task(input_expr: &str, child_schema: InputSchema) -> TaskExpression {
    TaskExpression::PlaceholderScalarFunction(
        PlaceholderScalarFunctionTaskExpression {
            input_schema: child_schema,
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark(
                input_expr.to_string(),
            )),
            output: Expression::Starlark("output".to_string()),
        },
    )
}

fn inline_branch_scalar(
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

// --- Diversity failures ---

#[test]
fn scalar_diversity_fail_fixed_input() {
    // Two tasks: task 0 passes input through, task 1 uses a fixed string.
    let f = inline_branch_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            sf_task("input"),
            sf_task("'always_the_same'"),
        ],
    );
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [1]") && err.contains("fixed value"),
        "expected Task [1] fixed value error, got: {err}"
    );
}

#[test]
fn scalar_diversity_fail_fixed_integer() {
    // Input is an integer, but both tasks ignore it.
    let f = inline_branch_scalar(
        InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(100),
        }),
        vec![
            sf_task("42"),
            sf_task("99"),
        ],
    );
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [0]") && err.contains("fixed value"),
        "expected Task [0] fixed value error, got: {err}"
    );
}

#[test]
fn scalar_diversity_fail_third_task_fixed_object() {
    // Object input, 3 tasks. Tasks 0 and 1 use input, task 2 is fixed.
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
    let f = inline_branch_scalar(
        schema,
        vec![
            sf_task("input"),
            sf_task("input['name']"),
            sf_task("{'name': 'fixed', 'score': 50}"),
        ],
    );
    let err = check_branch_scalar_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed value"),
        "expected Task [2] fixed value error, got: {err}"
    );
}

// --- Diversity passes ---

#[test]
fn scalar_diversity_pass_string_passthrough() {
    // Simple string input, both tasks pass it through.
    let f = inline_branch_scalar(
        InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        }),
        vec![
            sf_task("input"),
            sf_task("input + ' suffix'"),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn scalar_diversity_pass_integer_derived() {
    // Integer input, tasks derive from it.
    let f = inline_branch_scalar(
        InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(1),
            maximum: Some(1000),
        }),
        vec![
            sf_task("input"),
            sf_task("input + 1"),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn scalar_diversity_pass_object_extract_field() {
    // Object input, each task extracts a different field.
    let schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "title".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m.insert(
                "author".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["title".to_string(), "author".to_string()]),
    });
    let f = inline_branch_scalar(
        schema,
        vec![
            sf_task("input['title']"),
            sf_task("input['author']"),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn scalar_diversity_pass_placeholder_with_transform() {
    // Placeholder scalar tasks that transform the input.
    let parent_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "text".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m.insert(
                "category".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["text".to_string(), "category".to_string()]),
    });
    let child_string = InputSchema::String(StringInputSchema {
        description: None,
        r#enum: None,
    });
    let f = inline_branch_scalar(
        parent_schema,
        vec![
            psf_task("input['text']", child_string.clone()),
            psf_task(
                "input['text'] + ' [' + input['category'] + ']'",
                child_string,
            ),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn scalar_diversity_pass_optional_field_used() {
    // Object with an optional "notes" field. Task extracts it.
    // Even though "notes" is optional, diversity should pass
    // because generated inputs will include variants with it.
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
                "notes".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["name".to_string()]),
    });
    // Task passes the full input — diversity satisfied at root.
    let f = inline_branch_scalar(
        schema,
        vec![
            sf_task("input"),
            sf_task("input['name']"),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}

#[test]
fn scalar_diversity_pass_array_input() {
    // Array input schema — tasks use the array.
    let schema = InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(5),
        items: Box::new(InputSchema::String(StringInputSchema {
            description: None,
            r#enum: None,
        })),
    });
    let f = inline_branch_scalar(
        schema,
        vec![
            sf_task("input"),
            sf_task("input[0]"),
        ],
    );
    check_branch_scalar_function(&f, None).unwrap();
}
