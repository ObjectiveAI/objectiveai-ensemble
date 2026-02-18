//! Distribution checks for output expressions.
//!
//! Verifies that a task's output expression maps the full range of raw
//! outputs to the full [0, 1] range (scalar) or produces well-distributed
//! per-element scores (vector). Catches expressions like `output * 0.1 + 0.45`
//! that pass uniqueness checks but produce a useless narrow range.

use rust_decimal::Decimal;

use crate::functions::expression::{
    FunctionOutput, Input, TaskOutput, TaskOutputOwned, VectorCompletionOutput,
};
use crate::functions::Task;

/// Number of systematic trials for distribution checks.
const TRIALS: usize = 1000;

/// Generates a systematic scalar value for trial k: sweeps 0.0 to 1.0.
fn systematic_scalar(k: usize) -> Decimal {
    Decimal::from_f64_retain(k as f64 / 999.0).unwrap_or(Decimal::ZERO)
}

/// Generates a systematic normalized vector of length `len` for trial k.
/// One element at a time gets most of the weight, cycling through elements.
/// Each element's weight sweeps from near 0 to near 1, ensuring per-element
/// extremes reach close to 0 and close to 1 for any vector length.
fn systematic_vector(k: usize, len: usize) -> Vec<Decimal> {
    if len == 0 {
        return vec![];
    }
    if len == 1 {
        return vec![Decimal::ONE];
    }

    // Which element gets the focus this trial
    let focus = k % len;
    // How much weight the focused element gets (sweeps 0 → 1)
    let sub_k = k / len;
    let sub_trials = TRIALS / len;
    let proportion = if sub_trials <= 1 {
        0.5
    } else {
        (sub_k as f64 / (sub_trials - 1) as f64).clamp(0.0, 1.0)
    };

    // Focused element gets `focus_weight`, rest is split evenly
    let epsilon = 0.001;
    let total_epsilon = epsilon * len as f64;
    let focus_weight = epsilon + (1.0 - total_epsilon) * proportion;
    let other_weight = (1.0 - focus_weight) / (len - 1) as f64;

    (0..len)
        .map(|p| {
            let v = if p == focus {
                focus_weight
            } else {
                other_weight
            };
            Decimal::from_f64_retain(v).unwrap_or(Decimal::ZERO)
        })
        .collect()
}

/// Generates a systematic map-scalar output: a vec of scalars (not normalized),
/// each at a different phase.
fn systematic_map_scalar(k: usize, len: usize) -> Vec<FunctionOutput> {
    let step = TRIALS / len.max(1);
    (0..len)
        .map(|i| {
            let v = ((k + i * step) % TRIALS) as f64 / 999.0;
            let v = v.clamp(0.001, 0.999);
            FunctionOutput::Scalar(
                Decimal::from_f64_retain(v).unwrap_or(Decimal::new(5, 1)),
            )
        })
        .collect()
}

/// Generates a systematic VectorCompletionOutput with `n` scores.
fn systematic_vc_output(k: usize, n: usize) -> VectorCompletionOutput {
    let scores = systematic_vector(k, n);
    let weights = systematic_vector(k, n);
    VectorCompletionOutput {
        votes: Vec::new(),
        scores,
        weights,
    }
}

// ---------------------------------------------------------------------------
// Scalar distribution check
// ---------------------------------------------------------------------------

/// Shape descriptor for the raw output to generate.
pub(super) enum ScalarOutputShape {
    /// Raw output is a scalar function result.
    Scalar,
    /// Raw output is a vector completion with `n` responses.
    VectorCompletion(usize),
}

