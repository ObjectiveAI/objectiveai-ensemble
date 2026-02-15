//! Shared test helpers for quality check tests.

#![cfg(test)]

use indexmap::IndexMap;

use crate::chat::completions::request::{
    RichContentExpression, RichContentPartExpression, UserMessageExpression,
};
use crate::functions::expression::{
    ArrayInputSchema, Expression, InputSchema, IntegerInputSchema,
    ObjectInputSchema, StringInputSchema, WithExpression,
};
use crate::functions::{
    PlaceholderScalarFunctionTaskExpression,
    PlaceholderVectorFunctionTaskExpression, RemoteFunction,
    ScalarFunctionTaskExpression, TaskExpression,
    VectorCompletionTaskExpression, VectorFunctionTaskExpression,
};

pub fn dummy_output_expr() -> Expression {
    Expression::Starlark("output['scores'][0]".to_string())
}

pub fn dummy_input_expr()
-> WithExpression<crate::functions::expression::InputExpression> {
    WithExpression::Expression(Expression::Starlark("input".to_string()))
}

pub fn simple_string_schema() -> InputSchema {
    InputSchema::String(StringInputSchema {
        description: None,
        r#enum: None,
    })
}

pub fn simple_integer_schema() -> InputSchema {
    InputSchema::Integer(IntegerInputSchema {
        description: None,
        minimum: Some(1),
        maximum: Some(10),
    })
}

pub fn array_of_strings_schema() -> InputSchema {
    InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(10),
        items: Box::new(simple_string_schema()),
    })
}

pub fn object_with_required_array_schema() -> InputSchema {
    InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert("items".to_string(), array_of_strings_schema());
            m.insert("label".to_string(), simple_string_schema());
            m
        },
        required: Some(vec!["items".to_string(), "label".to_string()]),
    })
}

pub fn object_without_required_array_schema() -> InputSchema {
    InputSchema::Object(ObjectInputSchema {
        description: None,
        properties: {
            let mut m = IndexMap::new();
            m.insert("name".to_string(), simple_string_schema());
            m
        },
        required: Some(vec!["name".to_string()]),
    })
}

/// A valid quality message: user with content parts, not string.
pub fn quality_user_message()
-> WithExpression<crate::chat::completions::request::MessageExpression> {
    WithExpression::Value(
        crate::chat::completions::request::MessageExpression::User(
            UserMessageExpression {
                content: WithExpression::Value(RichContentExpression::Parts(
                    vec![WithExpression::Value(
                        RichContentPartExpression::Text {
                            text: WithExpression::Value("Hello".to_string()),
                        },
                    )],
                )),
                name: None,
            },
        ),
    )
}

/// A valid quality response: content parts, not string.
pub fn quality_response() -> WithExpression<RichContentExpression> {
    WithExpression::Value(RichContentExpression::Parts(vec![
        WithExpression::Value(RichContentPartExpression::Text {
            text: WithExpression::Value("Option A".to_string()),
        }),
    ]))
}

/// A valid vector completion task expression with quality content.
pub fn valid_vc_task() -> TaskExpression {
    TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
        skip: None,
        map: None,
        messages: WithExpression::Value(vec![quality_user_message()]),
        tools: None,
        responses: WithExpression::Value(vec![
            quality_response(),
            quality_response(),
        ]),
        output: dummy_output_expr(),
    })
}

pub fn valid_scalar_function_task(with_map: Option<u64>) -> TaskExpression {
    TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
        owner: "test".to_string(),
        repository: "test".to_string(),
        commit: "abc123".to_string(),
        skip: None,
        map: with_map,
        input: dummy_input_expr(),
        output: dummy_output_expr(),
    })
}

pub fn valid_vector_function_task(with_map: Option<u64>) -> TaskExpression {
    TaskExpression::VectorFunction(VectorFunctionTaskExpression {
        owner: "test".to_string(),
        repository: "test".to_string(),
        commit: "abc123".to_string(),
        skip: None,
        map: with_map,
        input: dummy_input_expr(),
        output: dummy_output_expr(),
    })
}

pub fn valid_placeholder_scalar_task(with_map: Option<u64>) -> TaskExpression {
    TaskExpression::PlaceholderScalarFunction(
        PlaceholderScalarFunctionTaskExpression {
            input_schema: simple_integer_schema(),
            skip: None,
            map: with_map,
            input: dummy_input_expr(),
            output: dummy_output_expr(),
        },
    )
}

pub fn valid_placeholder_vector_task(
    with_map: Option<u64>,
    input_schema: InputSchema,
) -> TaskExpression {
    TaskExpression::PlaceholderVectorFunction(
        PlaceholderVectorFunctionTaskExpression {
            input_schema,
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
            map: with_map,
            input: dummy_input_expr(),
            output: dummy_output_expr(),
        },
    )
}

pub fn leaf_scalar(
    input_maps: Option<crate::functions::expression::InputMaps>,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: simple_string_schema(),
        input_maps,
        tasks,
    }
}

pub fn leaf_vector(
    input_schema: InputSchema,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    // For array-of-strings schema: each element is a sub-input (wrapped in
    // a 1-element array), output_length = len(input), split produces
    // 1-element arrays, merge concatenates them back.
    RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks,
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

pub fn leaf_vector_obj(
    input_schema: InputSchema,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks,
        output_length: WithExpression::Expression(
            Expression::Starlark("len(input['items'])".to_string()),
        ),
        input_split: WithExpression::Expression(
            Expression::Starlark(
                "[{'items': [x], 'label': input['label']} for x in input['items']]"
                    .to_string(),
            ),
        ),
        input_merge: WithExpression::Expression(
            Expression::Starlark(
                "{'items': [x['items'][0] for x in input], 'label': input[0]['label']}"
                    .to_string(),
            ),
        ),
    }
}

pub fn branch_scalar(
    input_maps: Option<crate::functions::expression::InputMaps>,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Scalar {
        description: "test".to_string(),
        changelog: None,
        input_schema: simple_integer_schema(),
        input_maps,
        tasks,
    }
}

pub fn branch_vector(
    input_schema: InputSchema,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps: None,
        tasks,
        output_length: WithExpression::Expression(
            Expression::Starlark("len(input['items'])".to_string()),
        ),
        input_split: WithExpression::Expression(
            Expression::Starlark(
                "[{'items': [x], 'label': input['label']} for x in input['items']]"
                    .to_string(),
            ),
        ),
        input_merge: WithExpression::Expression(
            Expression::Starlark(
                "{'items': [x['items'][0] for x in input], 'label': input[0]['label']}"
                    .to_string(),
            ),
        ),
    }
}
