//! Task types for Function definitions.
//!
//! Tasks are the building blocks of Functions. Each task either calls another
//! Function or runs a Vector Completion. Tasks can be conditionally skipped
//! or mapped over arrays of inputs.
//!
//! # Output Expressions
//!
//! Each task has an `output` expression that transforms its raw result into a
//! [`FunctionOutput`](super::expression::FunctionOutput). The expression receives
//! an `output` parameter that is one of four variants:
//!
//! - `Function(FunctionOutput)` - for non-mapped function tasks
//! - `MapFunction(Vec<FunctionOutput>)` - for mapped function tasks
//! - `VectorCompletion(VectorCompletionOutput)` - for non-mapped vector completion tasks
//! - `MapVectorCompletion(Vec<VectorCompletionOutput>)` - for mapped vector completion tasks
//!
//! The expression must return a `FunctionOutput` valid for the parent function's type:
//! - **Scalar functions**: must return `Scalar(value)` where value is in [0, 1]
//! - **Vector functions**: must return `Vector(values)` where values sum to ~1 and match the expected length
//!
//! # Output Aggregation
//!
//! The function's final output is computed as a **weighted average** of all task outputs
//! using profile weights. If a function has only one task, that task's output becomes
//! the function's output directly (with weight 1.0).

use crate::chat;
use serde::{Deserialize, Serialize};

/// A task definition with expressions (pre-compilation).
///
/// Task expressions contain dynamic fields (JMESPath or Starlark) that are
/// resolved against input data during compilation. Use [`compile`](Self::compile)
/// to produce a concrete [`Task`].
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum TaskExpression {
    #[serde(rename = "scalar.function")]
    ScalarFunction(ScalarFunctionTaskExpression),
    #[serde(rename = "vector.function")]
    VectorFunction(VectorFunctionTaskExpression),
    #[serde(rename = "vector.completion")]
    VectorCompletion(VectorCompletionTaskExpression),
    #[serde(rename = "placeholder.scalar.function")]
    PlaceholderScalarFunction(PlaceholderScalarFunctionTaskExpression),
    #[serde(rename = "placeholder.vector.function")]
    PlaceholderVectorFunction(PlaceholderVectorFunctionTaskExpression),
}

impl TaskExpression {
    /// Takes and returns the skip expression, if present.
    pub fn take_skip(&mut self) -> Option<super::expression::Expression> {
        match self {
            TaskExpression::ScalarFunction(task) => task.skip.take(),
            TaskExpression::VectorFunction(task) => task.skip.take(),
            TaskExpression::VectorCompletion(task) => task.skip.take(),
            TaskExpression::PlaceholderScalarFunction(task) => task.skip.take(),
            TaskExpression::PlaceholderVectorFunction(task) => task.skip.take(),
        }
    }

    /// Returns the map index, if this is a mapped task.
    pub fn input_map(&self) -> Option<u64> {
        match self {
            TaskExpression::ScalarFunction(task) => task.map,
            TaskExpression::VectorFunction(task) => task.map,
            TaskExpression::VectorCompletion(task) => task.map,
            TaskExpression::PlaceholderScalarFunction(task) => task.map,
            TaskExpression::PlaceholderVectorFunction(task) => task.map,
        }
    }

    /// Compiles the expression into a concrete [`Task`].
    pub fn compile(
        self,
        params: &super::expression::Params,
    ) -> Result<Task, super::expression::ExpressionError> {
        match self {
            TaskExpression::ScalarFunction(task) => {
                task.compile(params).map(Task::ScalarFunction)
            }
            TaskExpression::VectorFunction(task) => {
                task.compile(params).map(Task::VectorFunction)
            }
            TaskExpression::VectorCompletion(task) => {
                task.compile(params).map(Task::VectorCompletion)
            }
            TaskExpression::PlaceholderScalarFunction(task) => {
                task.compile(params).map(Task::PlaceholderScalarFunction)
            }
            TaskExpression::PlaceholderVectorFunction(task) => {
                task.compile(params).map(Task::PlaceholderVectorFunction)
            }
        }
    }
}