/// Runs 1000 systematic trials on a task's output expression and checks that
/// the compiled scalar output covers the full [0, 1] range uniformly.
///
/// Returns `Ok(())` if distribution is healthy, or `Err(message)` with a
/// user-facing error message.
pub(super) fn check_scalar_distribution(
    task_index: usize,
    input: &Input,
    task: &Task,
    shape: &ScalarOutputShape,
    code: &str,
) -> Result<(), String> {
    let mut min = Decimal::ONE;
    let mut max = Decimal::ZERO;
    let mut sum = Decimal::ZERO;

    for k in 0..TRIALS {
        let mock_output = match shape {
            ScalarOutputShape::Scalar => TaskOutput::Owned(
                TaskOutputOwned::Function(FunctionOutput::Scalar(
                    systematic_scalar(k),
                )),
            ),
            ScalarOutputShape::VectorCompletion(n) => TaskOutput::Owned(
                TaskOutputOwned::VectorCompletion(systematic_vc_output(k, *n)),
            ),
        };

        let result = task.compile_output(input, mock_output).map_err(|e| {
            format!(
                "{}: Task [{}]: output expression evaluation failed during \
                 distribution check (trial {}): {}",
                code, task_index, k, e
            )
        })?;

        let value = match result {
            FunctionOutput::Scalar(s) => s,
            _ => {
                // Type mismatch is caught by CV validation; skip here
                return Ok(());
            }
        };

        if value < min {
            min = value;
        }
        if value > max {
            max = value;
        }
        sum += value;
    }

    let avg =
        sum / Decimal::from_f64_retain(TRIALS as f64).unwrap_or(Decimal::ONE);

    if min > Decimal::new(1, 2) {
        return Err(format!(
            "{}: Task [{}]: output expression is biased — when given raw outputs \
             ranging from 0.0 to 1.0, the minimum compiled output was {} (expected \
             near 0.0). The output expression should map the full range of raw task \
             outputs to the full [0, 1] range.",
            code, task_index, min
        ));
    }
    if max < Decimal::new(99, 2) {
        return Err(format!(
            "{}: Task [{}]: output expression is biased — when given raw outputs \
             ranging from 0.0 to 1.0, the maximum compiled output was {} (expected \
             near 1.0). The output expression should map the full range of raw task \
             outputs to the full [0, 1] range.",
            code, task_index, max
        ));
    }
    if avg < Decimal::new(4, 1) || avg > Decimal::new(6, 1) {
        return Err(format!(
            "{}: Task [{}]: output expression is non-uniform — the average compiled \
             output was {} (expected near 0.5). The output expression should produce \
             roughly uniform results across the [0, 1] range when given uniformly \
             distributed raw outputs.",
            code, task_index, avg
        ));
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Vector distribution check
// ---------------------------------------------------------------------------

/// Shape descriptor for the raw output to generate for vector checks.
pub(super) enum VectorOutputShape {
    /// Raw output is a mapped scalar function: vec of scalars (not normalized).
    MapScalar(usize),
    /// Raw output is an unmapped vector function with given output_length.
    Vector(u64),
    /// Raw output is a vector completion with `n` responses.
    VectorCompletion(usize),
}

/// Runs 1000 systematic trials on a task's output expression and checks that
/// the compiled vector output has well-distributed per-element scores.
///
/// Returns `Ok(())` if distribution is healthy, or `Err(message)` with a
/// user-facing error message.
pub(super) fn check_vector_distribution(
    task_index: usize,
    input: &Input,
    task: &Task,
    shape: &VectorOutputShape,
    output_length: usize,
    code: &str,
) -> Result<(), String> {
    let mut per_element_min = vec![Decimal::ONE; output_length];
    let mut per_element_max = vec![Decimal::ZERO; output_length];
    let mut per_element_sum = vec![Decimal::ZERO; output_length];

    for k in 0..TRIALS {
        let mock_output = match shape {
            VectorOutputShape::MapScalar(len) => TaskOutput::Owned(
                TaskOutputOwned::MapFunction(systematic_map_scalar(k, *len)),
            ),
            VectorOutputShape::Vector(n) => TaskOutput::Owned(
                TaskOutputOwned::Function(FunctionOutput::Vector(
                    systematic_vector(k, *n as usize),
                )),
            ),
            VectorOutputShape::VectorCompletion(n) => TaskOutput::Owned(
                TaskOutputOwned::VectorCompletion(systematic_vc_output(k, *n)),
            ),
        };

        let result = task.compile_output(input, mock_output).map_err(|e| {
            format!(
                "{}: Task [{}]: output expression evaluation failed during \
                 distribution check (trial {}): {}",
                code, task_index, k, e
            )
        })?;

        let values = match result {
            FunctionOutput::Vector(v) => v,
            _ => {
                // Type mismatch is caught by CV validation; skip here
                return Ok(());
            }
        };

        if values.len() != output_length {
            // Length mismatch is caught by CV validation; skip here
            return Ok(());
        }

        for (p, &v) in values.iter().enumerate() {
            if v < per_element_min[p] {
                per_element_min[p] = v;
            }
            if v > per_element_max[p] {
                per_element_max[p] = v;
            }
            per_element_sum[p] += v;
        }
    }

    let trials_dec =
        Decimal::from_f64_retain(TRIALS as f64).unwrap_or(Decimal::ONE);
    let expected_avg = Decimal::ONE
        / Decimal::from_f64_retain(output_length as f64)
            .unwrap_or(Decimal::ONE);
    let avg_low = expected_avg * Decimal::new(8, 1); // expected * 0.8
    let avg_high = expected_avg * Decimal::new(12, 1); // expected * 1.2

    for p in 0..output_length {
        let avg = per_element_sum[p] / trials_dec;

        if per_element_min[p] > Decimal::new(1, 2) {
            return Err(format!(
                "{}: Task [{}], element [{}]: output expression is biased — when \
                 given systematic raw outputs, the minimum compiled value for this \
                 element was {} (expected near 0.0). Each element of the output vector \
                 should be able to reach values near 0.",
                code, task_index, p, per_element_min[p]
            ));
        }
        if per_element_max[p] < Decimal::new(99, 2) {
            return Err(format!(
                "{}: Task [{}], element [{}]: output expression is biased — when \
                 given systematic raw outputs, the maximum compiled value for this \
                 element was {} (expected near 1.0). Each element of the output vector \
                 should be able to reach values near 1.",
                code, task_index, p, per_element_max[p]
            ));
        }
        if avg < avg_low || avg > avg_high {
            return Err(format!(
                "{}: Task [{}], element [{}]: output expression is non-uniform — \
                 the average compiled value for this element was {} (expected near \
                 {:.4}). Each element should average around 1/{} when given uniformly \
                 distributed raw outputs.",
                code, task_index, p, avg, expected_avg, output_length
            ));
        }
    }

    Ok(())
}
