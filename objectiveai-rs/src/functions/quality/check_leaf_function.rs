//! Quality checks for leaf functions (depth 0), routing by scalar vs vector.

use crate::functions::RemoteFunction;

use super::check_leaf_scalar_function::check_leaf_scalar_function;
use super::check_leaf_vector_function::check_leaf_vector_function;

/// Validates quality requirements for a leaf function.
///
/// Routes to [`check_leaf_scalar_function`] or [`check_leaf_vector_function`]
/// based on the function type.
pub fn check_leaf_function(function: &RemoteFunction) -> Result<(), String> {
    match function {
        RemoteFunction::Scalar { .. } => check_leaf_scalar_function(function),
        RemoteFunction::Vector { .. } => check_leaf_vector_function(function),
    }
}
