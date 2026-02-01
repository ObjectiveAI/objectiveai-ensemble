//! Core expression types for JMESPath and Starlark evaluation.

use serde::{de::DeserializeOwned, Deserialize, Serialize};

/// Result of an expression that may produce one or many values.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum OneOrMany<T> {
    /// A single value.
    One(T),
    /// Multiple values (from array expressions).
    Many(Vec<T>),
}

/// An expression that can be either JMESPath or Starlark.
///
/// Serializes as `{"$jmespath": "..."}` or `{"$starlark": "..."}` in JSON.
///
/// # Examples
///
/// JMESPath:
/// ```json
/// {"$jmespath": "input.items[0].name"}
/// ```
///
/// Starlark:
/// ```json
/// {"$starlark": "input['items'][0]['name']"}
/// ```
#[derive(Debug, Clone)]
pub enum Expression {
    /// A JMESPath expression.
    JMESPath(String),
    /// A Starlark expression.
    Starlark(String),
}

impl Serialize for Expression {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeMap;
        let mut map = serializer.serialize_map(Some(1))?;
        match self {
            Expression::JMESPath(expr) => map.serialize_entry("$jmespath", expr)?,
            Expression::Starlark(expr) => map.serialize_entry("$starlark", expr)?,
        }
        map.end()
    }
}

impl<'de> Deserialize<'de> for Expression {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::de::{self, MapAccess, Visitor};
        use std::fmt;

        struct ExpressionVisitor;

        impl<'de> Visitor<'de> for ExpressionVisitor {
            type Value = Expression;

            fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
                formatter.write_str(
                    "a map with exactly one key '$jmespath' or '$starlark' containing a string",
                )
            }

            fn visit_map<M>(self, mut map: M) -> Result<Expression, M::Error>
            where
                M: MapAccess<'de>,
            {
                // Get the first (and should be only) key
                let Some(key) = map.next_key::<String>()? else {
                    return Err(de::Error::custom(
                        "expected '$jmespath' or '$starlark' key, found empty map",
                    ));
                };

                // Get the string value
                let expr: String = map.next_value()?;

                // Ensure there are no more keys
                if map.next_key::<String>()?.is_some() {
                    return Err(de::Error::custom(
                        "expected exactly one expression key, found additional keys",
                    ));
                }

                match key.as_str() {
                    "$jmespath" => Ok(Expression::JMESPath(expr)),
                    "$starlark" => Ok(Expression::Starlark(expr)),
                    other => Err(de::Error::custom(format!(
                        "expected '$jmespath' or '$starlark', found '{}'",
                        other
                    ))),
                }
            }
        }

        deserializer.deserialize_map(ExpressionVisitor)
    }
}

impl Expression {
    /// Compiles the expression, allowing array results.
    ///
    /// Returns `OneOrMany::One` for single values or `OneOrMany::Many` for arrays.
    /// Null values are filtered out from array results.
    /// A Single Null value is treated as an empty array.
    pub fn compile_one_or_many<T>(
        &self,
        params: &super::Params,
    ) -> Result<OneOrMany<T>, super::ExpressionError>
    where
        T: DeserializeOwned,
    {
        let value = match self {
            Expression::JMESPath(jmespath) => {
                let expr = super::JMESPATH_RUNTIME.compile(jmespath)?;
                let value = expr.search(params)?;
                serde_json::to_value(value).unwrap()
            }
            Expression::Starlark(starlark) => super::starlark_eval(starlark, params)?,
        };
        Self::deserialize_result(value)
    }

    /// Deserialize expression result to the expected type.
    fn deserialize_result<T>(value: serde_json::Value) -> Result<OneOrMany<T>, super::ExpressionError>
    where
        T: DeserializeOwned,
    {
        let value: Option<OneOrMany<Option<T>>> = serde_json::from_value(value)
            .map_err(super::ExpressionError::DeserializationError)?;
        Ok(match value {
            Some(OneOrMany::One(Some(v))) => OneOrMany::One(v),
            Some(OneOrMany::One(None)) => OneOrMany::Many(Vec::new()),
            Some(OneOrMany::Many(mut vs)) => {
                vs.retain(|v| v.is_some());
                if vs.is_empty() {
                    OneOrMany::Many(Vec::new())
                } else if vs.len() == 1 {
                    OneOrMany::One(vs.into_iter().flatten().next().unwrap())
                } else {
                    OneOrMany::Many(vs.into_iter().flatten().collect())
                }
            }
            None => OneOrMany::Many(Vec::new()),
        })
    }

    /// Compiles the expression, expecting exactly one value.
    ///
    /// Accepts a single value or an array with exactly one element.
    /// Returns an error if the expression evaluates to null, an empty array,
    /// or an array with more than one element.
    pub fn compile_one<T>(
        &self,
        params: &super::Params,
    ) -> Result<T, super::ExpressionError>
    where
        T: DeserializeOwned,
    {
        let result = self.compile_one_or_many(params)?;
        match result {
            OneOrMany::One(value) => Ok(value),
            OneOrMany::Many(_) => Err(super::ExpressionError::ExpectedOneValueFoundMany),
        }
    }
}

/// A value that can be either a literal or an expression.
///
/// This allows Function definitions to mix static values with dynamic
/// expressions. During compilation, expressions are evaluated while
/// literal values pass through unchanged.
///
/// # Example
///
/// Literal value:
/// ```json
/// "hello world"
/// ```
///
/// JMESPath expression:
/// ```json
/// {"$jmespath": "input.greeting"}
/// ```
///
/// Starlark expression:
/// ```json
/// {"$starlark": "input['greeting']"}
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum WithExpression<T> {
    /// An expression (JMESPath or Starlark) to evaluate.
    Expression(Expression),
    /// A literal value.
    Value(T),
}

impl<T> std::default::Default for WithExpression<T>
where
    T: Default,
{
    fn default() -> Self {
        WithExpression::Value(T::default())
    }
}

impl<T> WithExpression<T>
where
    T: DeserializeOwned,
{
    /// Compiles the value, allowing array results from expressions.
    ///
    /// Literal values always return `OneOrMany::One`. Expressions may return
    /// either one or many values.
    pub fn compile_one_or_many(
        self,
        params: &super::Params,
    ) -> Result<OneOrMany<T>, super::ExpressionError> {
        match self {
            WithExpression::Expression(expr) => {
                expr.compile_one_or_many(params)
            }
            WithExpression::Value(value) => Ok(OneOrMany::One(value)),
        }
    }

    /// Compiles the value, expecting exactly one result.
    ///
    /// Literal values pass through unchanged. Expressions must evaluate to
    /// a single value or an array with exactly one element.
    pub fn compile_one(
        self,
        params: &super::Params,
    ) -> Result<T, super::ExpressionError> {
        match self {
            WithExpression::Expression(expr) => expr.compile_one(params),
            WithExpression::Value(value) => Ok(value),
        }
    }
}
