use crate::functions::expression::{Input, InputSchema};

type Rng = rand::rngs::ThreadRng;

pub fn generate(schema: &InputSchema) -> Generator {
    let rng = rand::rng();
    match schema {
        InputSchema::Boolean(s) => {
            Generator::Boolean(super::boolean::generate(s, rng))
        }
        InputSchema::String(s) => {
            Generator::String(super::string::generate(s, rng))
        }
        InputSchema::Integer(s) => {
            Generator::Integer(super::integer::generate(s, rng))
        }
        InputSchema::Number(s) => {
            Generator::Number(super::number::generate(s, rng))
        }
        InputSchema::Image(s) => {
            Generator::Image(super::image::generate(s, rng))
        }
        InputSchema::Audio(s) => {
            Generator::Audio(super::audio::generate(s, rng))
        }
        InputSchema::Video(s) => {
            Generator::Video(super::video::generate(s, rng))
        }
        InputSchema::File(s) => {
            Generator::File(super::file::generate(s, rng))
        }
        InputSchema::Object(s) => {
            Generator::Object(super::object::generate(s, rng))
        }
        InputSchema::Array(s) => {
            Generator::Array(super::array::generate(s, rng))
        }
        InputSchema::AnyOf(s) => {
            Generator::AnyOf(super::any_of::generate(s, rng))
        }
    }
}

pub enum Generator {
    Boolean(super::boolean::Generator<Rng>),
    String(super::string::Generator<Rng>),
    Integer(super::integer::Generator<Rng>),
    Number(super::number::Generator<Rng>),
    Image(super::image::Generator<Rng>),
    Audio(super::audio::Generator<Rng>),
    Video(super::video::Generator<Rng>),
    File(super::file::Generator<Rng>),
    Object(super::object::Generator<Rng>),
    Array(super::array::Generator<Rng>),
    AnyOf(super::any_of::Generator<Rng>),
}

impl Iterator for Generator {
    type Item = Input;
    fn next(&mut self) -> Option<Input> {
        match self {
            Generator::Boolean(g) => g.next(),
            Generator::String(g) => g.next(),
            Generator::Integer(g) => g.next(),
            Generator::Number(g) => g.next(),
            Generator::Image(g) => g.next(),
            Generator::Audio(g) => g.next(),
            Generator::Video(g) => g.next(),
            Generator::File(g) => g.next(),
            Generator::Object(g) => g.next(),
            Generator::Array(g) => g.next(),
            Generator::AnyOf(g) => g.next(),
        }
    }
}