/// A compiled task ready for execution.
///
/// Produced by compiling a [`TaskExpression`] against input data. All
/// expressions have been resolved to concrete values.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Task {
    /// Calls a scalar function (produces a single score).
    #[serde(rename = "scalar.function")]
    ScalarFunction(ScalarFunctionTask),
    /// Calls a vector function (produces a vector of scores).
    #[serde(rename = "vector.function")]
    VectorFunction(VectorFunctionTask),
    /// Runs a vector completion.
    #[serde(rename = "vector.completion")]
    VectorCompletion(VectorCompletionTask),
    /// Placeholder scalar function (always outputs 0.5).
    #[serde(rename = "placeholder.scalar.function")]
    PlaceholderScalarFunction(PlaceholderScalarFunctionTask),
    /// Placeholder vector function (always outputs equalized vector).
    #[serde(rename = "placeholder.vector.function")]
    PlaceholderVectorFunction(PlaceholderVectorFunctionTask),
}

impl Task {
    pub fn compile_output(
        &self,
        input: &super::expression::Input,
        raw_output: super::expression::TaskOutput,
    ) -> Result<
        super::expression::FunctionOutput,
        super::expression::ExpressionError,
    > {
        match self {
            Task::ScalarFunction(task) => {
                task.compile_output(input, raw_output)
            }
            Task::VectorFunction(task) => {
                task.compile_output(input, raw_output)
            }
            Task::VectorCompletion(task) => {
                task.compile_output(input, raw_output)
            }
            Task::PlaceholderScalarFunction(task) => {
                task.compile_output(input, raw_output)
            }
            Task::PlaceholderVectorFunction(task) => {
                task.compile_output(input, raw_output)
            }
        }
    }
}

/// Expression for a task that calls a scalar function (pre-compilation).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScalarFunctionTaskExpression {
    /// GitHub repository owner.
    pub owner: String,
    /// GitHub repository name.
    pub repository: String,
    /// Git commit SHA for the function version.
    pub commit: String,

    /// If this expression evaluates to true, skip the task. Receives: `input`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip: Option<super::expression::Expression>,

    /// Index into `input_maps` for mapped execution. If set, this task is
    /// expanded into multiple instances.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map: Option<u64>,

    /// Expression for the input to pass to the function.
    /// Receives: `input`, `map` (if mapped).
    pub input:
        super::expression::WithExpression<super::expression::InputExpression>,

    /// Expression to transform the task result into a valid function output.
    ///
    /// Receives `output` which is one of 4 variants depending on task type:
    /// - `Function(FunctionOutput)` - for non-mapped function tasks
    /// - `MapFunction(Vec<FunctionOutput>)` - for mapped function tasks
    /// - `VectorCompletion(VectorCompletionOutput)` - for non-mapped vector completion tasks
    /// - `MapVectorCompletion(Vec<VectorCompletionOutput>)` - for mapped vector completion tasks
    ///
    /// The expression must return a `FunctionOutput` that is valid for the parent function's type:
    /// - For scalar functions: must return `Scalar(value)` where value is in [0, 1]
    /// - For vector functions: must return `Vector(values)` where values sum to ~1 and match the expected length
    ///
    /// The function's final output is computed as a weighted average of all task outputs using
    /// profile weights. If a function has only one task, that task's output becomes the function's
    /// output directly.
    pub output: super::expression::Expression,

}

impl ScalarFunctionTaskExpression {
    /// Compiles the expression into a concrete [`ScalarFunctionTask`].
    pub fn compile(
        self,
        params: &super::expression::Params,
    ) -> Result<ScalarFunctionTask, super::expression::ExpressionError> {
        let input = self.input.compile_one(params)?.compile(params)?;
        Ok(ScalarFunctionTask {
            owner: self.owner,
            repository: self.repository,
            commit: self.commit,
            input,
            output: self.output,
        })
    }
}

