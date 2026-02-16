//! Tests for check_branch_vector_function.

#![cfg(test)]

use crate::functions::quality::check_branch_vector_function;

use super::check_function_test_helpers::*;

#[test]
fn wrong_type_scalar() {
    let f = branch_scalar(None, vec![]);
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(err.contains("Expected vector function, got scalar function"));
}

#[test]
fn input_schema_string() {
    let f = branch_vector(
        simple_string_schema(),
        vec![valid_vector_function_task(None)],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(err.contains("must be an array, or an object"));
}

#[test]
fn input_schema_object_no_required_array() {
    let f = branch_vector(
        object_without_required_array_schema(),
        vec![valid_vector_function_task(None)],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("vector.function in a vector function must not have map")
    );
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(err.contains("must not contain vector.completion tasks"));
}

#[test]
fn single_mapped_scalar_task() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_scalar_function_task(Some(0))],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
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
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(err.contains("At most 50%"));
}

// --- Success cases ---

#[test]
fn valid_single_vector_function() {
    let f = branch_vector(
        object_with_required_array_schema(),
        vec![valid_vector_function_task(None)],
    );
    check_branch_vector_function(&f, None).unwrap();
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
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn valid_50_50_split() {
    let f = branch_vector_with_maps(
        object_with_required_array_schema(),
        Some(items_input_maps()),
        vec![
            valid_scalar_function_task(Some(0)),
            valid_vector_function_task(None),
        ],
    );
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn valid_mixed_tasks() {
    let f = branch_vector_with_maps(
        object_with_required_array_schema(),
        Some(items_input_maps()),
        vec![
            valid_scalar_function_task(Some(0)),
            valid_vector_function_task(None),
            valid_vector_function_task(None),
        ],
    );
    check_branch_vector_function(&f, None).unwrap();
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
    check_branch_vector_function(&f, None).unwrap();
}

// --- Full-function input diversity tests (inline RemoteFunction::Vector) ---

use crate::functions::expression::{
    ArrayInputSchema, Expression, InputMaps, InputSchema, IntegerInputSchema,
    ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression, PlaceholderVectorFunctionTaskExpression,
    RemoteFunction, ScalarFunctionTaskExpression, TaskExpression,
    VectorFunctionTaskExpression,
};
use indexmap::IndexMap;

/// Standard input_maps expression: `[input['items']]`.
fn items_input_maps() -> InputMaps {
    InputMaps::Many(vec![
        Expression::Starlark("input['items']".to_string()),
    ])
}

/// Helper: unmapped vector function task with custom input expression.
fn vf_task(input_expr: &str) -> TaskExpression {
    TaskExpression::VectorFunction(VectorFunctionTaskExpression {
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

/// Helper: mapped scalar function task with custom input expression.
fn sf_mapped_task(map_index: u64, input_expr: &str) -> TaskExpression {
    TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
        owner: "test".to_string(),
        repository: "test".to_string(),
        commit: "abc123".to_string(),
        skip: None,
        map: Some(map_index),
        input: WithExpression::Expression(Expression::Starlark(
            input_expr.to_string(),
        )),
        output: Expression::Starlark(
            "[x / sum(output) for x in output]".to_string(),
        ),
    })
}

/// Helper: unmapped placeholder vector function task with custom input expr.
fn pvf_task(
    input_expr: &str,
    child_input_schema: InputSchema,
) -> TaskExpression {
    TaskExpression::PlaceholderVectorFunction(
        PlaceholderVectorFunctionTaskExpression {
            input_schema: child_input_schema.clone(),
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input['items'])".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[{'items': [x]} for x in input['items']]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "{'items': [x['items'][0] for x in input]}".to_string(),
            )),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark(
                input_expr.to_string(),
            )),
            output: Expression::Starlark("output".to_string()),
        },
    )
}

/// Helper: mapped placeholder scalar function task with custom input expr.
fn psf_mapped_task(
    map_index: u64,
    input_expr: &str,
    child_input_schema: InputSchema,
) -> TaskExpression {
    TaskExpression::PlaceholderScalarFunction(
        PlaceholderScalarFunctionTaskExpression {
            input_schema: child_input_schema,
            skip: None,
            map: Some(map_index),
            input: WithExpression::Expression(Expression::Starlark(
                input_expr.to_string(),
            )),
            output: Expression::Starlark(
                "[x / sum(output) for x in output]".to_string(),
            ),
        },
    )
}

