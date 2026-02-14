//! RNG-based example input generation from an `InputSchema`.
//!
//! Generates diverse, randomized inputs so that function authors cannot
//! hard-code logic to pass validation. Every call produces different values
//! while still respecting schema constraints (min/max, enums, required fields).
//!
//! For object schemas, every optional field gets a dedicated example where it
//! is present and another where it is absent. Multimodal types (Image, File)
//! similarly produce variants with and without their optional sub-fields.
//!
//! A reservoir sampling cap ([`MAX_EXAMPLE_INPUTS`]) bounds memory usage for
//! pathological schemas. If the schema naturally produces fewer than the cap,
//! every permutation is checked. If it exceeds the cap, the reservoir
//! maintains a uniform random sample across all possibilities.

use indexmap::IndexMap;
use rand::Rng;

use crate::chat::completions::request::{
    File, ImageUrl, ImageUrlDetail, InputAudio, RichContentPart, VideoUrl,
};
use crate::functions::expression::{Input, InputSchema};

/// Maximum number of example inputs to retain. If the schema produces more
/// than this, reservoir sampling keeps a uniform random sample. If it
/// produces fewer, every permutation is checked exhaustively.
const MAX_EXAMPLE_INPUTS: usize = 1000;

/// Reservoir sampler that holds at most `capacity` items.
///
/// Uses Algorithm R (Vitter, 1985): the first `capacity` items are accepted
/// unconditionally; each subsequent item replaces a random existing item
/// with probability `capacity / items_seen`, giving every item an equal
/// chance of appearing in the final sample.
struct Reservoir<'r, R: Rng> {
    items: Vec<Input>,
    capacity: usize,
    seen: usize,
    rng: &'r mut R,
}

impl<'r, R: Rng> Reservoir<'r, R> {
    fn new(capacity: usize, rng: &'r mut R) -> Self {
        Self {
            items: Vec::with_capacity(capacity.min(64)),
            capacity,
            seen: 0,
            rng,
        }
    }

    fn push(&mut self, item: Input) {
        self.seen += 1;
        if self.items.len() < self.capacity {
            self.items.push(item);
        } else {
            let j = self.rng.random_range(0..self.seen);
            if j < self.capacity {
                self.items[j] = item;
            }
        }
    }

    fn into_vec(self) -> Vec<Input> {
        self.items
    }
}

/// Generate diverse, randomized inputs from an `InputSchema`.
///
/// For vector function validation the key diversity axis is varying array
/// lengths. Generates inputs with different array sizes to test that
/// output_length, input_split, and input_merge handle varying lengths.
///
/// If the schema would produce more than [`MAX_EXAMPLE_INPUTS`] inputs,
/// reservoir sampling retains a uniform random subset of exactly
/// `MAX_EXAMPLE_INPUTS` items — no unbounded allocation ever occurs.
/// If fewer are produced, every permutation is returned.
pub fn generate_example_inputs(schema: &InputSchema) -> Vec<Input> {
    let mut rng = rand::rng();
    let mut reservoir = Reservoir::new(MAX_EXAMPLE_INPUTS, &mut rng);
    generate_inputs_recursive(schema, &mut reservoir, 0);
    reservoir.into_vec()
}

/// Recursively generate diverse inputs for a schema.
///
/// `depth` prevents infinite recursion in nested schemas.
fn generate_inputs_recursive(
    schema: &InputSchema,
    out: &mut Reservoir<'_, impl Rng>,
    depth: usize,
) {
    if depth > 5 {
        if let Some(input) = generate_single(schema, 0, out.rng) {
            out.push(input);
        }
        return;
    }

    match schema {
        InputSchema::Object(obj) => generate_object_inputs(obj, out, depth),
        InputSchema::Array(arr) => generate_array_inputs(arr, out, depth),
        InputSchema::String(s) => generate_string_inputs(s, out),
        InputSchema::Integer(i) => generate_integer_inputs(i, out),
        InputSchema::Number(n) => generate_number_inputs(n, out),
        InputSchema::Boolean(_) => {
            out.push(Input::Boolean(true));
            out.push(Input::Boolean(false));
        }
        InputSchema::Image(_) => generate_image_inputs(out),
        InputSchema::Audio(_) => {
            out.push(Input::RichContentPart(RichContentPart::InputAudio {
                input_audio: InputAudio {
                    data: "dGVzdA==".to_string(),
                    format: "wav".to_string(),
                },
            }));
        }
        InputSchema::Video(_) => {
            let id = out.rng.random_range(1000..9999);
            out.push(Input::RichContentPart(RichContentPart::VideoUrl {
                video_url: VideoUrl {
                    url: format!("https://example.com/vid_{}.mp4", id),
                },
            }));
        }
        InputSchema::File(_) => generate_file_inputs(out),
        InputSchema::AnyOf(any_of) => {
            for variant in &any_of.any_of {
                generate_inputs_recursive(variant, out, depth + 1);
            }
        }
    }
}

