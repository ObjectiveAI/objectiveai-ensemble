//! Tests for check_leaf_vector_function.

#![cfg(test)]

use crate::functions::expression::{Expression, WithExpression};
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
fn rejects_input_maps() {
    use crate::functions::expression::InputMaps;
    let f = RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: fixed_two_strings_schema(),
        input_maps: Some(InputMaps::One(Expression::Starlark(
            "input".to_string(),
        ))),
        tasks: vec![valid_vector_vc_task()],
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
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("must not have input_maps"));
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
        fixed_two_strings_schema(),
        vec![valid_scalar_function_task(None)],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found scalar.function"));
}

#[test]
fn contains_vector_function_task() {
    let f = leaf_vector(
        fixed_two_strings_schema(),
        vec![valid_vector_function_task(None)],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found vector.function"));
}

#[test]
fn contains_placeholder_scalar_task() {
    let f = leaf_vector(
        fixed_two_strings_schema(),
        vec![valid_placeholder_scalar_task(None)],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.scalar.function"));
}

#[test]
fn contains_placeholder_vector_task() {
    let f = leaf_vector(
        fixed_two_strings_schema(),
        vec![valid_placeholder_vector_task(
            None,
            fixed_two_strings_schema(),
        )],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("found placeholder.vector.function"));
}

#[test]
fn vc_task_has_map() {
    let mut task = valid_vector_vc_task();
    if let TaskExpression::VectorCompletion(ref mut vc) = task {
        vc.map = Some(0);
    }
    let f = leaf_vector(fixed_two_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("must not have map"));
}

// Vector functions require responses to be a single expression
#[test]
fn responses_fixed_array() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Value(vec![
                quality_response(),
                quality_response(),
            ]),
            output: vc_vector_output_expr(),
        });
    let f = leaf_vector(fixed_two_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("must be a single expression"));
}

// --- Output expression uniqueness ---

#[test]
fn derived_vector_output_expression_passes() {
    // Properly derives output from raw scores — produces unique values
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': x}] for x in input]".to_string(),
            )),
            output: Expression::Starlark("output['scores']".to_string()),
        });
    let f = leaf_vector(fixed_two_strings_schema(), vec![task]);
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn fixed_vector_output_expression() {
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': x}] for x in input]".to_string(),
            )),
            output: Expression::Starlark("[0.5, 0.5]".to_string()),
        });
    let f = leaf_vector(fixed_two_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("duplicate results"), "expected duplicate results error, got: {err}");
}

#[test]
fn branching_vector_output_two_values() {
    // Only 2 possible outputs — will collide within 100 trials
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': x}] for x in input]".to_string(),
            )),
            output: Expression::Starlark(
                "[0.7, 0.3] if output['scores'][0] > 0.5 else [0.3, 0.7]".to_string(),
            ),
        });
    let f = leaf_vector(fixed_two_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("duplicate results"), "expected duplicate results error, got: {err}");
}

#[test]
fn branching_vector_output_three_values() {
    // Only 3 possible outputs — will collide within 100 trials
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': x}] for x in input]".to_string(),
            )),
            output: Expression::Starlark(
                "[0.6, 0.4] if output['scores'][0] < 0.33 else ([0.5, 0.5] if output['scores'][0] < 0.66 else [0.4, 0.6])"
                    .to_string(),
            ),
        });
    let f = leaf_vector(fixed_two_strings_schema(), vec![task]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("duplicate results"), "expected duplicate results error, got: {err}");
}

// --- Response diversity ---

#[test]
fn responses_fixed_expression_fails_diversity() {
    // Responses are completely fixed — ignores input values entirely
    // Uses object schema where items array has fixed length but varying content
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': 'A'}], [{'type': 'text', 'text': 'B'}]]"
                    .to_string(),
            )),
            output: Expression::Starlark("output['scores']".to_string()),
        });
    let f = leaf_vector_obj(
        fixed_two_items_object_schema(),
        vec![task],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(
        err.contains("fixed pool"),
        "expected fixed pool error, got: {err}"
    );
}

