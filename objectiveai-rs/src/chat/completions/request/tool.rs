//! Tool/function definitions for chat completions.

use crate::functions;
use functions::expression::{ExpressionError, FromStarlarkValue};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use starlark::values::dict::DictRef as StarlarkDictRef;
use starlark::values::float::UnpackFloat;
use starlark::values::list::ListRef as StarlarkListRef;
use starlark::values::{UnpackValue, Value as StarlarkValue};

/// Utilities for working with tool lists.
pub mod tools {
    /// Computes a content-addressed ID for a list of tools.
    pub fn id(tools: &[super::Tool]) -> String {
        let mut hasher = twox_hash::XxHash3_128::with_seed(0);
        hasher.write(serde_json::to_string(tools).unwrap().as_bytes());
        format!("{:0>22}", base62::encode(hasher.finish_128()))
    }
}

/// A tool that can be called by the model.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Tool {
    /// A function tool.
    Function { function: FunctionTool },
}

impl FromStarlarkValue for Tool {
    fn from_starlark_value(value: &StarlarkValue) -> Result<Self, ExpressionError> {
        let dict = StarlarkDictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("Tool: expected dict".into()))?;
        let mut function = None;
        for (k, v) in dict.iter() {
            let key = <&str as UnpackValue>::unpack_value(k)
                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                .ok_or_else(|| ExpressionError::StarlarkConversionError("Tool: expected string key".into()))?;
            if key == "function" {
                function = Some(FunctionTool::from_starlark_value(&v)?);
                break;
            }
        }
        Ok(Tool::Function {
            function: function.ok_or_else(|| ExpressionError::StarlarkConversionError("Tool: missing function".into()))?,
        })
    }
}

/// Expression variant of [`Tool`] for dynamic content.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ToolExpression {
    /// A function tool expression.
    Function {
        /// The function definition expression.
        function: functions::expression::WithExpression<FunctionToolExpression>,
    },
}

impl ToolExpression {
    /// Compiles the expression into a concrete [`Tool`].
    pub fn compile(
        self,
        params: &functions::expression::Params,
    ) -> Result<Tool, functions::expression::ExpressionError> {
        match self {
            ToolExpression::Function { function } => Ok(Tool::Function {
                function: function.compile_one(params)?.compile(params)?,
            }),
        }
    }
}

impl FromStarlarkValue for ToolExpression {
    fn from_starlark_value(value: &StarlarkValue) -> Result<Self, ExpressionError> {
        let dict = StarlarkDictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("ToolExpression: expected dict".into()))?;
        let mut function = None;
        for (k, v) in dict.iter() {
            let key = <&str as UnpackValue>::unpack_value(k)
                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                .ok_or_else(|| ExpressionError::StarlarkConversionError("ToolExpression: expected string key".into()))?;
            if key == "function" {
                function = Some(functions::expression::WithExpression::Value(
                    FunctionToolExpression::from_starlark_value(&v)?,
                ));
                break;
            }
        }
        Ok(ToolExpression::Function {
            function: function.ok_or_else(|| ExpressionError::StarlarkConversionError("ToolExpression: missing function".into()))?,
        })
    }
}

/// A function tool definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionTool {
    /// The name of the function.
    pub name: String,
    /// A description of what the function does.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// JSON Schema for the function parameters.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<serde_json::Map<String, serde_json::Value>>,
    /// Whether to enforce strict schema validation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strict: Option<bool>,
}

impl FromStarlarkValue for FunctionTool {
    fn from_starlark_value(value: &StarlarkValue) -> Result<Self, ExpressionError> {
        let dict = StarlarkDictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionTool: expected dict".into()))?;
        let mut name = None;
        let mut description = None;
        let mut parameters = None;
        let mut strict = None;
        for (k, v) in dict.iter() {
            let key = <&str as UnpackValue>::unpack_value(k)
                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                .ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionTool: expected string key".into()))?;
            match key {
                "name" => name = Some(String::from_starlark_value(&v)?),
                "description" => description = Option::<String>::from_starlark_value(&v)?,
                "parameters" => {
                    if !v.is_none() {
                        let json = serde_json::Value::from_starlark_value(&v)?;
                        if let serde_json::Value::Object(map) = json {
                            parameters = Some(map);
                        } else {
                            return Err(ExpressionError::StarlarkConversionError("FunctionTool: parameters must be an object".into()));
                        }
                    }
                }
                "strict" => strict = Option::<bool>::from_starlark_value(&v)?,
                _ => {}
            }
        }
        Ok(FunctionTool {
            name: name.ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionTool: missing name".into()))?,
            description,
            parameters,
            strict,
        })
    }
}

