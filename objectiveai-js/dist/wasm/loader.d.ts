/* tslint:disable */
/* eslint-disable */

/**
 * Compiles a Function's input_maps expressions for a given input.
 *
 * Evaluates the `input_maps` expressions to transform the input into a 2D array
 * that can be referenced by mapped tasks. Each sub-array can be accessed by
 * tasks via their `map` index.
 *
 * # Arguments
 *
 * * `function` - JavaScript object representing a Function definition
 * * `input` - JavaScript object representing the function input
 *
 * # Returns
 *
 * - An array of input arrays if `input_maps` is defined
 * - `null` if the function has no `input_maps`
 *
 * # Errors
 *
 * Returns an error string if expression evaluation fails.
 */
export function compileFunctionInputMaps(_function: any, input: any): any | undefined;

/**
 * Compiles the `input_merge` expression to merge multiple sub-inputs back into one.
 *
 * Used by strategies like Swiss System to recombine a subset of split inputs
 * into a single input for pool execution. The expression transforms an array
 * of inputs (a subset from `compileFunctionInputSplit`) into a single merged input.
 *
 * # Arguments
 *
 * * `function` - JavaScript object representing a Function definition
 * * `input` - Array of inputs to merge (typically a subset from `compileFunctionInputSplit`)
 *
 * # Returns
 *
 * - The merged input for vector functions with `input_merge` defined
 * - `null` for scalar functions or functions without `input_merge`
 *
 * # Errors
 *
 * Returns an error string if expression evaluation fails.
 */
export function compileFunctionInputMerge(_function: any, input: any): any | undefined;

/**
 * Compiles the `input_split` expression to split input into multiple sub-inputs.
 *
 * Used by strategies like Swiss System that need to partition input into
 * smaller pools. The expression transforms the original input into an array
 * of inputs, where each element can be processed independently.
 *
 * # Arguments
 *
 * * `function` - JavaScript object representing a Function definition
 * * `input` - JavaScript object representing the function input to split
 *
 * # Returns
 *
 * - An array of split inputs for vector functions with `input_split` defined
 * - `null` for scalar functions or functions without `input_split`
 *
 * # Errors
 *
 * Returns an error string if expression evaluation fails.
 */
export function compileFunctionInputSplit(_function: any, input: any): any | undefined;

/**
 * Computes the expected output length for a vector Function.
 *
 * Evaluates the `output_length` expression to determine how many elements
 * the output vector should contain. This is only applicable to remote
 * vector functions which have an `output_length` field.
 *
 * # Arguments
 *
 * * `function` - JavaScript object representing a Function definition
 * * `input` - JavaScript object representing the function input
 *
 * # Returns
 *
 * - The expected output length for remote vector functions
 * - `null` for scalar functions or inline functions
 *
 * # Errors
 *
 * Returns an error string if expression evaluation fails.
 */
export function compileFunctionOutputLength(_function: any, input: any): number | undefined;

/**
 * Compiles a Function's task expressions for a given input.
 *
 * Evaluates all expressions (JMESPath or Starlark) in the function's tasks
 * using the provided input data. This is used for previewing how tasks will
 * be executed during Function authoring.
 *
 * # Arguments
 *
 * * `function` - JavaScript object representing a Function definition
 * * `input` - JavaScript object representing the function input
 *
 * # Returns
 *
 * An array where each element corresponds to a task definition:
 * - `null` if the task was skipped (skip expression evaluated to true)
 * - `{ One: task }` for non-mapped tasks
 * - `{ Many: [task, ...] }` for mapped tasks (expanded from input_maps)
 *
 * # Errors
 *
 * Returns an error string if expression evaluation fails or types don't match.
 */
export function compileFunctionTasks(_function: any, input: any): any;

/**
 * Computes a content-addressed ID for chat messages.
 *
 * Normalizes the messages (consolidates text parts, removes empty content)
 * and computes a deterministic hash. This ID is used for caching and
 * deduplicating requests with identical prompts.
 *
 * # Arguments
 *
 * * `prompt` - Array of chat messages
 *
 * # Returns
 *
 * A base62-encoded hash string uniquely identifying the prompt content.
 *
 * # Errors
 *
 * Returns an error if the messages cannot be deserialized.
 */
export function promptId(prompt: any): string;

/**
 * Quality check for a branch function (depth > 0).
 *
 * Routes to branch scalar or branch vector checks based on the function type.
 * Branch functions contain only function/placeholder tasks.
 *
 * `children` is an optional map of `"owner/repository"` → RemoteFunction for
 * validating compiled task inputs against child function input schemas.
 */
export function qualityCheckBranchFunction(_function: any, children: any): void;

/**
 * Quality check for a branch scalar function (depth > 0, scalar output).
 *
 * Validates: no input_maps, only scalar-like tasks, no map, no vector.completion,
 * example inputs compile and placeholder inputs match schemas.
 */
export function qualityCheckBranchScalarFunction(_function: any, children: any): void;

