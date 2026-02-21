//! Core Ensemble types and validation logic.

use crate::ensemble_llm;
use crate::vector::completions::request::{Profile, ProfileEntry};
use indexmap::IndexMap;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use twox_hash::XxHash3_128;

/// The base configuration for an Ensemble (without computed ID).
///
/// Contains a list of LLM configurations that will be validated, deduplicated,
/// and sorted when converting to [`Ensemble`].
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EnsembleBase {
    /// The LLMs in this ensemble, with optional counts and fallbacks.
    pub llms: Vec<ensemble_llm::EnsembleLlmBaseWithFallbacksAndCount>,
}

/// A validated Ensemble with its computed content-addressed ID.
///
/// Created by converting from [`EnsembleBase`] via [`TryFrom`]. The conversion:
/// 1. Validates and normalizes each LLM
/// 2. Merges duplicate LLMs (by full_id) and sums their counts
/// 3. Sorts LLMs by full_id for deterministic ordering
/// 4. Computes the ensemble ID from the sorted (full_id, count) pairs
///
/// # Constraints
///
/// - Individual LLMs with `count: 0` are skipped
/// - Total LLM count (sum of all counts) must be between 1 and 128
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Ensemble {
    /// The deterministic content-addressed ID (22-character base62 string).
    pub id: String,
    /// The validated and deduplicated LLMs, sorted by full_id.
    pub llms: Vec<ensemble_llm::EnsembleLlmWithFallbacksAndCount>,
}

impl TryFrom<EnsembleBase> for Ensemble {
    type Error = String;
    fn try_from(
        EnsembleBase { llms: base_llms }: EnsembleBase,
    ) -> Result<Self, Self::Error> {
        // convert all base LLMs and merge duplicates
        let mut llms_with_full_id: IndexMap<
            String,
            ensemble_llm::EnsembleLlmWithFallbacksAndCount,
        > = IndexMap::with_capacity(base_llms.len());
        let mut count = 0;
        for base_llm in base_llms {
            match base_llm.count {
                0 => continue,
                n => count += n,
            }
            let llm: ensemble_llm::EnsembleLlmWithFallbacksAndCount =
                base_llm.try_into()?;
            // validate no 2 identical IDs in primary/fallbacks
            if let Some(fallbacks) = &llm.fallbacks {
                if fallbacks.iter().any(|fb| fb.id == llm.inner.id) {
                    return Err(format!(
                        "Ensemble LLM cannot have identical primary and fallback IDs: {}",
                        llm.inner.id
                    ));
                }
                for i in 0..fallbacks.len() {
                    for j in (i + 1)..fallbacks.len() {
                        if fallbacks[i].id == fallbacks[j].id {
                            return Err(format!(
                                "Ensemble LLM cannot have duplicate fallback IDs: {}",
                                fallbacks[i].id
                            ));
                        }
                    }
                }
            }
            let full_id = llm.full_id();
            match llms_with_full_id.get_mut(&full_id) {
                Some(existing_llm) => existing_llm.count += llm.count,
                None => {
                    llms_with_full_id.insert(full_id, llm);
                }
            }
        }

        // validate count
        if count == 0 || count > 128 {
            return Err(
                "`ensemble.llms` must contain between 1 and 128 total LLMs"
                    .to_string(),
            );
        }

        // sort by full_id to ensure deterministic order
        llms_with_full_id.sort_unstable_keys();

        // compute ensemble ID
        let mut hasher = XxHash3_128::with_seed(0);
        for (full_id, llm) in &llms_with_full_id {
            hasher.write(full_id.as_bytes());
            let count_bytes = llm.count.to_le_bytes();
            hasher.write(&count_bytes);
        }
        let id = format!("{:0>22}", base62::encode(hasher.finish_128()));

        // collect LLMs
        let llms = llms_with_full_id.into_values().collect::<Vec<_>>();

        // return ensemble
        Ok(Ensemble { id, llms })
    }
}

