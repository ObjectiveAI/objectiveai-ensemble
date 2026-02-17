use indexmap::IndexMap;
use rand::Rng;

use crate::functions::expression::{Input, InputSchema, ObjectInputSchema};

pub fn permutations(schema: &ObjectInputSchema) -> usize {
    let required = schema.required.as_deref().unwrap_or(&[]);
    schema
        .properties
        .iter()
        .map(|(key, prop)| {
            if required.contains(key) {
                super::optional::inner_permutations(prop)
            } else {
                super::optional::permutations(prop)
            }
        })
        .max()
        .unwrap_or(1)
}

pub fn generate<R: Rng>(schema: &ObjectInputSchema, _rng: R) -> Generator<R> {
    let required = schema.required.as_deref().unwrap_or(&[]);

    let fields: Vec<FieldSlot> = schema
        .properties
        .iter()
        .map(|(key, prop)| {
            let is_optional = !required.contains(key);
            let source = make_field_source(prop, is_optional);
            FieldSlot {
                name: key.clone(),
                source,
            }
        })
        .collect();

    Generator { fields, _rng }
}

struct FieldSlot {
    name: String,
    source: FieldSource,
}

enum FieldSource {
    Required(super::multi::Generator),
    Optional(super::optional::Generator<rand::rngs::ThreadRng>),
}

impl FieldSource {
    fn advance(&mut self) -> Option<Input> {
        match self {
            FieldSource::Required(iter) => Some(iter.next().unwrap()),
            FieldSource::Optional(iter) => iter.next().unwrap(),
        }
    }
}

fn make_field_source(schema: &InputSchema, is_optional: bool) -> FieldSource {
    if is_optional {
        FieldSource::Optional(super::optional::generate(schema, rand::rng()))
    } else {
        FieldSource::Required(super::multi::generate(schema))
    }
}

pub struct Generator<R: Rng> {
    fields: Vec<FieldSlot>,
    _rng: R,
}

impl<R: Rng> Iterator for Generator<R> {
    type Item = Input;
    fn next(&mut self) -> Option<Input> {
        if self.fields.is_empty() {
            return Some(Input::Object(IndexMap::new()));
        }

        // Build object: advance each field's iterator
        let mut map = IndexMap::new();
        for field in &mut self.fields {
            let value = field.source.advance();
            if let Some(v) = value {
                map.insert(field.name.clone(), v);
            }
        }
        let result = Input::Object(map);

        Some(result)
    }
}
