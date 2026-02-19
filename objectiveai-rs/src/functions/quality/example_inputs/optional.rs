use rand::Rng;
use rand::seq::SliceRandom;

use crate::functions::expression::{Input, InputSchema};

pub fn permutations(schema: &InputSchema) -> usize {
    inner_permutations(schema) * 2
}

pub fn inner_permutations(schema: &InputSchema) -> usize {
    match schema {
        InputSchema::Boolean(s) => super::boolean::permutations(s),
        InputSchema::String(s) => super::string::permutations(s),
        InputSchema::Integer(s) => super::integer::permutations(s),
        InputSchema::Number(s) => super::number::permutations(s),
        InputSchema::Image(s) => super::image::permutations(s),
        InputSchema::Audio(s) => super::audio::permutations(s),
        InputSchema::Video(s) => super::video::permutations(s),
        InputSchema::File(s) => super::file::permutations(s),
        InputSchema::Object(s) => super::object::permutations(s),
        InputSchema::Array(s) => super::array::permutations(s),
        InputSchema::AnyOf(s) => super::any_of::permutations(s),
    }
}

pub fn generate<R: Rng>(schema: &InputSchema, mut rng: R) -> Generator<R> {
    let inner_count = inner_permutations(schema);
    // 0..inner_count = present, inner_count..inner_count*2 = absent
    let total = inner_count * 2;
    let mut indices: Vec<usize> = (0..total).collect();
    indices.shuffle(&mut rng);

    let inner = super::multi::generate(schema);

    Generator {
        inner,
        inner_count,
        indices,
        pos: 0,
        rng,
    }
}

pub struct Generator<R: Rng> {
    inner: super::multi::Generator,
    inner_count: usize,
    indices: Vec<usize>,
    pos: usize,
    rng: R,
}

impl<R: Rng> Iterator for Generator<R> {
    type Item = Option<Input>;
    fn next(&mut self) -> Option<Option<Input>> {
        if self.indices.is_empty() {
            return Some(None);
        }
        if self.pos >= self.indices.len() {
            self.indices.shuffle(&mut self.rng);
            self.pos = 0;
        }
        let index = self.indices[self.pos];
        self.pos += 1;
        if index < self.inner_count {
            Some(self.inner.next())
        } else {
            Some(None)
        }
    }
}