impl Ensemble {
    /// Converts an EnsembleBase to Ensemble while aligning profile weights.
    ///
    /// Profile weights are filtered (count-0 removed), merged (weighted avg by count),
    /// and sorted to match the resulting Ensemble's LLM ordering.
    pub fn try_from_with_profile(
        EnsembleBase { llms: base_llms }: EnsembleBase,
        profile: Profile,
    ) -> Result<(Self, Profile), String> {
        // validate lengths match
        if profile.len() != base_llms.len() {
            return Err(format!(
                "profile length ({}) does not match ensemble LLMs length ({})",
                profile.len(),
                base_llms.len()
            ));
        }

        // normalize profile to (weight, invert) pairs
        let profile_pairs = profile.to_weights_and_invert();

        // zip base LLMs with profile entries, filter count-0, validate, and merge
        let mut llms_with_full_id: IndexMap<
            String,
            (
                ensemble_llm::EnsembleLlmWithFallbacksAndCount,
                Decimal,  // weighted sum (weight * count)
                u64,      // total count (for computing weighted average)
                bool,     // invert
            ),
        > = IndexMap::with_capacity(base_llms.len());
        let mut count = 0u64;

        for (base_llm, (weight, invert)) in
            base_llms.into_iter().zip(profile_pairs.into_iter())
        {
            match base_llm.count {
                0 => continue,
                n => count += n,
            }
            let llm: ensemble_llm::EnsembleLlmWithFallbacksAndCount =
                base_llm.try_into()?;
            // validate no 2 identical IDs in primary/fallbacks
            if let Some(fallbacks) = &llm.fallbacks {
                if fallbacks.iter().any(|fb| fb.id == llm.inner.id) {
                    return Err(format!(
                        "Ensemble LLM cannot have identical primary and fallback IDs: {}",
                        llm.inner.id
                    ));
                }
                for i in 0..fallbacks.len() {
                    for j in (i + 1)..fallbacks.len() {
                        if fallbacks[i].id == fallbacks[j].id {
                            return Err(format!(
                                "Ensemble LLM cannot have duplicate fallback IDs: {}",
                                fallbacks[i].id
                            ));
                        }
                    }
                }
            }
            let full_id = llm.full_id();
            match llms_with_full_id.get_mut(&full_id) {
                Some((existing, weighted_sum, total_count, existing_invert)) => {
                    if *existing_invert != invert {
                        return Err(format!(
                            "conflicting invert flags for merged ensemble LLM with full_id: {}",
                            full_id
                        ));
                    }
                    *weighted_sum += weight * Decimal::from(llm.count);
                    *total_count += llm.count;
                    existing.count += llm.count;
                }
                None => {
                    let weighted_sum = weight * Decimal::from(llm.count);
                    let total_count = llm.count;
                    llms_with_full_id
                        .insert(full_id, (llm, weighted_sum, total_count, invert));
                }
            }
        }

        // validate count
        if count == 0 || count > 128 {
            return Err(
                "`ensemble.llms` must contain between 1 and 128 total LLMs"
                    .to_string(),
            );
        }

        // sort by full_id to ensure deterministic order
        llms_with_full_id.sort_unstable_keys();

        // compute ensemble ID
        let mut hasher = XxHash3_128::with_seed(0);
        for (full_id, (llm, _, _, _)) in &llms_with_full_id {
            hasher.write(full_id.as_bytes());
            let count_bytes = llm.count.to_le_bytes();
            hasher.write(&count_bytes);
        }
        let id = format!("{:0>22}", base62::encode(hasher.finish_128()));

        // collect LLMs and aligned profile entries
        let mut llms = Vec::with_capacity(llms_with_full_id.len());
        let mut entries = Vec::with_capacity(llms_with_full_id.len());
        for (_, (llm, weighted_sum, total_count, invert)) in llms_with_full_id
        {
            llms.push(llm);
            let merged_weight = weighted_sum / Decimal::from(total_count);
            entries.push(ProfileEntry {
                weight: merged_weight,
                invert: if invert { Some(true) } else { None },
            });
        }

        Ok((Ensemble { id, llms }, Profile::Entries(entries)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ensemble_llm::{EnsembleLlmBase, EnsembleLlmBaseWithFallbacksAndCount, OutputMode};
    use rust_decimal::dec;

    fn make_llm(model: &str, count: u64) -> EnsembleLlmBaseWithFallbacksAndCount {
        EnsembleLlmBaseWithFallbacksAndCount {
            count,
            inner: EnsembleLlmBase {
                model: model.to_string(),
                output_mode: OutputMode::Instruction,
                ..Default::default()
            },
            fallbacks: None,
        }
    }

    #[test]
    fn filter_removes_count_zero_llms_and_profile_entries() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("openai/gpt-4o-mini", 0), // should be filtered
                make_llm("anthropic/claude-3.5-sonnet", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(0.6), invert: None },
            ProfileEntry { weight: dec!(0.9), invert: None }, // should be filtered
            ProfileEntry { weight: dec!(0.4), invert: None },
        ]);

        let (ensemble, aligned) = Ensemble::try_from_with_profile(base, profile).unwrap();
        assert_eq!(ensemble.llms.len(), 2);
        let pairs = aligned.to_weights_and_invert();
        assert_eq!(pairs.len(), 2);
        // The two remaining weights should be 0.6 and 0.4 (possibly reordered by sort)
        let weights: Vec<Decimal> = pairs.iter().map(|(w, _)| *w).collect();
        assert!(weights.contains(&dec!(0.6)));
        assert!(weights.contains(&dec!(0.4)));
    }

