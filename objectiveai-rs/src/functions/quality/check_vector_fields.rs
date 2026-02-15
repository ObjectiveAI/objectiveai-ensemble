//! Validation of vector function fields (output_length, input_split, input_merge).
//!
//! Verifies that these expressions work correctly together via round-trip testing
//! against randomized example inputs.

use rand::Rng;
use serde::Deserialize;

use super::example_inputs::generate_example_inputs;
use crate::functions::expression::{Input, InputSchema, WithExpression};
use crate::functions::{Function, RemoteFunction};

/// The 4 fields needed to validate a vector function's split/merge behavior.
#[derive(Debug, Clone, Deserialize)]
pub struct VectorFieldsValidation {
    pub input_schema: InputSchema,
    pub output_length: WithExpression<u64>,
    pub input_split: WithExpression<Vec<Input>>,
    pub input_merge: WithExpression<Input>,
}

impl VectorFieldsValidation {
    /// Construct a minimal `Function` for compilation, cloning our expressions.
    fn to_function(&self) -> Function {
        Function::Remote(RemoteFunction::Vector {
            description: String::new(),
            changelog: None,
            input_schema: self.input_schema.clone(),
            input_maps: None,
            tasks: vec![],
            output_length: self.output_length.clone(),
            input_split: self.input_split.clone(),
            input_merge: self.input_merge.clone(),
        })
    }
}

/// Validate that the vector fields work together correctly.
///
/// Generates diverse, randomized example inputs from the `input_schema`, then
/// for each input:
/// 1. Compiles `output_length` — must be > 0
/// 2. Compiles `input_split` — length must equal output_length
/// 3. Each split element must produce output_length = 1
/// 4. Merging all splits must reconstruct the original input
/// 5. Merging random subsets must produce output_length = subset size
pub fn check_vector_fields(
    fields: VectorFieldsValidation,
) -> Result<(), String> {
    let inputs = generate_example_inputs(&fields.input_schema);

    if inputs.is_empty() {
        return Err("Failed to generate any example inputs from input_schema"
            .to_string());
    }

    for (i, input) in inputs.iter().enumerate() {
        // 1. Compile output_length
        let output_length = fields
            .to_function()
            .compile_output_length(input)
            .map_err(|e| {
                format!("Input [{}]: output_length compilation failed: {}", i, e)
            })?
            .ok_or_else(|| {
                format!(
                    "Input [{}]: output_length returned None (not a vector function?)",
                    i
                )
            })?;

        if output_length < 1 {
            return Err(format!(
                "Input [{}]: output_length must be > 0 for vector functions, got {}.\n\nInput: {}",
                i,
                output_length,
                serde_json::to_string_pretty(input).unwrap_or_default()
            ));
        }

        // 2. Compile input_split
        let splits = fields
            .to_function()
            .compile_input_split(input)
            .map_err(|e| {
                format!("Input [{}]: input_split compilation failed: {}", i, e)
            })?
            .ok_or_else(|| {
                format!("Input [{}]: input_split returned None", i)
            })?;

        if splits.len() as u64 != output_length {
            return Err(format!(
                "Input [{}]: input_split produced {} elements but output_length is {}.\n\nInput: {}",
                i,
                splits.len(),
                output_length,
                serde_json::to_string_pretty(input).unwrap_or_default()
            ));
        }

        // 3. Each split must produce output_length = 1
        for (j, split) in splits.iter().enumerate() {
            let split_len = fields
                .to_function()
                .compile_output_length(split)
                .map_err(|e| {
                    format!(
                        "Input [{}]: output_length failed for split [{}]: {}",
                        i, j, e
                    )
                })?
                .ok_or_else(|| {
                    format!(
                        "Input [{}]: output_length returned None for split [{}]",
                        i, j
                    )
                })?;

            if split_len != 1 {
                return Err(format!(
                    "Input [{}]: split [{}] output_length must be 1, got {}.\n\nSplit: {}",
                    i,
                    j,
                    split_len,
                    serde_json::to_string_pretty(split).unwrap_or_default()
                ));
            }
        }

        // 4. Merge all splits — must equal original input
        let merge_input = Input::Array(splits.clone());
        let merged = fields
            .to_function()
            .compile_input_merge(&merge_input)
            .map_err(|e| {
                format!("Input [{}]: input_merge compilation failed: {}", i, e)
            })?
            .ok_or_else(|| {
                format!("Input [{}]: input_merge returned None", i)
            })?;

        if !inputs_equal(input, &merged) {
            return Err(format!(
                "Input [{}]: merged input does not match original.\n\nOriginal: {}\n\nMerged: {}",
                i,
                serde_json::to_string_pretty(input).unwrap_or_default(),
                serde_json::to_string_pretty(&merged).unwrap_or_default()
            ));
        }

        // 5. Merged output_length equals original output_length
        let merged_len = fields
            .to_function()
            .compile_output_length(&merged)
            .map_err(|e| {
                format!(
                    "Input [{}]: output_length failed for merged input: {}",
                    i, e
                )
            })?
            .ok_or_else(|| {
                format!(
                    "Input [{}]: output_length returned None for merged input",
                    i
                )
            })?;

        if merged_len != output_length {
            return Err(format!(
                "Input [{}]: merged output_length ({}) != original output_length ({})",
                i, merged_len, output_length
            ));
        }

        // 6. Random subsets — merge and verify output_length = subset size
        let subsets = random_subsets(splits.len(), 5);
        for subset in &subsets {
            let sub_splits: Vec<Input> =
                subset.iter().map(|&idx| splits[idx].clone()).collect();
            let sub_merge_input = Input::Array(sub_splits);
            let sub_merged = fields
                .to_function()
                .compile_input_merge(&sub_merge_input)
                .map_err(|e| {
                    format!(
                        "Input [{}]: input_merge failed for subset {:?}: {}",
                        i, subset, e
                    )
                })?
                .ok_or_else(|| {
                    format!(
                        "Input [{}]: input_merge returned None for subset {:?}",
                        i, subset
                    )
                })?;

            let sub_merged_len = fields
                .to_function()
                .compile_output_length(&sub_merged)
                .map_err(|e| {
                    format!(
                        "Input [{}]: output_length failed for merged subset {:?}: {}",
                        i, subset, e
                    )
                })?
                .ok_or_else(|| {
                    format!(
                        "Input [{}]: output_length returned None for merged subset {:?}",
                        i, subset
                    )
                })?;

            if sub_merged_len as usize != subset.len() {
                return Err(format!(
                    "Input [{}]: merged subset {:?} output_length is {}, expected {}",
                    i,
                    subset,
                    sub_merged_len,
                    subset.len()
                ));
            }
        }
    }

    Ok(())
}