/**
 * Quality check for a branch vector function (depth > 0, vector output).
 *
 * Validates: vector input schema, task type/map constraints, single-task-must-be-vector,
 * <= 50% mapped scalar, vector field round-trip, example input compilation.
 */
export function qualityCheckBranchVectorFunction(_function: any, children: any): void;

/**
 * Quality check for a leaf function (depth 0).
 *
 * Routes to leaf scalar or leaf vector checks based on the function type.
 * Leaf functions contain only vector.completion tasks.
 */
export function qualityCheckLeafFunction(_function: any): void;

/**
 * Quality check for a leaf scalar function (depth 0, scalar output).
 *
 * Validates: no input_maps, only vector.completion tasks, no map,
 * content parts (not plain strings), messages >= 1, responses >= 2.
 */
export function qualityCheckLeafScalarFunction(_function: any): void;

/**
 * Quality check for a leaf vector function (depth 0, vector output).
 *
 * Validates: vector input schema, only vector.completion tasks, no map,
 * content parts, vector field round-trip (output_length/input_split/input_merge).
 */
export function qualityCheckLeafVectorFunction(_function: any): void;

/**
 * Quality check for scalar function fields (input_schema only).
 *
 * # Arguments
 *
 * * `fields` - JavaScript object with `input_schema`
 *
 * # Returns
 *
 * Nothing on success. Throws a descriptive error string on failure.
 */
export function qualityCheckScalarFields(fields: any): void;

/**
 * Validates vector function fields (output_length, input_split, input_merge).
 *
 * Generates diverse example inputs from the input_schema and validates that the
 * output_length, input_split, and input_merge expressions work correctly together
 * via round-trip testing.
 *
 * # Arguments
 *
 * * `fields` - JavaScript object with `input_schema`, `output_length`, `input_split`, `input_merge`
 *
 * # Returns
 *
 * Nothing on success. Throws a descriptive error string on failure.
 */
export function qualityCheckVectorFields(fields: any): void;

/**
 * Computes a content-addressed ID for a tools array.
 *
 * Computes a deterministic hash for the tools configuration. This ID is
 * used for caching and deduplicating requests with identical tool sets.
 *
 * # Arguments
 *
 * * `tools` - Array of tool definitions
 *
 * # Returns
 *
 * A base62-encoded hash string uniquely identifying the tools.
 *
 * # Errors
 *
 * Returns an error if the tools cannot be deserialized.
 */
export function toolsId(tools: any): string;

/**
 * Validates an Ensemble configuration and computes its content-addressed ID.
 *
 * Takes an Ensemble definition (a collection of Ensemble LLMs), validates each
 * LLM, and computes a deterministic ID for the ensemble as a whole.
 *
 * # Arguments
 *
 * * `ensemble` - JavaScript object representing an Ensemble configuration
 *
 * # Returns
 *
 * The validated Ensemble with its computed `id` field populated and all
 * member LLMs validated with their IDs.
 *
 * # Errors
 *
 * Returns an error string if any LLM validation fails or the ensemble
 * structure is invalid.
 */
export function validateEnsemble(ensemble: any): any;

/**
 * Validates an Ensemble LLM configuration and computes its content-addressed ID.
 *
 * Takes an Ensemble LLM definition, normalizes it (removes defaults, deduplicates),
 * validates all fields, and computes a deterministic ID using XXHash3-128.
 *
 * # Arguments
 *
 * * `llm` - JavaScript object representing an Ensemble LLM configuration
 *
 * # Returns
 *
 * The validated Ensemble LLM with its computed `id` field populated.
 *
 * # Errors
 *
 * Returns an error string if validation fails (e.g., invalid model name,
 * out-of-range parameters, conflicting settings).
 */
export function validateEnsembleLlm(llm: any): any;

/**
 * Validates function input against its schema.
 *
 * For remote functions, checks whether the provided input conforms to
 * the function's JSON Schema definition. For inline functions, returns
 * `null` since they lack schema definitions.
 *
 * # Arguments
 *
 * * `function` - JavaScript object representing a Function definition
 * * `input` - JavaScript object representing the function input to validate
 *
 * # Returns
 *
 * - `true` if the input is valid against the schema
 * - `false` if the input is invalid
 * - `null` for inline functions (no schema to validate against)
 *
 * # Errors
 *
 * Returns an error if deserialization fails.
 */
export function validateFunctionInput(_function: any, input: any): boolean | undefined;

/**
 * Computes a content-addressed ID for a vector completion response option.
 *
 * Normalizes the response content (consolidates text parts, removes empty
 * content) and computes a deterministic hash. This ID is used for caching
 * and identifying individual response options in vector completions.
 *
 * # Arguments
 *
 * * `response` - A rich content object (text or multipart content)
 *
 * # Returns
 *
 * A base62-encoded hash string uniquely identifying the response content.
 *
 * # Errors
 *
 * Returns an error if the response cannot be deserialized.
 */
export function vectorResponseId(response: any): string;
