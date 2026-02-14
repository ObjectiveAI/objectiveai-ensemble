//! Tests for check_branch_vector_function.

#![cfg(test)]

use crate::functions::quality::check_branch_vector_function;

use super::check_function_test_helpers::*;

#[test]
fn wrong_type_scalar() {
    let f = branch_scalar(None, vec![]);
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("Expected vector function, got scalar function"));
}

#[test]
fn input_schema_string() {
    let f = branch_vector(
        simple_string_schema(),
        vec![valid_vector_function_task(None)],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("must be an array, or an object"));
}

#[test]
fn input_schema_object_no_required_array() {
    let f = branch_vector(
        object_without_required_array_schema(),
        vec![valid_vector_function_task(None)],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("must be an array, or an object"));
}

#[test]
fn scalar_function_without_map() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![
            valid_scalar_function_task(None), // missing map
            valid_vector_function_task(None),
        ],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("scalar.function in a vector function must have map"));
}

#[test]
fn placeholder_scalar_without_map() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![
            valid_placeholder_scalar_task(None), // missing map
            valid_vector_function_task(None),
        ],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains(
        "placeholder.scalar.function in a vector function must have map"
    ));
}

#[test]
fn vector_function_with_map() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_vector_function_task(Some(0))],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("vector.function in a vector function must not have map"));
}

#[test]
fn placeholder_vector_with_map() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_placeholder_vector_task(
            Some(0),
            object_with_required_array_schema(),
        )],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains(
        "placeholder.vector.function in a vector function must not have map"
    ));
}

#[test]
fn contains_vector_completion() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_vc_task()],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("must not contain vector.completion tasks"));
}

#[test]
fn single_mapped_scalar_task() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_scalar_function_task(Some(0))],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("single task must use an unmapped vector-like task"));
}

#[test]
fn over_50_percent_mapped_scalar() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![
            valid_scalar_function_task(Some(0)),
            valid_scalar_function_task(Some(0)),
            valid_vector_function_task(None),
        ],
    );
    let err = check_branch_vector_function(&f).unwrap_err();
    assert!(err.contains("At most 50%"));
}

// --- Success cases ---

#[test]
fn valid_single_vector_function() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_vector_function_task(None)],
    );
    check_branch_vector_function(&f).unwrap();
}

#[test]
fn valid_single_placeholder_vector() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_placeholder_vector_task(
            None,
            object_with_required_array_schema(),
        )],
    );
    check_branch_vector_function(&f).unwrap();
}

#[test]
fn valid_50_50_split() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![
            valid_scalar_function_task(Some(0)),
            valid_vector_function_task(None),
        ],
    );
    check_branch_vector_function(&f).unwrap();
}

#[test]
fn valid_mixed_tasks() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![
            valid_scalar_function_task(Some(0)),
            valid_vector_function_task(None),
            valid_vector_function_task(None),
        ],
    );
    check_branch_vector_function(&f).unwrap();
}

#[test]
fn valid_all_unmapped_vector() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![
            valid_vector_function_task(None),
            valid_vector_function_task(None),
        ],
    );
    check_branch_vector_function(&f).unwrap();
}

#[test]
fn valid_no_tasks() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![],
    );
    check_branch_vector_function(&f).unwrap();
}
