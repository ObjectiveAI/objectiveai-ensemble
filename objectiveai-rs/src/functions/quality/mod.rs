//! Quality checks for function definitions.
//!
//! - [`example_inputs`] — RNG-based example input generation from an `InputSchema`
//! - [`check_vector_fields`] — validates output_length, input_split, and input_merge
//! - [`check_leaf_function`] — validates a leaf function (depth 0, vector.completion tasks)
//! - [`check_branch_function`] — validates a branch function (depth > 0, function/placeholder tasks)

mod check_branch_function;
mod check_branch_scalar_function;
mod check_branch_vector_function;
mod check_description;
mod check_leaf_function;
mod check_leaf_scalar_function;
mod check_leaf_vector_function;
mod check_vector_fields;
mod compile_and_validate;
mod example_inputs;

pub use check_branch_function::check_branch_function;
pub use check_branch_scalar_function::check_branch_scalar_function;
pub use check_branch_vector_function::check_branch_vector_function;
pub use check_leaf_function::check_leaf_function;
pub use check_leaf_scalar_function::check_leaf_scalar_function;
pub use check_leaf_vector_function::check_leaf_vector_function;
pub use check_vector_fields::{VectorFieldsValidation, check_vector_fields};
pub use example_inputs::{Generator, generate, permutations};

#[cfg(test)]
mod check_branch_scalar_function_tests;
#[cfg(test)]
mod check_branch_vector_function_tests;
#[cfg(test)]
mod check_leaf_scalar_function_tests;
#[cfg(test)]
mod check_leaf_vector_function_tests;
#[cfg(test)]
mod check_vector_fields_tests;