/// A compiled scalar function task ready for execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScalarFunctionTask {
    /// GitHub repository owner.
    pub owner: String,
    /// GitHub repository name.
    pub repository: String,
    /// Git commit SHA for the function version.
    pub commit: String,
    /// The resolved input to pass to the function.
    pub input: super::expression::Input,
    /// Expression to transform the task result into a valid function output.
    ///
    /// Receives `output` as `Function(FunctionOutput)` containing the nested function's result.
    /// Must return a `FunctionOutput` valid for the parent function's type (scalar or vector).
    /// See [`ScalarFunctionTaskExpression::output`] for full documentation.
    pub output: super::expression::Expression,
}

impl ScalarFunctionTask {
    pub fn compile_output(
        &self,
        input: &super::expression::Input,
        raw_output: super::expression::TaskOutput,
    ) -> Result<
        super::expression::FunctionOutput,
        super::expression::ExpressionError,
    > {
        let params =
            super::expression::Params::Ref(super::expression::ParamsRef {
                input,
                output: Some(raw_output),
                map: None,
            });
        let compiled_output = self.output.compile_one(&params)?;
        Ok(compiled_output)
    }
}

/// Expression for a task that calls a vector function (pre-compilation).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorFunctionTaskExpression {
    /// GitHub repository owner.
    pub owner: String,
    /// GitHub repository name.
    pub repository: String,
    /// Git commit SHA for the function version.
    pub commit: String,

    /// If this expression evaluates to true, skip the task. Receives: `input`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip: Option<super::expression::Expression>,

    /// Index into `input_maps` for mapped execution. If set, this task is
    /// expanded into multiple instances.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map: Option<u64>,

    /// Expression for the input to pass to the function.
    /// Receives: `input`, `map` (if mapped).
    pub input:
        super::expression::WithExpression<super::expression::InputExpression>,

    /// Expression to transform the task result into a valid function output.
    ///
    /// Receives `output` which is one of 4 variants depending on task type:
    /// - `Function(FunctionOutput)` - for non-mapped function tasks
    /// - `MapFunction(Vec<FunctionOutput>)` - for mapped function tasks
    /// - `VectorCompletion(VectorCompletionOutput)` - for non-mapped vector completion tasks
    /// - `MapVectorCompletion(Vec<VectorCompletionOutput>)` - for mapped vector completion tasks
    ///
    /// The expression must return a `FunctionOutput` that is valid for the parent function's type:
    /// - For scalar functions: must return `Scalar(value)` where value is in [0, 1]
    /// - For vector functions: must return `Vector(values)` where values sum to ~1 and match the expected length
    ///
    /// The function's final output is computed as a weighted average of all task outputs using
    /// profile weights. If a function has only one task, that task's output becomes the function's
    /// output directly.
    pub output: super::expression::Expression,

}

impl VectorFunctionTaskExpression {
    /// Compiles the expression into a concrete [`VectorFunctionTask`].
    pub fn compile(
        self,
        params: &super::expression::Params,
    ) -> Result<VectorFunctionTask, super::expression::ExpressionError> {
        let input = self.input.compile_one(params)?.compile(params)?;
        Ok(VectorFunctionTask {
            owner: self.owner,
            repository: self.repository,
            commit: self.commit,
            input,
            output: self.output,
        })
    }
}

/// A compiled vector function task ready for execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorFunctionTask {
    /// GitHub repository owner.
    pub owner: String,
    /// GitHub repository name.
    pub repository: String,
    /// Git commit SHA for the function version.
    pub commit: String,
    /// The resolved input to pass to the function.
    pub input: super::expression::Input,
    /// Expression to transform the task result into a valid function output.
    ///
    /// Receives `output` as `Function(FunctionOutput)` containing the nested function's result.
    /// Must return a `FunctionOutput` valid for the parent function's type (scalar or vector).
    /// See [`VectorFunctionTaskExpression::output`] for full documentation.
    pub output: super::expression::Expression,
}