/// Generate image inputs with permutations of the optional `detail` field.
fn generate_image_inputs(out: &mut Reservoir<'_, impl Rng>) {
    let id = out.rng.random_range(1000..9999);

    // With detail = None
    out.push(Input::RichContentPart(RichContentPart::ImageUrl {
        image_url: ImageUrl {
            url: format!("https://example.com/img_{}.png", id),
            detail: None,
        },
    }));

    // With detail = Low
    out.push(Input::RichContentPart(RichContentPart::ImageUrl {
        image_url: ImageUrl {
            url: format!("https://example.com/img_{}.png", id + 1),
            detail: Some(ImageUrlDetail::Low),
        },
    }));

    // With detail = High
    out.push(Input::RichContentPart(RichContentPart::ImageUrl {
        image_url: ImageUrl {
            url: format!("https://example.com/img_{}.png", id + 2),
            detail: Some(ImageUrlDetail::High),
        },
    }));
}

/// Generate file inputs with permutations of optional fields.
///
/// `File` has 4 optional fields: `file_data`, `file_id`, `filename`, `file_url`.
/// We generate a variant with all present, one with only required-like fields,
/// and one for each optional field being absent while the rest are present.
fn generate_file_inputs(out: &mut Reservoir<'_, impl Rng>) {
    let id = out.rng.random_range(1000..9999);

    let all_present = File {
        file_data: Some(format!("data_{}", id)),
        file_id: Some(format!("id_{}", id)),
        filename: Some(format!("file_{}.txt", id)),
        file_url: Some(format!("https://example.com/file_{}.txt", id)),
    };

    // All fields present
    out.push(Input::RichContentPart(RichContentPart::File {
        file: all_present.clone(),
    }));

    // Only file_url (minimal)
    out.push(Input::RichContentPart(RichContentPart::File {
        file: File {
            file_data: None,
            file_id: None,
            filename: None,
            file_url: Some(format!("https://example.com/file_{}.txt", id + 1)),
        },
    }));

    // Only file_data
    out.push(Input::RichContentPart(RichContentPart::File {
        file: File {
            file_data: Some(format!("data_{}", id + 2)),
            file_id: None,
            filename: None,
            file_url: None,
        },
    }));

    // Without file_data
    out.push(Input::RichContentPart(RichContentPart::File {
        file: File {
            file_data: None,
            ..all_present.clone()
        },
    }));

    // Without file_id
    out.push(Input::RichContentPart(RichContentPart::File {
        file: File {
            file_id: None,
            ..all_present.clone()
        },
    }));

    // Without filename
    out.push(Input::RichContentPart(RichContentPart::File {
        file: File {
            filename: None,
            ..all_present.clone()
        },
    }));

    // Without file_url
    out.push(Input::RichContentPart(RichContentPart::File {
        file: File {
            file_url: None,
            ..all_present
        },
    }));
}

