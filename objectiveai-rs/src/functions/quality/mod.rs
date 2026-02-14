//! Quality checks for function definitions.
//!
//! - [`example_inputs`] — RNG-based example input generation from an `InputSchema`
//! - [`check_vector_fields`] — validates output_length, input_split, and input_merge

mod example_inputs;
mod check_vector_fields;

pub use check_vector_fields::{check_vector_fields, VectorFieldsValidation};
pub use example_inputs::generate_example_inputs;
