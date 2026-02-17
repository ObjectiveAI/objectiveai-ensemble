# Quality Checkers

## Rules

1. **One `generate()` call per checker.** Each checker must call `example_inputs::generate()` exactly once. Never collect the iterator into a Vec — stream through it.

2. **No test helpers.** In test files, always write the full `RemoteFunction` and `InputSchema` inline in each test function. Never define shared builder functions, helper constructors, or fixture factories.

3. **`compile_and_validate.rs` is minimal.** It only contains `compile_and_validate_one_input` (pub(super)) and its private dependencies. All iterating/looping logic belongs in each checker, not here.

4. **Error codes.** Every error string must start with a unique 4-char code: 2-letter prefix (LS/LV/BS/BV/VF/CV/QD) + 2-digit number. Never reuse codes.

5. **`min_items` in tests.** Vector function tests must use `min_items: Some(2)` (not higher) so that merged subset validation doesn't violate schema constraints.