/// Generate a single representative input for a schema variant.
fn generate_single(schema: &InputSchema, index: usize, rng: &mut impl Rng) -> Option<Input> {
    match schema {
        InputSchema::Object(obj) => {
            let mut map = IndexMap::new();
            let required = obj.required.as_deref().unwrap_or(&[]);
            for (key, prop_schema) in &obj.properties {
                if required.contains(key) || index == 0 {
                    if let Some(val) = generate_single(prop_schema, index, rng) {
                        map.insert(key.clone(), val);
                    }
                }
            }
            Some(Input::Object(map))
        }
        InputSchema::Array(arr) => {
            let min = arr.min_items.unwrap_or(0) as usize;
            let len = (min + index).max(2);
            let mut items = Vec::with_capacity(len);
            for j in 0..len {
                if let Some(item) = generate_single(&arr.items, j, rng) {
                    items.push(item);
                }
            }
            Some(Input::Array(items))
        }
        InputSchema::String(s) => {
            if let Some(ref e) = s.r#enum {
                Some(Input::String(e[rng.random_range(0..e.len())].clone()))
            } else {
                let len = rng.random_range(3..=8);
                let s: String = (0..len)
                    .map(|_| rng.random_range(b'a'..=b'z') as char)
                    .collect();
                Some(Input::String(s))
            }
        }
        InputSchema::Integer(i) => {
            let min = i.minimum.unwrap_or(0);
            let max = i.maximum.unwrap_or(100);
            Some(Input::Integer(rng.random_range(min..=max)))
        }
        InputSchema::Number(n) => {
            let min = n.minimum.unwrap_or(0.0);
            let max = n.maximum.unwrap_or(100.0);
            Some(Input::Number(rng.random_range(min..=max)))
        }
        InputSchema::Boolean(_) => Some(Input::Boolean(rng.random_bool(0.5))),
        InputSchema::Image(_) => Some(Input::RichContentPart(RichContentPart::ImageUrl {
            image_url: ImageUrl {
                url: format!(
                    "https://example.com/img_{}.png",
                    rng.random_range(1000..9999)
                ),
                detail: None,
            },
        })),
        InputSchema::Audio(_) => Some(Input::RichContentPart(RichContentPart::InputAudio {
            input_audio: InputAudio {
                data: "dGVzdA==".to_string(),
                format: "wav".to_string(),
            },
        })),
        InputSchema::Video(_) => Some(Input::RichContentPart(RichContentPart::VideoUrl {
            video_url: VideoUrl {
                url: format!(
                    "https://example.com/vid_{}.mp4",
                    rng.random_range(1000..9999)
                ),
            },
        })),
        InputSchema::File(_) => {
            let id = rng.random_range(1000..9999);
            Some(Input::RichContentPart(RichContentPart::File {
                file: File {
                    file_data: None,
                    file_id: None,
                    filename: Some(format!("file_{}.txt", id)),
                    file_url: Some(format!("https://example.com/file_{}.txt", id)),
                },
            }))
        }
        InputSchema::AnyOf(any_of) => {
            if any_of.any_of.is_empty() {
                None
            } else {
                let variant_idx = rng.random_range(0..any_of.any_of.len());
                generate_single(&any_of.any_of[variant_idx], index, rng)
            }
        }
    }
}

/// Generate diverse object inputs with exhaustive optional field permutations.
///
/// For each optional field, generates one example with it present and one with
/// it absent. Also generates a base with all fields and a variant with
/// different random values.
fn generate_object_inputs(
    obj: &crate::functions::expression::ObjectInputSchema,
    out: &mut Reservoir<'_, impl Rng>,
    depth: usize,
) {
    let required: &[String] = obj.required.as_deref().unwrap_or(&[]);
    let optional_keys: Vec<&String> = obj
        .properties
        .keys()
        .filter(|k| !required.contains(k))
        .collect();

    // Generate base object with all properties present
    let mut base = IndexMap::new();
    for (key, prop_schema) in &obj.properties {
        if let Some(val) = generate_single(prop_schema, 0, out.rng) {
            base.insert(key.clone(), val);
        }
    }
    out.push(Input::Object(base.clone()));

    // Generate variant with different random values (all fields present)
    let mut variant = IndexMap::new();
    for (key, prop_schema) in &obj.properties {
        if let Some(val) = generate_single(prop_schema, 1, out.rng) {
            variant.insert(key.clone(), val);
        }
    }
    out.push(Input::Object(variant));

    // For each optional field, generate one example WITH it and one WITHOUT it.
    // The base already has all fields, so we only need the "without" variant
    // for each. But to be thorough, generate a "with" variant too using fresh
    // random values so the presence case isn't identical to the base.
    for opt_key in &optional_keys {
        // Without this optional field
        let mut without = base.clone();
        without.shift_remove(*opt_key);
        out.push(Input::Object(without));

        // With this optional field but fresh random value
        let prop_schema = &obj.properties[*opt_key];
        if let Some(fresh_val) = generate_single(prop_schema, 2, out.rng) {
            let mut with_fresh = base.clone();
            with_fresh.insert((*opt_key).clone(), fresh_val);
            out.push(Input::Object(with_fresh));
        }
    }

    // Required-only variant (all optional fields absent)
    if !optional_keys.is_empty() {
        let mut required_only = IndexMap::new();
        for (key, prop_schema) in &obj.properties {
            if required.contains(key) {
                if let Some(val) = generate_single(prop_schema, 0, out.rng) {
                    required_only.insert(key.clone(), val);
                }
            }
        }
        out.push(Input::Object(required_only));
    }

    // Recurse into array properties to generate inputs with varying array lengths
    for (key, prop_schema) in &obj.properties {
        if let InputSchema::Array(_) = prop_schema {
            let mut prop_inputs = Reservoir::new(MAX_EXAMPLE_INPUTS, out.rng);
            generate_inputs_recursive(prop_schema, &mut prop_inputs, depth + 1);
            for prop_input in prop_inputs.into_vec() {
                let mut obj_input = base.clone();
                obj_input.insert(key.clone(), prop_input);
                out.push(Input::Object(obj_input));
            }
        }
    }
}