impl VectorFunctionTask {
    pub fn compile_output(
        &self,
        input: &super::expression::Input,
        raw_output: super::expression::TaskOutput,
    ) -> Result<
        super::expression::FunctionOutput,
        super::expression::ExpressionError,
    > {
        let params =
            super::expression::Params::Ref(super::expression::ParamsRef {
                input,
                output: Some(raw_output),
                map: None,
            });
        let compiled_output = self.output.compile_one(&params)?;
        Ok(compiled_output)
    }
}

/// Expression for a task that runs a vector completion (pre-compilation).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorCompletionTaskExpression {
    /// If this expression evaluates to true, skip the task. Receives: `input`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip: Option<super::expression::Expression>,

    /// Index into `input_maps` for mapped execution. If set, this task is
    /// expanded into multiple instances.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map: Option<u64>,

    /// Expression for the conversation messages (the prompt).
    /// Receives: `input`, `map` (if mapped).
    pub messages: super::expression::WithExpression<
        Vec<
            super::expression::WithExpression<
                chat::completions::request::MessageExpression,
            >,
        >,
    >,
    /// Expression for tools available to the completion (read-only context).
    /// Receives: `input`, `map` (if mapped).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<
        super::expression::WithExpression<
            Option<
                Vec<
                    super::expression::WithExpression<
                        chat::completions::request::ToolExpression,
                    >,
                >,
            >,
        >,
    >,
    /// Expression for the possible responses the LLMs can vote for.
    /// Receives: `input`, `map` (if mapped).
    pub responses: super::expression::WithExpression<
        Vec<
            super::expression::WithExpression<
                chat::completions::request::RichContentExpression,
            >,
        >,
    >,

    /// Expression to transform the task result into a valid function output.
    ///
    /// Receives `output` as `VectorCompletion(VectorCompletionOutput)` containing
    /// the completion result with `votes`, `scores`, and `weights` fields.
    ///
    /// The expression must return a `FunctionOutput` that is valid for the parent function's type:
    /// - For scalar functions: must return `Scalar(value)` where value is in [0, 1]
    /// - For vector functions: must return `Vector(values)` where values sum to ~1 and match the expected length
    ///
    /// The function's final output is computed as a weighted average of all task outputs using
    /// profile weights. If a function has only one task, that task's output becomes the function's
    /// output directly.
    pub output: super::expression::Expression,

}

impl VectorCompletionTaskExpression {
    /// Compiles the expression into a concrete [`VectorCompletionTask`].
    pub fn compile(
        self,
        params: &super::expression::Params,
    ) -> Result<VectorCompletionTask, super::expression::ExpressionError> {
        // compile messages
        let messages = self.messages.compile_one(params)?;
        let mut compiled_messages = Vec::with_capacity(messages.len());
        for message in messages {
            match message.compile_one_or_many(params)? {
                super::expression::OneOrMany::One(one_message) => {
                    compiled_messages.push(one_message.compile(params)?);
                }
                super::expression::OneOrMany::Many(many_messages) => {
                    for message in many_messages {
                        compiled_messages.push(message.compile(params)?);
                    }
                }
            }
        }

        // compile tools
        let tools = self
            .tools
            .map(|tools| tools.compile_one(params))
            .transpose()?
            .flatten()
            .map(|tools| {
                let mut compiled_tools = Vec::with_capacity(tools.len());
                for tool in tools {
                    match tool.compile_one_or_many(params)? {
                        super::expression::OneOrMany::One(one_tool) => {
                            compiled_tools.push(one_tool.compile(params)?);
                        }
                        super::expression::OneOrMany::Many(many_tools) => {
                            for tool in many_tools {
                                compiled_tools.push(tool.compile(params)?);
                            }
                        }
                    }
                }
                Ok::<_, super::expression::ExpressionError>(compiled_tools)
            })
            .transpose()?;

        // compile responses
        let responses = self.responses.compile_one(params)?;
        let mut compiled_responses = Vec::with_capacity(responses.len());
        for response in responses {
            match response.compile_one_or_many(params)? {
                super::expression::OneOrMany::One(one_response) => {
                    compiled_responses.push(one_response.compile(params)?);
                }
                super::expression::OneOrMany::Many(many_responses) => {
                    for response in many_responses {
                        compiled_responses.push(response.compile(params)?);
                    }
                }
            }
        }

        Ok(VectorCompletionTask {
            messages: compiled_messages,
            tools,
            responses: compiled_responses,
            output: self.output,
        })
    }
}

