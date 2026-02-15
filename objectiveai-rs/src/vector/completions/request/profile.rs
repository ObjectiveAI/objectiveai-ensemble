//! Profile weights for vector completion requests.
//!
//! A profile specifies how much influence each LLM in the Ensemble has when
//! combining votes into final scores. Profiles can either be a simple vector
//! of decimal weights or a vector of objects that also include an optional
//! `invert` flag, which inverts that LLM's vote distribution before it is
//! combined.
//!
//! The `invert` flag is part of the **profile**, not the Ensemble definition,
//! so different profiles can use the same Ensemble with different inversion
//! behavior.

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

/// An entry in a profile with an explicit weight and optional invert flag.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileEntry {
    /// The weight for this LLM in the ensemble. Must be in [0, 1].
    pub weight: Decimal,
    /// If true, invert this LLM's vote distribution before combining.
    ///
    /// When omitted or false, the vote distribution is used as-is.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub invert: Option<bool>,
}

/// Profile weights for a vector completion.
///
/// Previously this was a simple `Vec<Decimal>`. To support per-LLM inversion
/// while remaining backwards compatible, the field is now an untagged enum:
///
/// - `Weights(Vec<Decimal>)` - legacy representation (no inversion)
/// - `Entries(Vec<ProfileEntry>)` - weights with optional per-LLM `invert`
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Profile {
    /// Simple vector of decimal weights.
    Weights(Vec<Decimal>),
    /// Vector of entries with optional invert flags.
    Entries(Vec<ProfileEntry>),
}

impl Profile {
    /// Returns the length of the underlying weights vector.
    pub fn len(&self) -> usize {
        match self {
            Profile::Weights(weights) => weights.len(),
            Profile::Entries(entries) => entries.len(),
        }
    }

    /// Returns true if the profile contains no weights.
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }

    /// Normalizes this profile into `(weight, invert)` pairs.
    ///
    /// For the legacy `Weights` variant, all `invert` flags are `false`.
    pub fn to_weights_and_invert(&self) -> Vec<(Decimal, bool)> {
        match self {
            Profile::Weights(weights) => {
                weights.iter().map(|w| (*w, false)).collect()
            }
            Profile::Entries(entries) => entries
                .iter()
                .map(|entry| (entry.weight, entry.invert.unwrap_or(false)))
                .collect(),
        }
    }
}