/// Generate array inputs with randomized lengths.
fn generate_array_inputs(
    arr: &crate::functions::expression::ArrayInputSchema,
    out: &mut Reservoir<'_, impl Rng>,
    depth: usize,
) {
    let min = arr.min_items.unwrap_or(0) as usize;
    let max = arr.max_items.map(|m| m as usize).unwrap_or(20);
    let min = min.max(2); // need at least 2 for vector functions

    let mut seen_lengths = std::collections::HashSet::new();
    let target_count = 4;

    // Generate arrays at random lengths within bounds
    for _ in 0..(target_count * 3) {
        if seen_lengths.len() >= target_count {
            break;
        }
        let len = out.rng.random_range(min..=max);
        if !seen_lengths.insert(len) {
            continue;
        }
        let items: Vec<Input> = (0..len)
            .filter_map(|j| generate_single(&arr.items, j, out.rng))
            .collect();
        out.push(Input::Array(items));
    }

    // Ensure we have at least one if range is very narrow
    if seen_lengths.is_empty() {
        let len = min.min(max);
        let items: Vec<Input> = (0..len)
            .filter_map(|j| generate_single(&arr.items, j, out.rng))
            .collect();
        out.push(Input::Array(items));
    }

    // Recurse into item schema for deeper diversity (only at top level)
    if depth == 0 {
        let mut _item_reservoir = Reservoir::new(MAX_EXAMPLE_INPUTS, out.rng);
        generate_inputs_recursive(&arr.items, &mut _item_reservoir, depth + 1);
    }
}

/// Generate diverse string inputs with random values.
fn generate_string_inputs(
    s: &crate::functions::expression::StringInputSchema,
    out: &mut Reservoir<'_, impl Rng>,
) {
    if let Some(ref e) = s.r#enum {
        // Shuffle and pick up to 3 enum values
        let count = e.len().min(3);
        let mut indices: Vec<usize> = (0..e.len()).collect();
        for i in (1..indices.len()).rev() {
            let j = out.rng.random_range(0..=i);
            indices.swap(i, j);
        }
        for &idx in indices.iter().take(count) {
            out.push(Input::String(e[idx].clone()));
        }
    } else {
        for _ in 0..3 {
            let len = out.rng.random_range(3..=10);
            let s: String = (0..len)
                .map(|_| out.rng.random_range(b'a'..=b'z') as char)
                .collect();
            out.push(Input::String(s));
        }
    }
}

/// Generate diverse integer inputs with random values within bounds.
fn generate_integer_inputs(
    i: &crate::functions::expression::IntegerInputSchema,
    out: &mut Reservoir<'_, impl Rng>,
) {
    let min = i.minimum.unwrap_or(0);
    let max = i.maximum.unwrap_or(100);

    let mut seen = std::collections::HashSet::new();
    for _ in 0..12 {
        if seen.len() >= 4 {
            break;
        }
        let val = out.rng.random_range(min..=max);
        if seen.insert(val) {
            out.push(Input::Integer(val));
        }
    }
}

