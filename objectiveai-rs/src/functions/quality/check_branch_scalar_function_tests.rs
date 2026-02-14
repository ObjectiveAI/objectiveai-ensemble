//! Tests for check_branch_scalar_function.

#![cfg(test)]

use crate::functions::expression::Expression;
use crate::functions::quality::check_branch_scalar_function;

use super::check_function_test_helpers::*;

#[test]
fn wrong_type_vector() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![],
    );
    let err = check_branch_scalar_function(&f).unwrap_err();
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
    let err = check_branch_scalar_function(&f).unwrap_err();
    assert!(err.contains("must not have input_maps"));
}

#[test]
fn scalar_function_has_map() {
    let f = branch_scalar(
        None,
        vec![valid_scalar_function_task(Some(0))],
    );
    let err = check_branch_scalar_function(&f).unwrap_err();
    assert!(err.contains("branch scalar function tasks must not have map"));
}

#[test]
fn placeholder_scalar_has_map() {
    let f = branch_scalar(
        None,
        vec![valid_placeholder_scalar_task(Some(0))],
    );
    let err = check_branch_scalar_function(&f).unwrap_err();
    assert!(err.contains("branch scalar function tasks must not have map"));
}

#[test]
fn contains_vector_function() {
    let f = branch_scalar(
        None,
        vec![valid_vector_function_task(None)],
    );
    let err = check_branch_scalar_function(&f).unwrap_err();
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
    let err = check_branch_scalar_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.vector.function"));
}

#[test]
fn contains_vector_completion() {
    let f = branch_scalar(None, vec![valid_vc_task()]);
    let err = check_branch_scalar_function(&f).unwrap_err();
    assert!(err.contains("must not contain vector.completion tasks"));
}

// --- Success cases ---

#[test]
fn valid_single_scalar_function() {
    let f = branch_scalar(
        None,
        vec![valid_scalar_function_task(None)],
    );
    check_branch_scalar_function(&f).unwrap();
}

#[test]
fn valid_single_placeholder_scalar() {
    let f = branch_scalar(
        None,
        vec![valid_placeholder_scalar_task(None)],
    );
    check_branch_scalar_function(&f).unwrap();
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
    check_branch_scalar_function(&f).unwrap();
}

#[test]
fn valid_no_tasks() {
    let f = branch_scalar(None, vec![]);
    check_branch_scalar_function(&f).unwrap();
}
