import { validateVectorFields as wasmValidateVectorFields } from "../../wasm/loader.js";
import { VectorFieldsValidation } from "./vectorFields.js";

/**
 * Validates that a vector function's output_length, input_split, and
 * input_merge expressions work correctly together.
 *
 * Generates diverse, randomized example inputs from the input_schema and
 * performs round-trip testing: split → merge → compare. Throws a descriptive
 * error string on failure.
 */
export function checkVectorFields(fields: VectorFieldsValidation): void {
  wasmValidateVectorFields(fields);
}
