//! Quality checks for branch functions (depth > 0), routing by scalar vs vector.

use std::collections::HashMap;

use crate::functions::RemoteFunction;

use super::check_branch_scalar_function::check_branch_scalar_function;
use super::check_branch_vector_function::check_branch_vector_function;

/// Validates quality requirements for a branch function.
///
/// Routes to [`check_branch_scalar_function`] or [`check_branch_vector_function`]
/// based on the function type.
///
/// `children` is an optional map of `"owner/repository"` → `RemoteFunction` for
/// validating that compiled task inputs match child function input schemas.
pub fn check_branch_function(
    function: &RemoteFunction,
    children: Option<&HashMap<String, RemoteFunction>>,
) -> Result<(), String> {
    match function {
        RemoteFunction::Scalar { .. } => {
            check_branch_scalar_function(function, children)
        }
        RemoteFunction::Vector { .. } => {
            check_branch_vector_function(function, children)
        }
    }
}