/// A compiled vector completion task ready for execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorCompletionTask {
    /// The resolved conversation messages.
    pub messages: Vec<chat::completions::request::Message>,
    /// The resolved tools (read-only context for the completion).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<Vec<chat::completions::request::Tool>>,
    /// The resolved response options the LLMs can vote for.
    pub responses: Vec<chat::completions::request::RichContent>,
    /// Expression to transform the task result into a valid function output.
    ///
    /// Receives `output` as `VectorCompletion(VectorCompletionOutput)` containing
    /// the completion result with `votes`, `scores`, and `weights` fields.
    /// Must return a `FunctionOutput` valid for the parent function's type (scalar or vector).
    /// See [`VectorCompletionTaskExpression::output`] for full documentation.
    pub output: super::expression::Expression,
}

impl VectorCompletionTask {
    pub fn compile_output(
        &self,
        input: &super::expression::Input,
        raw_output: super::expression::TaskOutput,
    ) -> Result<
        super::expression::FunctionOutput,
        super::expression::ExpressionError,
    > {
        let params =
            super::expression::Params::Ref(super::expression::ParamsRef {
                input,
                output: Some(raw_output),
                map: None,
            });
        let compiled_output = self.output.compile_one(&params)?;
        Ok(compiled_output)
    }
}

/// Expression for a placeholder scalar function task (pre-compilation).
///
/// Like [`ScalarFunctionTaskExpression`] but without owner/repository/commit.
/// Always produces a fixed output of 0.5.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaceholderScalarFunctionTaskExpression {
    /// JSON Schema defining the expected input structure.
    pub input_schema: super::expression::InputSchema,

    /// If this expression evaluates to true, skip the task. Receives: `input`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip: Option<super::expression::Expression>,

    /// Index into `input_maps` for mapped execution.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map: Option<u64>,

    /// Expression for the input to pass to the placeholder function.
    /// Receives: `input`, `map` (if mapped).
    pub input:
        super::expression::WithExpression<super::expression::InputExpression>,

    /// Expression to transform the fixed 0.5 output.
    /// Receives: `input`, `output` as `Function(FunctionOutput::Scalar(0.5))`.
    pub output: super::expression::Expression,
}

impl PlaceholderScalarFunctionTaskExpression {
    pub fn compile(
        self,
        params: &super::expression::Params,
    ) -> Result<PlaceholderScalarFunctionTask, super::expression::ExpressionError>
    {
        let input = self.input.compile_one(params)?.compile(params)?;
        Ok(PlaceholderScalarFunctionTask {
            input_schema: self.input_schema,
            input,
            output: self.output,
        })
    }
}

/// A compiled placeholder scalar function task.
///
/// Always produces `FunctionOutput::Scalar(0.5)` before the output expression
/// is applied.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaceholderScalarFunctionTask {
    /// JSON Schema defining the expected input structure.
    pub input_schema: super::expression::InputSchema,
    /// The resolved input.
    pub input: super::expression::Input,
    /// Expression to transform the fixed 0.5 output.
    pub output: super::expression::Expression,
}