/// Two-string-array items + label, with input_maps[0] = input['items'].
fn items_label_schema() -> InputSchema {
    InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "items".to_string(),
                InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
            );
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

/// Simple child schema that accepts a string.
fn child_string_schema() -> InputSchema {
    InputSchema::String(StringInputSchema {
        description: None,
        r#enum: None,
    })
}

/// Child schema: object with items array.
fn child_items_schema() -> InputSchema {
    InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "items".to_string(),
                InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(2),
                    max_items: Some(2),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
            );
            m
        },
        required: Some(vec!["items".to_string()]),
    })
}

fn items_label_branch_vector(tasks: Vec<TaskExpression>) -> RemoteFunction {
    items_label_branch_vector_with_maps(None, tasks)
}

fn items_label_branch_vector_with_maps(
    input_maps: Option<crate::functions::expression::InputMaps>,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: items_label_schema(),
        input_maps,
        tasks,
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

// --- Diversity failures: 3rd task uses fixed input ---

#[test]
fn input_diversity_fail_third_task_fixed_input() {
    // Tasks 0 and 1 pass input through. Task 2 uses a fixed string.
    let f = items_label_branch_vector(vec![
        // Task 0: passes parent input through — OK
        vf_task("input"),
        // Task 1: passes input with label modification — OK
        vf_task("{'items': input['items'], 'label': input['label'] + ' v2'}"),
        // Task 2: FIXED input — ignores parent input
        vf_task("{'items': ['A', 'B'], 'label': 'fixed'}"),
    ]);
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed value"),
        "expected Task [2] fixed value error, got: {err}"
    );
}

#[test]
fn input_diversity_fail_third_task_mapped_fixed() {
    // Tasks 0,1: unmapped vector (OK). Task 2: mapped scalar with FIXED input.
    // 1/4 mapped satisfies 50% rule, but task 2 has fixed input.
    let f = items_label_branch_vector_with_maps(
        Some(items_input_maps()),
        vec![
            vf_task("input"),
            vf_task("{'items': input['items'], 'label': input['label'] + ' v2'}"),
            sf_mapped_task(0, "'constant'"),
            vf_task("{'items': input['items'], 'label': 'alt'}"),
        ],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed value"),
        "expected Task [2] fixed value error, got: {err}"
    );
}

// --- Passing diversity: 5 varied functions, each with 2+ tasks ---