#[test]
fn responses_fixed_pool_expression_fails_diversity() {
    // Responses select from a fixed pool based on label, ignoring array content
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': 'cat'}], [{'type': 'text', 'text': 'dog'}]]"
                    .to_string(),
            )),
            output: Expression::Starlark("output['scores']".to_string()),
        });
    let f = leaf_vector_obj(
        fixed_two_items_object_schema(),
        vec![task],
    );
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(
        err.contains("fixed pool"),
        "expected fixed pool error, got: {err}"
    );
}

#[test]
fn responses_derived_from_input_passes_diversity() {
    // Responses derive from input array content — different for each input
    let task =
        TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
            skip: None,
            map: None,
            messages: WithExpression::Value(vec![quality_user_message()]),
            tools: None,
            responses: WithExpression::Expression(Expression::Starlark(
                "[[{'type': 'text', 'text': x}] for x in input['items']]"
                    .to_string(),
            )),
            output: Expression::Starlark("output['scores']".to_string()),
        });
    let f = leaf_vector_obj(
        fixed_two_items_object_schema(),
        vec![task],
    );
    check_leaf_vector_function(&f).unwrap();
}

// --- Full-function diversity tests (inline RemoteFunction::Vector) ---

use crate::functions::expression::{
    ArrayInputSchema, InputSchema, IntegerInputSchema, ObjectInputSchema,
    StringInputSchema,
};
use crate::functions::RemoteFunction;
use indexmap::IndexMap;

/// Helper: build a VC task expression with the given responses and output Starlark.
fn vc_task(responses: &str, output: &str) -> TaskExpression {
    TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
        skip: None,
        map: None,
        messages: WithExpression::Value(vec![quality_user_message()]),
        tools: None,
        responses: WithExpression::Expression(Expression::Starlark(
            responses.to_string(),
        )),
        output: Expression::Starlark(output.to_string()),
    })
}

// --- Diversity failures: only the 3rd task fails ---

#[test]
fn diversity_fail_third_task_object_schema() {
    // Object with required "candidates" array (fixed len 2) + "category" string.
    // Tasks 0 and 1 derive responses from candidates. Task 2 uses fixed responses.
    let input_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "candidates".to_string(),
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
                "category".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec![
            "candidates".to_string(),
            "category".to_string(),
        ]),
    });
    let f = RemoteFunction::Vector {
        description: "Pick the better candidate".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            // Task 0: derives from input — OK
            vc_task(
                "[[{'type': 'text', 'text': c}] for c in input['candidates']]",
                "output['scores']",
            ),
            // Task 1: derives from input with category prefix — OK
            vc_task(
                "[[{'type': 'text', 'text': input['category'] + ': ' + c}] for c in input['candidates']]",
                "output['scores']",
            ),
            // Task 2: FIXED responses — fails diversity
            vc_task(
                "[[{'type': 'text', 'text': 'Yes'}], [{'type': 'text', 'text': 'No'}]]",
                "output['scores']",
            ),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['candidates'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'candidates': [c], 'category': input['category']} for c in input['candidates']]"
                .to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'candidates': [x['candidates'][0] for x in input], 'category': input[0]['category']}"
                .to_string(),
        )),
    };
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed pool"),
        "expected Task [2] fixed pool error, got: {err}"
    );
}