/// Deep equality check for Input values.
pub(super) fn inputs_equal(a: &Input, b: &Input) -> bool {
    match (a, b) {
        (Input::String(a), Input::String(b)) => a == b,
        (Input::Integer(a), Input::Integer(b)) => a == b,
        (Input::Number(a), Input::Number(b)) => a == b,
        (Input::Boolean(a), Input::Boolean(b)) => a == b,
        (Input::Array(a), Input::Array(b)) => {
            a.len() == b.len()
                && a.iter().zip(b.iter()).all(|(x, y)| inputs_equal(x, y))
        }
        (Input::Object(a), Input::Object(b)) => {
            a.len() == b.len()
                && a.iter().zip(b.iter()).all(|((ka, va), (kb, vb))| {
                    ka == kb && inputs_equal(va, vb)
                })
        }
        (Input::RichContentPart(a), Input::RichContentPart(b)) => {
            serde_json::to_string(a).ok() == serde_json::to_string(b).ok()
        }
        _ => false,
    }
}

/// Generate random subsets of indices for subset merge testing.
pub(super) fn random_subsets(length: usize, count: usize) -> Vec<Vec<usize>> {
    if length < 2 {
        return vec![];
    }

    let mut rng = rand::rng();
    let mut result = Vec::new();

    for _ in 0..count {
        let size = rng.random_range(2..=length);
        let mut all_indices: Vec<usize> = (0..length).collect();

        // Fisher-Yates shuffle
        for i in (1..all_indices.len()).rev() {
            let j = rng.random_range(0..=i);
            all_indices.swap(i, j);
        }

        let mut subset: Vec<usize> =
            all_indices.into_iter().take(size).collect();
        subset.sort();
        subset.dedup();

        if subset.len() >= 2 {
            result.push(subset);
        }
    }

    result
}