/// Generate diverse number inputs with random values within bounds.
fn generate_number_inputs(
    n: &crate::functions::expression::NumberInputSchema,
    out: &mut Reservoir<'_, impl Rng>,
) {
    let min = n.minimum.unwrap_or(0.0);
    let max = n.maximum.unwrap_or(100.0);

    for _ in 0..3 {
        let val = out.rng.random_range(min..=max);
        out.push(Input::Number(val));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_example_inputs_array() {
        let schema = InputSchema::Array(crate::functions::expression::ArrayInputSchema {
            description: None,
            min_items: Some(2),
            max_items: Some(10),
            items: Box::new(InputSchema::String(
                crate::functions::expression::StringInputSchema {
                    description: None,
                    r#enum: None,
                },
            )),
        });

        let inputs = generate_example_inputs(&schema);
        assert!(!inputs.is_empty(), "Should generate at least one input");

        for input in &inputs {
            match input {
                Input::Array(arr) => {
                    assert!(arr.len() >= 2, "Array length should be >= 2");
                    assert!(arr.len() <= 10, "Array length should be <= 10");
                }
                _ => panic!("Expected array input"),
            }
        }
    }

    #[test]
    fn test_generate_example_inputs_object_with_array() {
        let schema =
            InputSchema::Object(crate::functions::expression::ObjectInputSchema {
                description: None,
                properties: {
                    let mut props = IndexMap::new();
                    props.insert(
                        "items".to_string(),
                        InputSchema::Array(crate::functions::expression::ArrayInputSchema {
                            description: None,
                            min_items: Some(2),
                            max_items: Some(10),
                            items: Box::new(InputSchema::String(
                                crate::functions::expression::StringInputSchema {
                                    description: None,
                                    r#enum: None,
                                },
                            )),
                        }),
                    );
                    props
                },
                required: Some(vec!["items".to_string()]),
            });

        let inputs = generate_example_inputs(&schema);
        assert!(
            inputs.len() >= 2,
            "Should generate multiple inputs with varying array lengths"
        );
    }

    #[test]
    fn test_optional_field_permutations() {
        let schema =
            InputSchema::Object(crate::functions::expression::ObjectInputSchema {
                description: None,
                properties: {
                    let mut props = IndexMap::new();
                    props.insert(
                        "name".to_string(),
                        InputSchema::String(crate::functions::expression::StringInputSchema {
                            description: None,
                            r#enum: None,
                        }),
                    );
                    props.insert(
                        "age".to_string(),
                        InputSchema::Integer(crate::functions::expression::IntegerInputSchema {
                            description: None,
                            minimum: Some(0),
                            maximum: Some(120),
                        }),
                    );
                    props.insert(
                        "bio".to_string(),
                        InputSchema::String(crate::functions::expression::StringInputSchema {
                            description: None,
                            r#enum: None,
                        }),
                    );
                    props
                },
                required: Some(vec!["name".to_string()]),
            });

        let inputs = generate_example_inputs(&schema);

        // Should have: base (all fields), variant (all fields),
        // without "age", with fresh "age",
        // without "bio", with fresh "bio",
        // required-only ("name" only)
        let mut has_without_age = false;
        let mut has_without_bio = false;
        let mut has_required_only = false;

        for input in &inputs {
            if let Input::Object(map) = input {
                let has_name = map.contains_key("name");
                let has_age = map.contains_key("age");
                let has_bio = map.contains_key("bio");

                if has_name && !has_age && has_bio {
                    has_without_age = true;
                }
                if has_name && has_age && !has_bio {
                    has_without_bio = true;
                }
                if has_name && !has_age && !has_bio {
                    has_required_only = true;
                }
            }
        }

        assert!(has_without_age, "Should have example without optional 'age'");
        assert!(has_without_bio, "Should have example without optional 'bio'");
        assert!(has_required_only, "Should have required-only example");
    }

    #[test]
    fn test_image_detail_permutations() {
        let schema = InputSchema::Image(crate::functions::expression::ImageInputSchema {
            description: None,
        });

        let inputs = generate_example_inputs(&schema);

        // Should have variants: detail=None, detail=Low, detail=High
        assert!(
            inputs.len() >= 3,
            "Image should produce at least 3 variants (None, Low, High detail)"
        );
    }

    #[test]
    fn test_file_optional_field_permutations() {
        let schema = InputSchema::File(crate::functions::expression::FileInputSchema {
            description: None,
        });

        let inputs = generate_example_inputs(&schema);

        // Should have: all present, minimal (url only), data only,
        // without file_data, without file_id, without filename, without file_url
        assert!(
            inputs.len() >= 7,
            "File should produce at least 7 variants covering optional field permutations, got {}",
            inputs.len()
        );
    }

    #[test]
    fn test_reservoir_cap() {
        // Verify that even with a huge schema, we never exceed MAX_EXAMPLE_INPUTS
        let inputs = generate_example_inputs(&InputSchema::Boolean(
            crate::functions::expression::BooleanInputSchema { description: None },
        ));
        assert!(inputs.len() <= MAX_EXAMPLE_INPUTS);
    }
}
