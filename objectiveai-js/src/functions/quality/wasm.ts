import {
  qualityCheckVectorFields as wasmQualityCheckVectorFields,
  qualityCheckLeafFunction as wasmQualityCheckLeafFunction,
  qualityCheckBranchFunction as wasmQualityCheckBranchFunction,
  qualityCheckLeafScalarFunction as wasmQualityCheckLeafScalarFunction,
  qualityCheckLeafVectorFunction as wasmQualityCheckLeafVectorFunction,
  qualityCheckBranchScalarFunction as wasmQualityCheckBranchScalarFunction,
  qualityCheckBranchVectorFunction as wasmQualityCheckBranchVectorFunction,
} from "../../wasm/loader.js";
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
  wasmQualityCheckVectorFields(fields);
}

/**
 * Quality check for a leaf function (depth 0).
 *
 * Routes to leaf scalar or leaf vector checks based on the function type.
 * Leaf functions contain only vector.completion tasks.
 * Throws a descriptive error string on failure.
 */
export function checkLeafFunction(func: unknown): void {
  wasmQualityCheckLeafFunction(func);
}

/**
 * Quality check for a branch function (depth > 0).
 *
 * Routes to branch scalar or branch vector checks based on the function type.
 * Branch functions contain only function/placeholder tasks.
 * Throws a descriptive error string on failure.
 */
export function checkBranchFunction(func: unknown): void {
  wasmQualityCheckBranchFunction(func);
}

/**
 * Quality check for a leaf scalar function (depth 0, scalar output).
 *
 * Validates: no input_maps, only vector.completion tasks, no map,
 * content parts (not plain strings), messages >= 1, responses >= 2.
 * Throws a descriptive error string on failure.
 */
export function checkLeafScalarFunction(func: unknown): void {
  wasmQualityCheckLeafScalarFunction(func);
}

/**
 * Quality check for a leaf vector function (depth 0, vector output).
 *
 * Validates: vector input schema, only vector.completion tasks, no map,
 * content parts, vector field round-trip (output_length/input_split/input_merge).
 * Throws a descriptive error string on failure.
 */
export function checkLeafVectorFunction(func: unknown): void {
  wasmQualityCheckLeafVectorFunction(func);
}

/**
 * Quality check for a branch scalar function (depth > 0, scalar output).
 *
 * Validates: no input_maps, only scalar-like tasks, no map, no vector.completion,
 * example inputs compile and placeholder inputs match schemas.
 * Throws a descriptive error string on failure.
 */
export function checkBranchScalarFunction(func: unknown): void {
  wasmQualityCheckBranchScalarFunction(func);
}

/**
 * Quality check for a branch vector function (depth > 0, vector output).
 *
 * Validates: vector input schema, task type/map constraints, single-task-must-be-vector,
 * <= 50% mapped scalar, vector field round-trip, example input compilation.
 * Throws a descriptive error string on failure.
 */
export function checkBranchVectorFunction(func: unknown): void {
  wasmQualityCheckBranchVectorFunction(func);
}
