//! Quality checks for function definitions.
//!
//! - [`example_inputs`] — RNG-based example input generation from an `InputSchema`
//! - [`check_vector_fields`] — validates output_length, input_split, and input_merge
//! - [`check_leaf_function`] — validates a leaf function (depth 0, vector.completion tasks)
//! - [`check_branch_function`] — validates a branch function (depth > 0, function/placeholder tasks)

mod example_inputs;
mod check_vector_fields;
mod compile_and_validate;
mod check_leaf_scalar_function;
mod check_leaf_vector_function;
mod check_branch_scalar_function;
mod check_branch_vector_function;
mod check_leaf_function;
mod check_branch_function;

pub use check_vector_fields::{check_vector_fields, VectorFieldsValidation};
pub use example_inputs::generate_example_inputs;
pub use check_leaf_scalar_function::check_leaf_scalar_function;
pub use check_leaf_vector_function::check_leaf_vector_function;
pub use check_branch_scalar_function::check_branch_scalar_function;
pub use check_branch_vector_function::check_branch_vector_function;
pub use check_leaf_function::check_leaf_function;
pub use check_branch_function::check_branch_function;

#[cfg(test)]
mod check_function_test_helpers;
#[cfg(test)]
mod check_leaf_scalar_function_tests;
#[cfg(test)]
mod check_leaf_vector_function_tests;
#[cfg(test)]
mod check_branch_scalar_function_tests;
#[cfg(test)]
mod check_branch_vector_function_tests;
#[cfg(test)]
mod check_vector_fields_tests;
