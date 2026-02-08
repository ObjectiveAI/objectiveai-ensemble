//! Function execution orchestration.
//!
//! Executes Functions by flattening them into task profiles and running
//! the tasks (Vector Completions or nested Functions) in parallel. Handles
//! streaming output, retry tokens, and reasoning summaries.

mod client;
mod error;
pub mod usage_handler;

#[cfg(test)]
mod client_tests;

pub use client::*;
pub use error::*;
