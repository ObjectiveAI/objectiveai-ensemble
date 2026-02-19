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

/// VC output expression that extracts the first score (for scalar parent functions).
pub fn vc_scalar_output_expr() -> Expression {
    Expression::Starlark("output['scores'][0]".to_string())
}

/// VC output expression that returns the full scores vector (for vector parent functions).
pub fn vc_vector_output_expr() -> Expression {
    Expression::Starlark("output['scores']".to_string())
}

/// Function task output expression — pass through (output is already a FunctionOutput).
/// For unmapped tasks, output is a scalar or vector. For mapped tasks, output is
/// an array of scalars — use `mapped_function_output_expr` for those.
pub fn function_output_expr() -> Expression {
    Expression::Starlark("output".to_string())
}

/// Output expression for mapped scalar function tasks.
/// The output is an array of scalars; normalize to sum to 1 for valid vector output.
pub fn mapped_function_output_expr() -> Expression {
    Expression::Starlark(
        "[x / sum(output) for x in output]".to_string(),
    )
}

/// Alias for VC scalar output expression (backwards compatible default).
pub fn dummy_output_expr() -> Expression {
    vc_scalar_output_expr()
}

pub fn dummy_input_expr()
-> WithExpression<crate::functions::expression::InputExpression> {
    WithExpression::Expression(Expression::Starlark("input".to_string()))
}

/// Input expression for mapped tasks — uses the current map element.
pub fn mapped_input_expr()
-> WithExpression<crate::functions::expression::InputExpression> {
    WithExpression::Expression(Expression::Starlark("map".to_string()))
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
/// Uses scalar output expression (extracts first score) — for scalar parent functions.
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
        output: vc_scalar_output_expr(),
    })
}

/// A valid vector completion task for vector parent functions.
/// Uses vector output expression (returns full scores vector).
/// Responses must be a single expression for vector functions.
pub fn valid_vector_vc_task() -> TaskExpression {
    TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
        skip: None,
        map: None,
        messages: WithExpression::Value(vec![quality_user_message()]),
        tools: None,
        responses: WithExpression::Expression(Expression::Starlark(
            "[[{'type': 'text', 'text': x}] for x in input]".to_string(),
        )),
        output: vc_vector_output_expr(),
    })
}

/// A valid vector completion task for vector parent functions with object schemas.
/// Responses derive from `input['items']` instead of root `input`.
pub fn valid_vector_vc_task_obj() -> TaskExpression {
    TaskExpression::VectorCompletion(VectorCompletionTaskExpression {
        skip: None,
        map: None,
        messages: WithExpression::Value(vec![quality_user_message()]),
        tools: None,
        responses: WithExpression::Expression(Expression::Starlark(
            "[[{'type': 'text', 'text': x}] for x in input['items']]"
                .to_string(),
        )),
        output: vc_vector_output_expr(),
    })
}

pub fn valid_scalar_function_task(with_map: Option<u64>) -> TaskExpression {
    let output = if with_map.is_some() {
        mapped_function_output_expr()
    } else {
        function_output_expr()
    };
    TaskExpression::ScalarFunction(ScalarFunctionTaskExpression {
        owner: "test".to_string(),
        repository: "test".to_string(),
        commit: "abc123".to_string(),
        skip: None,
        map: with_map,
        input: dummy_input_expr(),
        output,
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
        output: function_output_expr(),
    })
}

pub fn valid_placeholder_scalar_task(with_map: Option<u64>) -> TaskExpression {
    let output = if with_map.is_some() {
        mapped_function_output_expr()
    } else {
        function_output_expr()
    };
    TaskExpression::PlaceholderScalarFunction(
        PlaceholderScalarFunctionTaskExpression {
            input_schema: simple_integer_schema(),
            skip: None,
            map: with_map,
            input: dummy_input_expr(),
            output,
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
            output: function_output_expr(),
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

/// Schema for exactly 2 strings — used by leaf_vector so output_length
/// matches the 2 VC responses.
pub fn fixed_two_strings_schema() -> InputSchema {
    InputSchema::Array(ArrayInputSchema {
        description: None,
        min_items: Some(2),
        max_items: Some(2),
        items: Box::new(simple_string_schema()),
    })
}

/// Schema for an object with exactly 2 items — used by leaf_vector_obj.
pub fn fixed_two_items_object_schema() -> InputSchema {
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
                    items: Box::new(simple_string_schema()),
                }),
            );
            m.insert("label".to_string(), simple_string_schema());
            m
        },
        required: Some(vec!["items".to_string(), "label".to_string()]),
    })
}

pub fn leaf_vector(
    input_schema: InputSchema,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    // output_length = len(input). For tests, pass fixed_two_strings_schema()
    // so output_length = 2, matching 2 VC responses in valid_vector_vc_task().
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
    // output_length = len(input['items']). For tests, pass
    // fixed_two_items_object_schema() so output_length = 2.
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
    branch_vector_with_maps(input_schema, None, tasks)
}

pub fn branch_vector_with_maps(
    input_schema: InputSchema,
    input_maps: Option<crate::functions::expression::InputMaps>,
    tasks: Vec<TaskExpression>,
) -> RemoteFunction {
    RemoteFunction::Vector {
        description: "test".to_string(),
        changelog: None,
        input_schema: input_schema.clone(),
        input_maps,
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