impl PlaceholderScalarFunctionTask {
    pub fn compile_output(
        &self,
        input: &super::expression::Input,
        raw_output: super::expression::TaskOutput,
    ) -> Result<
        super::expression::FunctionOutput,
        super::expression::ExpressionError,
    > {
        let params =
            super::expression::Params::Ref(super::expression::ParamsRef {
                input,
                output: Some(raw_output),
                map: None,
            });
        let compiled_output = self.output.compile_one(&params)?;
        Ok(compiled_output)
    }
}

/// Expression for a placeholder vector function task (pre-compilation).
///
/// Like [`VectorFunctionTaskExpression`] but without owner/repository/commit.
/// Always produces an equalized vector of length `output_length`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaceholderVectorFunctionTaskExpression {
    /// JSON Schema defining the expected input structure.
    pub input_schema: super::expression::InputSchema,

    /// Expression computing the expected output vector length.
    /// Receives: `input`.
    pub output_length: super::expression::WithExpression<u64>,

    /// Expression transforming input into sub-inputs for swiss system.
    /// Receives: `input`.
    pub input_split:
        super::expression::WithExpression<Vec<super::expression::Input>>,

    /// Expression merging sub-inputs back into one input.
    /// Receives: `input` (as an array).
    pub input_merge:
        super::expression::WithExpression<super::expression::Input>,

    /// If this expression evaluates to true, skip the task. Receives: `input`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub skip: Option<super::expression::Expression>,

    /// Index into `input_maps` for mapped execution.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub map: Option<u64>,

    /// Expression for the input to pass to the placeholder function.
    /// Receives: `input`, `map` (if mapped).
    pub input:
        super::expression::WithExpression<super::expression::InputExpression>,

    /// Expression to transform the equalized vector output.
    /// Receives: `input`, `output` as `Function(FunctionOutput::Vector(equalized))`.
    pub output: super::expression::Expression,
}

impl PlaceholderVectorFunctionTaskExpression {
    pub fn compile(
        self,
        params: &super::expression::Params,
    ) -> Result<PlaceholderVectorFunctionTask, super::expression::ExpressionError>
    {
        let input = self.input.compile_one(params)?.compile(params)?;
        Ok(PlaceholderVectorFunctionTask {
            input_schema: self.input_schema,
            output_length: self.output_length,
            input_split: self.input_split,
            input_merge: self.input_merge,
            input,
            output: self.output,
        })
    }
}

/// A compiled placeholder vector function task.
///
/// Always produces `FunctionOutput::Vector(vec![1/N; output_length])` before
/// the output expression is applied.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaceholderVectorFunctionTask {
    /// JSON Schema defining the expected input structure.
    pub input_schema: super::expression::InputSchema,
    /// Expression computing the expected output vector length.
    pub output_length: super::expression::WithExpression<u64>,
    /// Expression transforming input into sub-inputs for swiss system.
    pub input_split:
        super::expression::WithExpression<Vec<super::expression::Input>>,
    /// Expression merging sub-inputs back into one input.
    pub input_merge:
        super::expression::WithExpression<super::expression::Input>,
    /// The resolved input.
    pub input: super::expression::Input,
    /// Expression to transform the equalized vector output.
    pub output: super::expression::Expression,
}

impl PlaceholderVectorFunctionTask {
    pub fn compile_output(
        &self,
        input: &super::expression::Input,
        raw_output: super::expression::TaskOutput,
    ) -> Result<
        super::expression::FunctionOutput,
        super::expression::ExpressionError,
    > {
        let params =
            super::expression::Params::Ref(super::expression::ParamsRef {
                input,
                output: Some(raw_output),
                map: None,
            });
        let compiled_output = self.output.compile_one(&params)?;
        Ok(compiled_output)
    }
}

/// The result of compiling a task expression.
///
/// Tasks without a `map` field compile to a single task. Tasks with a `map`
/// field are expanded into multiple tasks, one per element in the referenced
/// input map sub-array.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum CompiledTask {
    /// A single task (no mapping).
    One(Task),
    /// Multiple task instances from mapped execution.
    Many(Vec<Task>),
}
