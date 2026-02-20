//! Expression compilation errors.

#[derive(Debug, thiserror::Error)]
pub enum ExpressionError {
    #[error(transparent)]
    JmespathError(#[from] jmespath::JmespathError),
    #[error("starlark parse error: {0}")]
    StarlarkParseError(String),
    #[error("starlark evaluation error: {0}")]
    StarlarkEvalError(String),
    #[error("starlark conversion error: {0}")]
    StarlarkConversionError(String),
    #[error(transparent)]
    DeserializationError(#[from] serde_json::Error),
    #[error("expected one value, found many")]
    ExpectedOneValueFoundMany,
}