#[test]
fn diversity_fail_third_task_with_labels() {
    // Object with "entries" (fixed 3 strings) + "label" string.
    // Tasks 0 and 1 derive from entries. Task 2 ignores input.
    let input_schema = InputSchema::Object(ObjectInputSchema {
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
                "label".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec!["entries".to_string(), "label".to_string()]),
    });
    let f = RemoteFunction::Vector {
        description: "Rank entries".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            // Task 0: derives from entries — OK
            vc_task(
                "[[{'type': 'text', 'text': e}] for e in input['entries']]",
                "output['scores']",
            ),
            // Task 1: derives with label prefix — OK
            vc_task(
                "[[{'type': 'text', 'text': input['label'] + ': ' + e}] for e in input['entries']]",
                "output['scores']",
            ),
            // Task 2: FIXED — always same 3 options
            vc_task(
                "[[{'type': 'text', 'text': 'First'}], [{'type': 'text', 'text': 'Second'}], [{'type': 'text', 'text': 'Third'}]]",
                "output['scores']",
            ),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['entries'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'entries': [e], 'label': input['label']} for e in input['entries']]"
                .to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'entries': [x['entries'][0] for x in input], 'label': input[0]['label']}"
                .to_string(),
        )),
    };
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(
        err.contains("Task [2]") && err.contains("fixed pool"),
        "expected Task [2] fixed pool error, got: {err}"
    );
}

// --- Passing diversity: 5 varied functions, each with 2+ tasks ---

