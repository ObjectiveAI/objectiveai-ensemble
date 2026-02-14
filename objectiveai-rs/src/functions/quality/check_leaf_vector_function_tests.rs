//! Tests for check_leaf_vector_function.

#![cfg(test)]

use crate::chat::completions::request::RichContentExpression;
use crate::functions::expression::WithExpression;
use crate::functions::quality::check_leaf_vector_function;
use crate::functions::{TaskExpression, VectorCompletionTaskExpression};

use super::check_function_test_helpers::*;

#[test]
fn wrong_type_scalar() {
    let f = leaf_scalar(None, vec![]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("Expected vector function, got scalar function"));
}

#[test]
fn input_schema_string() {
    let f = leaf_vector(simple_string_schema(), vec![]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("must be an array, or an object"));
}

#[test]
fn input_schema_object_no_required_array() {
    let f = leaf_vector(object_without_required_array_schema(), vec![]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("must be an array, or an object"));
}

#[test]
fn contains_scalar_function_task() {
    let f = leaf_vector(
        array_of_strings_schema(),
        vec![valid_scalar_function_task(None)],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found scalar.function"));
}

#[test]
fn contains_vector_function_task() {
    let f = leaf_vector(
        array_of_strings_schema(),
        vec![valid_vector_function_task(None)],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found vector.function"));
}

#[test]
fn contains_placeholder_scalar_task() {
    let f = leaf_vector(
        array_of_strings_schema(),
        vec![valid_placeholder_scalar_task(None)],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.scalar.function"));
}

#[test]
fn contains_placeholder_vector_task() {
    let f = leaf_vector(
        array_of_strings_schema(),
        vec![valid_placeholder_vector_task(
            None,
            array_of_strings_schema(),
        )],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.vector.function"));
}

#[test]
fn vc_task_has_map() {
    let mut task = valid_vc_task();
    if let TaskExpression::VectorCompletion(ref mut vc) = task {
        vc.map = Some(0);
    }
    let f = leaf_vector(array_of_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("must not have map"));
}

// Content checks are shared with leaf_scalar — just verify one triggers
#[test]
fn response_plain_string() {
    let task = TaskExpression::VectorCompletion(
        VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![
                quality_user_message(),
            ]),
            tools: None,
            responses: WithExpression::Value(vec![
                WithExpression::Value(RichContentExpression::Text(
                    "bad".to_string(),
                )),
                quality_response(),
            ]),
            output: dummy_output_expr(),
        },
    );
    let f = leaf_vector(array_of_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("response must be an array of content parts"));
}

// --- Success cases ---

#[test]
fn valid_array_schema() {
    let f = leaf_vector(array_of_strings_schema(), vec![valid_vc_task()]);
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn valid_object_with_required_array() {
    let f = leaf_vector_obj(
        object_with_required_array_schema(),
        vec![valid_vc_task()],
    );
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn valid_multiple_tasks() {
    let f = leaf_vector(
        array_of_strings_schema(),
        vec![valid_vc_task(), valid_vc_task()],
    );
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn valid_no_tasks() {
    let f = leaf_vector(array_of_strings_schema(), vec![]);
    check_leaf_vector_function(&f).unwrap();
}