/// Expression variant of [`FunctionTool`] for dynamic content.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FunctionToolExpression {
    /// The function name expression.
    pub name: functions::expression::WithExpression<String>,
    /// The description expression.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description:
        Option<functions::expression::WithExpression<Option<String>>>,
    /// The parameters expression.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parameters: Option<
        functions::expression::WithExpression<
            Option<
                IndexMap<
                    String,
                    functions::expression::WithExpression<ValueExpression>,
                >,
            >,
        >,
    >,
    /// The strict mode expression.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strict: Option<functions::expression::WithExpression<Option<bool>>>,
}

impl FunctionToolExpression {
    /// Compiles the expression into a concrete [`FunctionTool`].
    pub fn compile(
        self,
        params: &functions::expression::Params,
    ) -> Result<FunctionTool, functions::expression::ExpressionError> {
        let name = self.name.compile_one(params)?;
        let description = self
            .description
            .map(|description| description.compile_one(params))
            .transpose()?
            .flatten();
        let parameters = self
            .parameters
            .map(|parameters| parameters.compile_one(params))
            .transpose()?
            .flatten()
            .map(|parameters| {
                let mut compiled_parameters =
                    serde_json::Map::with_capacity(parameters.len());
                for (key, value) in parameters {
                    compiled_parameters.insert(
                        key,
                        value.compile_one(params)?.compile(params)?,
                    );
                }
                Ok::<_, functions::expression::ExpressionError>(
                    compiled_parameters,
                )
            })
            .transpose()?;
        let strict = self
            .strict
            .map(|strict| strict.compile_one(params))
            .transpose()?
            .flatten();
        Ok(FunctionTool {
            name,
            description,
            parameters,
            strict,
        })
    }
}

impl FromStarlarkValue for FunctionToolExpression {
    fn from_starlark_value(value: &StarlarkValue) -> Result<Self, ExpressionError> {
        let dict = StarlarkDictRef::from_value(*value)
            .ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionToolExpression: expected dict".into()))?;
        let mut name = None;
        let mut description = None;
        let mut parameters = None;
        let mut strict = None;
        for (k, v) in dict.iter() {
            let key = <&str as UnpackValue>::unpack_value(k)
                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                .ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionToolExpression: expected string key".into()))?;
            match key {
                "name" => name = Some(functions::expression::WithExpression::Value(String::from_starlark_value(&v)?)),
                "description" => {
                    description = Some(functions::expression::WithExpression::Value(
                        if v.is_none() { None } else { Some(String::from_starlark_value(&v)?) }
                    ));
                }
                "parameters" => {
                    if v.is_none() {
                        parameters = Some(functions::expression::WithExpression::Value(None));
                    } else if let Some(param_dict) = StarlarkDictRef::from_value(v) {
                        let mut obj = IndexMap::with_capacity(param_dict.len());
                        for (pk, pv) in param_dict.iter() {
                            let param_key = <&str as UnpackValue>::unpack_value(pk)
                                .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                                .ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionToolExpression: expected string key in parameters".into()))?;
                            obj.insert(
                                param_key.to_owned(),
                                functions::expression::WithExpression::Value(ValueExpression::from_starlark_value(&pv)?),
                            );
                        }
                        parameters = Some(functions::expression::WithExpression::Value(Some(obj)));
                    } else {
                        return Err(ExpressionError::StarlarkConversionError("FunctionToolExpression: parameters must be a dict".into()));
                    }
                }
                "strict" => {
                    strict = Some(functions::expression::WithExpression::Value(
                        if v.is_none() { None } else { Some(bool::from_starlark_value(&v)?) }
                    ));
                }
                _ => {}
            }
        }
        Ok(FunctionToolExpression {
            name: name.ok_or_else(|| ExpressionError::StarlarkConversionError("FunctionToolExpression: missing name".into()))?,
            description,
            parameters,
            strict,
        })
    }
}