#[test]
fn diversity_pass_ranking_with_enum_categories() {
    // Array of strings with enum values — tasks use string content
    let input_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "options".to_string(),
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
                "criterion".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: Some(vec![
                        "quality".to_string(),
                        "speed".to_string(),
                        "cost".to_string(),
                    ]),
                }),
            );
            m
        },
        required: Some(vec![
            "options".to_string(),
            "criterion".to_string(),
        ]),
    });
    let f = RemoteFunction::Vector {
        description: "Compare options by criterion".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            vc_task(
                "[[{'type': 'text', 'text': o}] for o in input['options']]",
                "output['scores']",
            ),
            vc_task(
                "[[{'type': 'text', 'text': input['criterion'] + ': ' + o}] for o in input['options']]",
                "output['scores']",
            ),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['options'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'options': [o], 'criterion': input['criterion']} for o in input['options']]"
                .to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'options': [x['options'][0] for x in input], 'criterion': input[0]['criterion']}"
                .to_string(),
        )),
    };
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn diversity_pass_array_of_integers() {
    // Bare array of integers — responses convert each int to text
    let input_schema = InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(4),
        items: Box::new(InputSchema::Integer(IntegerInputSchema {
            description: None,
            minimum: Some(0),
            maximum: Some(999),
        })),
    });
    let f = RemoteFunction::Vector {
        description: "Rank integers by preference".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            // Task 0: plain integer as text
            vc_task(
                "[[{'type': 'text', 'text': str(n)}] for n in input]",
                "output['scores']",
            ),
            // Task 1: integer with ordinal context
            vc_task(
                "[[{'type': 'text', 'text': 'Value #' + str(i) + ': ' + str(input[i])}] for i in range(len(input))]",
                "output['scores']",
            ),
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
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn diversity_pass_nested_object_with_descriptions() {
    // Object with items array + title + descriptions array (both required).
    // Two required arrays — diversity checked against both.
    // Both arrays fixed at 2 items so they stay in sync for lockstep indexing.
    let input_schema = InputSchema::Object(ObjectInputSchema {
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
                "descriptions".to_string(),
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
                "title".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m
        },
        required: Some(vec![
            "items".to_string(),
            "descriptions".to_string(),
            "title".to_string(),
        ]),
    });
    let f = RemoteFunction::Vector {
        description: "Rank items with descriptions".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            // Task 0: uses items only
            vc_task(
                "[[{'type': 'text', 'text': x}] for x in input['items']]",
                "output['scores']",
            ),
            // Task 1: combines items with descriptions
            vc_task(
                "[[{'type': 'text', 'text': input['items'][i] + ' - ' + input['descriptions'][i]}] for i in range(len(input['items']))]",
                "output['scores']",
            ),
            // Task 2: uses title + items
            vc_task(
                "[[{'type': 'text', 'text': input['title'] + ': ' + x}] for x in input['items']]",
                "output['scores']",
            ),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['items'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'items': [input['items'][i]], 'descriptions': [input['descriptions'][i]], 'title': input['title']} for i in range(len(input['items']))]"
                .to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'items': [x['items'][0] for x in input], 'descriptions': [x['descriptions'][0] for x in input], 'title': input[0]['title']}"
                .to_string(),
        )),
    };
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn diversity_pass_array_of_objects_with_nested_fields() {
    // Array of objects with name + tags (array of strings).
    // Responses use nested tag data.
    let item_schema = InputSchema::Object(ObjectInputSchema {
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
                "tags".to_string(),
                InputSchema::Array(ArrayInputSchema {
                    description: None,
                    min_items: Some(1),
                    max_items: Some(3),
                    items: Box::new(InputSchema::String(StringInputSchema {
                        description: None,
                        r#enum: None,
                    })),
                }),
            );
            m
        },
        required: Some(vec!["name".to_string(), "tags".to_string()]),
    });
    let input_schema = InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(2),
        items: Box::new(item_schema),
    });
    let f = RemoteFunction::Vector {
        description: "Compare tagged items".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            // Task 0: name only
            vc_task(
                "[[{'type': 'text', 'text': x['name']}] for x in input]",
                "output['scores']",
            ),
            // Task 1: name with first tag
            vc_task(
                "[[{'type': 'text', 'text': x['name'] + ' [' + x['tags'][0] + ']'}] for x in input]",
                "output['scores']",
            ),
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
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn diversity_pass_object_with_context_and_choices() {
    // Object schema: context string + choices array + weight integer.
    // Three tasks with different prompt framings, all derived from input.
    let input_schema = InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert(
                "context".to_string(),
                InputSchema::String(StringInputSchema {
                    description: None,
                    r#enum: None,
                }),
            );
            m.insert(
                "choices".to_string(),
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
                "weight".to_string(),
                InputSchema::Integer(IntegerInputSchema {
                    description: None,
                    minimum: Some(1),
                    maximum: Some(10),
                }),
            );
            m
        },
        required: Some(vec![
            "context".to_string(),
            "choices".to_string(),
            "weight".to_string(),
        ]),
    });
    let f = RemoteFunction::Vector {
        description: "Weighted choice selector".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks: vec![
            // Task 0: bare choices
            vc_task(
                "[[{'type': 'text', 'text': c}] for c in input['choices']]",
                "output['scores']",
            ),
            // Task 1: choices with context prepended
            vc_task(
                "[[{'type': 'text', 'text': input['context'] + ' -> ' + c}] for c in input['choices']]",
                "output['scores']",
            ),
            // Task 2: choices with weight annotation
            vc_task(
                "[[{'type': 'text', 'text': c + ' (w=' + str(input['weight']) + ')'}] for c in input['choices']]",
                "output['scores']",
            ),
        ],
        output_length: WithExpression::Expression(Expression::Starlark(
            "len(input['choices'])".to_string(),
        )),
        input_split: WithExpression::Expression(Expression::Starlark(
            "[{'context': input['context'], 'choices': [c], 'weight': input['weight']} for c in input['choices']]"
                .to_string(),
        )),
        input_merge: WithExpression::Expression(Expression::Starlark(
            "{'context': input[0]['context'], 'choices': [x['choices'][0] for x in input], 'weight': input[0]['weight']}"
                .to_string(),
        )),
    };
    check_leaf_vector_function(&f).unwrap();
}

// --- Success cases ---

#[test]
fn valid_array_schema() {
    let f = leaf_vector(fixed_two_strings_schema(), vec![valid_vector_vc_task()]);
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn valid_object_with_required_array() {
    let f = leaf_vector_obj(
        fixed_two_items_object_schema(),
        vec![valid_vector_vc_task_obj()],
    );
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn valid_multiple_tasks() {
    let f = leaf_vector(
        fixed_two_strings_schema(),
        vec![valid_vector_vc_task(), valid_vector_vc_task()],
    );
    check_leaf_vector_function(&f).unwrap();
}

#[test]
fn rejects_no_tasks() {
    let f = leaf_vector(fixed_two_strings_schema(), vec![]);
    let err = check_leaf_vector_function(&f).unwrap_err();
    assert!(err.contains("at least one task"));
}