    #[test]
    fn merge_duplicates_with_weighted_average() {
        // Two identical LLMs: count 3 weight 1.0, count 1 weight 0.5
        // Merged weight = (1.0 * 3 + 0.5 * 1) / (3 + 1) = 3.5 / 4 = 0.875
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 3),
                make_llm("openai/gpt-4o", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(1.0), invert: None },
            ProfileEntry { weight: dec!(0.5), invert: None },
        ]);

        let (ensemble, aligned) = Ensemble::try_from_with_profile(base, profile).unwrap();
        assert_eq!(ensemble.llms.len(), 1);
        assert_eq!(ensemble.llms[0].count, 4);
        let pairs = aligned.to_weights_and_invert();
        assert_eq!(pairs.len(), 1);
        assert_eq!(pairs[0].0, dec!(0.875));
        assert_eq!(pairs[0].1, false);
    }

    #[test]
    fn sort_reorders_profile_entries() {
        // Put two different LLMs in; verify profile entries follow the LLMs after sort
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("anthropic/claude-3.5-sonnet", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(0.7), invert: None },
            ProfileEntry { weight: dec!(0.3), invert: Some(true) },
        ]);

        let (ensemble, aligned) = Ensemble::try_from_with_profile(base, profile).unwrap();
        let pairs = aligned.to_weights_and_invert();
        assert_eq!(ensemble.llms.len(), 2);

        // Sorted by full_id (content-addressed hash), not model name.
        // Verify that the profile entry with weight 0.7 follows the openai LLM
        // and the entry with weight 0.3 follows the anthropic LLM.
        for (i, llm) in ensemble.llms.iter().enumerate() {
            if llm.inner.base.model == "openai/gpt-4o" {
                assert_eq!(pairs[i].0, dec!(0.7));
                assert_eq!(pairs[i].1, false);
            } else {
                assert_eq!(llm.inner.base.model, "anthropic/claude-3.5-sonnet");
                assert_eq!(pairs[i].0, dec!(0.3));
                assert_eq!(pairs[i].1, true);
            }
        }
    }

    #[test]
    fn combined_filter_merge_sort() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 2),
                make_llm("anthropic/claude-3.5-sonnet", 0), // filtered
                make_llm("openai/gpt-4o", 2),               // merged with first
                make_llm("google/gemini-2.0-flash", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(0.8), invert: None },
            ProfileEntry { weight: dec!(0.5), invert: None }, // filtered
            ProfileEntry { weight: dec!(0.4), invert: None }, // merged: (0.8*2 + 0.4*2)/4 = 0.6
            ProfileEntry { weight: dec!(0.9), invert: None },
        ]);

        let (ensemble, aligned) = Ensemble::try_from_with_profile(base, profile).unwrap();
        assert_eq!(ensemble.llms.len(), 2);
        let pairs = aligned.to_weights_and_invert();
        assert_eq!(pairs.len(), 2);

        // google sorts before openai
        assert!(ensemble.llms[0].inner.base.model.starts_with("google"));
        assert!(ensemble.llms[1].inner.base.model.starts_with("openai"));
        assert_eq!(pairs[0].0, dec!(0.9)); // google weight
        assert_eq!(pairs[1].0, dec!(0.6)); // merged openai weight
    }

    #[test]
    fn error_on_conflicting_invert_flags() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("openai/gpt-4o", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(0.5), invert: None },
            ProfileEntry { weight: dec!(0.5), invert: Some(true) },
        ]);

        let result = Ensemble::try_from_with_profile(base, profile);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("conflicting invert flags"));
    }

    #[test]
    fn error_on_profile_length_mismatch() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("anthropic/claude-3.5-sonnet", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(0.5), invert: None },
        ]);

        let result = Ensemble::try_from_with_profile(base, profile);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not match"));
    }

    #[test]
    fn legacy_weights_format() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("anthropic/claude-3.5-sonnet", 1),
            ],
        };
        let profile = Profile::Weights(vec![dec!(0.7), dec!(0.3)]);

        let (ensemble, aligned) = Ensemble::try_from_with_profile(base, profile).unwrap();
        assert_eq!(ensemble.llms.len(), 2);
        let pairs = aligned.to_weights_and_invert();
        assert_eq!(pairs.len(), 2);
        // All inverts should be false for Weights format
        assert_eq!(pairs[0].1, false);
        assert_eq!(pairs[1].1, false);
    }

    #[test]
    fn produces_same_ensemble_id_as_try_from() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 2),
                make_llm("anthropic/claude-3.5-sonnet", 1),
                make_llm("openai/gpt-4o", 1), // duplicate, will be merged
            ],
        };
        let profile = Profile::Weights(vec![dec!(0.5), dec!(0.5), dec!(0.5)]);

        let ensemble_from_try: Ensemble = base.clone().try_into().unwrap();
        let (ensemble_with_profile, _) =
            Ensemble::try_from_with_profile(base, profile).unwrap();

        assert_eq!(ensemble_from_try.id, ensemble_with_profile.id);
        assert_eq!(ensemble_from_try.llms.len(), ensemble_with_profile.llms.len());
        for (a, b) in ensemble_from_try.llms.iter().zip(ensemble_with_profile.llms.iter()) {
            assert_eq!(a.count, b.count);
            assert_eq!(a.full_id(), b.full_id());
        }
    }

    // ---- Parity tests: TryFrom and try_from_with_profile must always produce
    //      identical ensembles (same id, same llm order, same counts). ----

    /// Helper: assert that TryFrom<EnsembleBase> and try_from_with_profile
    /// produce identical ensembles for the given base.
    fn assert_parity(base: EnsembleBase) {
        let n = base.llms.len();
        // uniform weights so profile is always valid
        let profile = Profile::Weights(vec![dec!(0.5); n]);

        let ensemble_try: Ensemble = base.clone().try_into().unwrap();
        let (ensemble_wp, _) =
            Ensemble::try_from_with_profile(base, profile).unwrap();

        assert_eq!(ensemble_try.id, ensemble_wp.id,
            "IDs differ: try_from={}, with_profile={}", ensemble_try.id, ensemble_wp.id);
        assert_eq!(ensemble_try.llms.len(), ensemble_wp.llms.len(),
            "LLM count differs");
        for (a, b) in ensemble_try.llms.iter().zip(ensemble_wp.llms.iter()) {
            assert_eq!(a.count, b.count, "count differs for full_id {}", a.full_id());
            assert_eq!(a.full_id(), b.full_id(), "full_id differs");
            assert_eq!(a.inner.base.model, b.inner.base.model, "model differs");
        }
    }

    #[test]
    fn parity_single_llm() {
        assert_parity(EnsembleBase {
            llms: vec![make_llm("openai/gpt-4o", 1)],
        });
    }

    #[test]
    fn parity_two_distinct_llms() {
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("anthropic/claude-3.5-sonnet", 1),
            ],
        });
    }

    #[test]
    fn parity_many_distinct_models() {
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("anthropic/claude-3.5-sonnet", 2),
                make_llm("google/gemini-2.0-flash", 1),
                make_llm("meta/llama-3-70b", 3),
                make_llm("mistral/mixtral-8x7b", 1),
            ],
        });
    }

    #[test]
    fn parity_all_same_model_merged() {
        // 4 entries for the same model → merged into 1 with count=10
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 3),
                make_llm("openai/gpt-4o", 2),
                make_llm("openai/gpt-4o", 4),
                make_llm("openai/gpt-4o", 1),
            ],
        });
    }

    #[test]
    fn parity_with_count_zero_filtered() {
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 0),       // filtered
                make_llm("anthropic/claude-3.5-sonnet", 1),
                make_llm("google/gemini-2.0-flash", 0), // filtered
                make_llm("meta/llama-3-70b", 2),
            ],
        });
    }

    #[test]
    fn parity_interleaved_duplicates_and_zeros() {
        // Mix of count-0 filtering and duplicate merging
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 2),
                make_llm("anthropic/claude-3.5-sonnet", 0), // filtered
                make_llm("openai/gpt-4o", 3),               // merged → count 5
                make_llm("google/gemini-2.0-flash", 1),
                make_llm("google/gemini-2.0-flash", 0),     // filtered (count 0)
                make_llm("meta/llama-3-70b", 1),
                make_llm("openai/gpt-4o", 1),               // merged → count 6
            ],
        });
    }

    #[test]
    fn parity_different_output_modes_are_distinct() {
        // Same model but different output_mode → different full_id, not merged
        let base = EnsembleBase {
            llms: vec![
                EnsembleLlmBaseWithFallbacksAndCount {
                    count: 1,
                    inner: EnsembleLlmBase {
                        model: "openai/gpt-4o".to_string(),
                        output_mode: OutputMode::Instruction,
                        ..Default::default()
                    },
                    fallbacks: None,
                },
                EnsembleLlmBaseWithFallbacksAndCount {
                    count: 1,
                    inner: EnsembleLlmBase {
                        model: "openai/gpt-4o".to_string(),
                        output_mode: OutputMode::JsonSchema,
                        ..Default::default()
                    },
                    fallbacks: None,
                },
            ],
        };
        assert_parity(base);
    }

    #[test]
    fn parity_different_temperatures_are_distinct() {
        let base = EnsembleBase {
            llms: vec![
                EnsembleLlmBaseWithFallbacksAndCount {
                    count: 1,
                    inner: EnsembleLlmBase {
                        model: "openai/gpt-4o".to_string(),
                        temperature: Some(0.0),
                        ..Default::default()
                    },
                    fallbacks: None,
                },
                EnsembleLlmBaseWithFallbacksAndCount {
                    count: 1,
                    inner: EnsembleLlmBase {
                        model: "openai/gpt-4o".to_string(),
                        temperature: Some(1.5),
                        ..Default::default()
                    },
                    fallbacks: None,
                },
            ],
        };
        assert_parity(base);
    }

    #[test]
    fn parity_with_fallbacks() {
        let base = EnsembleBase {
            llms: vec![
                EnsembleLlmBaseWithFallbacksAndCount {
                    count: 2,
                    inner: EnsembleLlmBase {
                        model: "openai/gpt-4o".to_string(),
                        ..Default::default()
                    },
                    fallbacks: Some(vec![EnsembleLlmBase {
                        model: "openai/gpt-4o-mini".to_string(),
                        ..Default::default()
                    }]),
                },
                make_llm("anthropic/claude-3.5-sonnet", 1),
            ],
        };
        assert_parity(base);
    }

    #[test]
    fn parity_duplicate_llms_with_fallbacks_merged() {
        // Two entries with same primary+fallback config → should merge
        let make_with_fallback = || EnsembleLlmBaseWithFallbacksAndCount {
            count: 2,
            inner: EnsembleLlmBase {
                model: "openai/gpt-4o".to_string(),
                ..Default::default()
            },
            fallbacks: Some(vec![EnsembleLlmBase {
                model: "openai/gpt-4o-mini".to_string(),
                ..Default::default()
            }]),
        };
        assert_parity(EnsembleBase {
            llms: vec![make_with_fallback(), make_with_fallback()],
        });
    }

    #[test]
    fn parity_high_count() {
        // Max total count is 128
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 64),
                make_llm("anthropic/claude-3.5-sonnet", 64),
            ],
        });
    }

    #[test]
    fn parity_single_llm_high_count() {
        assert_parity(EnsembleBase {
            llms: vec![make_llm("openai/gpt-4o", 128)],
        });
    }

    #[test]
    fn parity_many_duplicates_merged_to_one() {
        // 10 identical entries of count 1 → merged to count 10
        assert_parity(EnsembleBase {
            llms: (0..10).map(|_| make_llm("openai/gpt-4o", 1)).collect(),
        });
    }

    #[test]
    fn parity_reverse_input_order() {
        // Verify that swapping input order still produces the same ensemble
        let base_a = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 1),
                make_llm("anthropic/claude-3.5-sonnet", 2),
                make_llm("google/gemini-2.0-flash", 3),
            ],
        };
        let base_b = EnsembleBase {
            llms: vec![
                make_llm("google/gemini-2.0-flash", 3),
                make_llm("anthropic/claude-3.5-sonnet", 2),
                make_llm("openai/gpt-4o", 1),
            ],
        };

        let try_a: Ensemble = base_a.clone().try_into().unwrap();
        let try_b: Ensemble = base_b.clone().try_into().unwrap();
        assert_eq!(try_a.id, try_b.id, "TryFrom should be order-independent");

        let profile_a = Profile::Weights(vec![dec!(0.5); 3]);
        let profile_b = Profile::Weights(vec![dec!(0.5); 3]);
        let (wp_a, _) = Ensemble::try_from_with_profile(base_a, profile_a).unwrap();
        let (wp_b, _) = Ensemble::try_from_with_profile(base_b, profile_b).unwrap();
        assert_eq!(wp_a.id, wp_b.id, "with_profile should be order-independent");
        assert_eq!(try_a.id, wp_a.id, "TryFrom and with_profile should match");
    }

    #[test]
    fn parity_entries_profile_format() {
        // Use Entries format (not Weights) and verify parity
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 2),
                make_llm("anthropic/claude-3.5-sonnet", 1),
                make_llm("openai/gpt-4o", 1),
            ],
        };
        let profile = Profile::Entries(vec![
            ProfileEntry { weight: dec!(0.8), invert: Some(true) },
            ProfileEntry { weight: dec!(0.3), invert: None },
            ProfileEntry { weight: dec!(0.2), invert: Some(true) },
        ]);

        let ensemble_try: Ensemble = base.clone().try_into().unwrap();
        let (ensemble_wp, _) =
            Ensemble::try_from_with_profile(base, profile).unwrap();

        assert_eq!(ensemble_try.id, ensemble_wp.id);
        assert_eq!(ensemble_try.llms.len(), ensemble_wp.llms.len());
        for (a, b) in ensemble_try.llms.iter().zip(ensemble_wp.llms.iter()) {
            assert_eq!(a.count, b.count);
            assert_eq!(a.full_id(), b.full_id());
        }
    }

    #[test]
    fn parity_all_but_one_filtered() {
        // All count-0 except one → should produce single-LLM ensemble
        assert_parity(EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 0),
                make_llm("anthropic/claude-3.5-sonnet", 0),
                make_llm("google/gemini-2.0-flash", 0),
                make_llm("meta/llama-3-70b", 1),
            ],
        });
    }

    #[test]
    fn parity_both_error_on_all_zero_counts() {
        let base = EnsembleBase {
            llms: vec![
                make_llm("openai/gpt-4o", 0),
                make_llm("anthropic/claude-3.5-sonnet", 0),
            ],
        };
        let profile = Profile::Weights(vec![dec!(0.5), dec!(0.5)]);

        let try_result: Result<Ensemble, _> = base.clone().try_into();
        let wp_result = Ensemble::try_from_with_profile(base, profile);

        assert!(try_result.is_err(), "TryFrom should error on all-zero counts");
        assert!(wp_result.is_err(), "with_profile should error on all-zero counts");
    }
}