/// A JSON value expression for dynamic content.
///
/// This allows JSON values to contain expressions (JMESPath or Starlark)
/// that are evaluated at runtime.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ValueExpression {
    /// A null value.
    Null,
    /// A boolean value.
    Bool(bool),
    /// A numeric value.
    Number(serde_json::Number),
    /// A string value.
    String(String),
    /// An array of value expressions.
    Array(Vec<functions::expression::WithExpression<ValueExpression>>),
    /// An object with value expressions.
    Object(
        IndexMap<
            String,
            functions::expression::WithExpression<ValueExpression>,
        >,
    ),
}

impl ValueExpression {
    /// Compiles the expression into a concrete JSON value.
    pub fn compile(
        self,
        params: &functions::expression::Params,
    ) -> Result<serde_json::Value, functions::expression::ExpressionError> {
        match self {
            ValueExpression::Null => Ok(serde_json::Value::Null),
            ValueExpression::Bool(bool) => Ok(serde_json::Value::Bool(bool)),
            ValueExpression::Number(number) => {
                Ok(serde_json::Value::Number(number))
            }
            ValueExpression::String(string) => {
                Ok(serde_json::Value::String(string))
            }
            ValueExpression::Array(array) => {
                let mut compiled_array = Vec::with_capacity(array.len());
                for item in array {
                    match item.compile_one_or_many(params)? {
                        functions::expression::OneOrMany::One(one_item) => {
                            compiled_array.push(one_item.compile(params)?);
                        }
                        functions::expression::OneOrMany::Many(many_items) => {
                            for item in many_items {
                                compiled_array.push(item.compile(params)?);
                            }
                        }
                    }
                }
                Ok(serde_json::Value::Array(compiled_array))
            }
            ValueExpression::Object(object) => {
                let mut compiled_object =
                    serde_json::Map::with_capacity(object.len());
                for (key, value) in object {
                    compiled_object.insert(
                        key,
                        value.compile_one(params)?.compile(params)?,
                    );
                }
                Ok(serde_json::Value::Object(compiled_object))
            }
        }
    }
}

impl FromStarlarkValue for ValueExpression {
    fn from_starlark_value(value: &StarlarkValue) -> Result<Self, ExpressionError> {
        if value.is_none() {
            return Ok(ValueExpression::Null);
        }
        if let Ok(Some(b)) = bool::unpack_value(*value) {
            return Ok(ValueExpression::Bool(b));
        }
        if let Ok(Some(i)) = i64::unpack_value(*value) {
            return Ok(ValueExpression::Number(serde_json::Number::from(i)));
        }
        if let Ok(Some(UnpackFloat(f))) = UnpackFloat::unpack_value(*value) {
            if let Some(n) = serde_json::Number::from_f64(f) {
                return Ok(ValueExpression::Number(n));
            }
        }
        if let Ok(Some(s)) = <&str as UnpackValue>::unpack_value(*value) {
            return Ok(ValueExpression::String(s.to_owned()));
        }
        if let Some(list) = StarlarkListRef::from_value(*value) {
            let mut items = Vec::with_capacity(list.len());
            for v in list.iter() {
                items.push(functions::expression::WithExpression::Value(
                    ValueExpression::from_starlark_value(&v)?,
                ));
            }
            return Ok(ValueExpression::Array(items));
        }
        if let Some(dict) = StarlarkDictRef::from_value(*value) {
            let mut obj = IndexMap::with_capacity(dict.len());
            for (k, v) in dict.iter() {
                let key = <&str as UnpackValue>::unpack_value(k)
                    .map_err(|e| ExpressionError::StarlarkConversionError(e.to_string()))?
                    .ok_or_else(|| ExpressionError::StarlarkConversionError("ValueExpression: expected string key".into()))?;
                obj.insert(
                    key.to_owned(),
                    functions::expression::WithExpression::Value(ValueExpression::from_starlark_value(&v)?),
                );
            }
            return Ok(ValueExpression::Object(obj));
        }
        Err(ExpressionError::StarlarkConversionError(format!(
            "ValueExpression: unsupported type: {}",
            value.get_type()
        )))
    }
}
