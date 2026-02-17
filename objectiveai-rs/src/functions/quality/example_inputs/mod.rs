pub mod any_of;
pub mod array;
pub mod audio;
pub mod boolean;
pub mod file;
pub mod image;
pub mod integer;
pub mod multi;
pub mod number;
pub mod object;
pub mod optional;
pub mod string;
pub mod video;

#[cfg(test)]
mod array_tests;
#[cfg(test)]
mod tests;

use crate::functions::expression::{Input, InputSchema};

pub fn permutations(schema: &InputSchema) -> usize {
    optional::inner_permutations(schema)
}

pub fn generate(schema: &InputSchema) -> Generator {
    let perms = permutations(schema);
    Generator {
        inner: multi::generate(schema),
        remaining: perms,
    }
}

pub struct Generator {
    inner: multi::Generator,
    remaining: usize,
}

impl Iterator for Generator {
    type Item = Input;
    fn next(&mut self) -> Option<Input> {
        if self.remaining == 0 {
            return None;
        }
        self.remaining -= 1;
        self.inner.next()
    }
}