#[test]
fn input_diversity_pass_vector_function_passthrough() {
    // Two vector.function tasks, both pass input through.
    let f = items_label_branch_vector(vec![
        vf_task("input"),
        vf_task("{'items': input['items'], 'label': input['label']}"),
    ]);
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn input_diversity_pass_mixed_mapped_and_unmapped() {
    // One mapped scalar (uses map element) + one unmapped vector (passes input).
    let f = items_label_branch_vector_with_maps(
        Some(items_input_maps()),
        vec![
            sf_mapped_task(0, "map"),
            vf_task("input"),
        ],
    );
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn input_diversity_pass_placeholder_vector_tasks() {
    // Two placeholder.vector.function tasks with different input transforms.
    let f = items_label_branch_vector(vec![
        pvf_task("input", child_items_schema()),
        pvf_task(
            "{'items': [x + ' alt' for x in input['items']]}",
            child_items_schema(),
        ),
    ]);
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn input_diversity_pass_mapped_scalar_with_two_vectors() {
    // One mapped scalar + two unmapped vectors, all derived from input.
    let f = items_label_branch_vector_with_maps(
        Some(items_input_maps()),
        vec![
            sf_mapped_task(0, "map"),
            vf_task("input"),
            vf_task("{'items': input['items'], 'label': input['label'] + ' alt'}"),
        ],
    );
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn input_diversity_fail_child_min_items_3() {
    // Object with "entries" array (3 items) + "tag" string. Mix of task types.
    let parent_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "entries".to_string(),
                InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(3),
                    max_items: Some(3),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
            );
            m.insert(
                "tag".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["entries".to_string(), "tag".to_string()]),
    });
    // Child placeholder schema — requires exactly 3 entries.
    // This will FAIL because merged sub-inputs from the parent can have
    // fewer than 3 entries (e.g., a subset of 2 splits → 2 entries),
    // violating the child's min_items=3 constraint.
    let child_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "entries".to_string(),
                InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(3),
                    max_items: Some(3),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
            );
            m
        },
        required: Some(vec!["entries".to_string()]),
    });
    // Placeholder vector task whose expressions use 'entries' (matching child schema)
    let pvf = TaskExpression::PlaceholderVectorFunction(
        PlaceholderVectorFunctionTaskExpression {
            input_schema: child_schema,
            output_length: WithExpression::Expression(Expression::Starlark(
                "len(input['entries'])".to_string(),
            )),
            input_split: WithExpression::Expression(Expression::Starlark(
                "[{'entries': [x]} for x in input['entries']]".to_string(),
            )),
            input_merge: WithExpression::Expression(Expression::Starlark(
                "{'entries': [x['entries'][0] for x in input]}".to_string(),
            )),
            skip: None,
            map: None,
            input: WithExpression::Expression(Expression::Starlark(
                "{'entries': input['entries']}".to_string(),
            )),
            output: Expression::Starlark("output".to_string()),
        },
    );
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: parent_schema,
        input_maps: None,
        tasks: vec![
            // Unmapped vector function — passes input through
            vf_task("input"),
            // Placeholder vector — passes entries through
            pvf,
        ],
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
    };
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("violates input_schema") && err.contains("min_items"),
        "Expected min_items violation from input_merge, got: {err}"
    );
}

#[test]
fn input_diversity_pass_no_input_maps() {
    // input_maps is None — only unmapped vector tasks allowed.
    // Both tasks pass parent input through; no input_maps needed.
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: items_label_schema(),
        input_maps: None,
        tasks: vec![
            vf_task("input"),
            vf_task("{'items': input['items'], 'label': input['label'] + ' v2'}"),
        ],
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
    check_branch_vector_function(&f, None).unwrap();
}

#[test]
fn input_diversity_fail_with_input_maps_fixed() {
    // input_maps is set, mapped scalar task ignores map element — uses fixed input.
    let f = items_label_branch_vector_with_maps(
        Some(items_input_maps()),
        vec![
            // Task 0: unmapped vector passes input — OK
            vf_task("input"),
            // Task 1: mapped scalar uses FIXED input, ignoring map element
            sf_mapped_task(0, "'always_same'"),
        ],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("Task [1]") && err.contains("fixed value"),
        "expected Task [1] fixed value error, got: {err}"
    );
}

#[test]
fn rejects_no_tasks() {
    let f = branch_vector(object_with_required_array_schema(), vec![]);
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(err.contains("at least one task"));
}

// --- Unused input_maps tests ---

#[test]
fn rejects_unused_input_maps() {
    // input_maps has 1 sub-array but no task has map=0.
    let f = items_label_branch_vector_with_maps(
        Some(items_input_maps()),
        vec![
            vf_task("input"),
            vf_task("{'items': input['items'], 'label': input['label']}"),
        ],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("not referenced by any task's map field"),
        "expected unused input_maps error, got: {err}"
    );
}

#[test]
fn rejects_out_of_bounds_map_index() {
    // input_maps has 1 sub-array but task references map index 1 (out of bounds).
    let f = items_label_branch_vector_with_maps(
        Some(items_input_maps()),
        vec![
            sf_mapped_task(0, "map"),
            sf_mapped_task(1, "map"), // index 1 doesn't exist
            vf_task("input"),
            vf_task("{'items': input['items'], 'label': input['label']}"),
        ],
    );
    let err = check_branch_vector_function(&f, None).unwrap_err();
    assert!(
        err.contains("map index 1") && err.contains("only 1 sub-arrays"),
        "expected out-of-bounds map error, got: {err}"
    );
}
