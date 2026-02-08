/**
 * WASM Validation Utilities
 *
 * Client-side validation using WebAssembly bindings from objectiveai-rs-wasm-js.
 * Provides zero-cost validation and ID computation without server round-trips.
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Ensemble LLM configuration - a fully-specified single LLM with parameters.
 * Content-addressed: IDs are computed deterministically from the definition.
 */
export interface EnsembleLlmConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  top_logprobs?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  prefix_messages?: ChatMessage[];
  suffix_messages?: ChatMessage[];
  output_mode?: "instruction" | "json_schema" | "tool_call";
  [key: string]: unknown;
}

/**
 * Ensemble LLM with computed ID
 */
export interface EnsembleLlmWithId extends EnsembleLlmConfig {
  id: string;
}

/**
 * Chat message format
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Entry in an Ensemble - references an Ensemble LLM by ID with a vote count
 */
export interface EnsembleLlmEntry {
  ensemble_llm: string;
  count: number;
}

/**
 * Ensemble configuration - collection of Ensemble LLMs used together for voting
 */
export interface EnsembleConfig {
  ensemble_llms: EnsembleLlmEntry[];
}

/**
 * Ensemble with computed ID
 */
export interface EnsembleWithId extends EnsembleConfig {
  id: string;
}

/**
 * Function type - scalar (single score) or vector (array of scores)
 */
export type FunctionType = "scalar.function" | "vector.function";

/**
 * Task type - vector completion or nested function call
 */
export type TaskType = "vector.completion" | "scalar.function" | "vector.function";

/**
 * JMESPath or Starlark expression
 */
export type Expression =
  | { $jmespath: string }
  | { $starlark: string }
  | string
  | number
  | boolean
  | null;

/**
 * Function task definition
 */
export interface FunctionTask {
  type: TaskType;
  skip?: Expression;
  map?: number;
  input?: Expression;
  output?: Expression;
  prompt?: Expression;
  responses?: Expression;
  ensemble?: Expression;
  profile?: Expression;
  function?: {
    owner: string;
    repository: string;
    commit?: string;
  };
  [key: string]: unknown;
}

/**
 * Function definition
 */
export interface FunctionConfig {
  type: FunctionType;
  description?: string;
  input_schema?: Record<string, unknown>;
  input_split?: Expression;
  input_maps?: Expression[];
  output_length?: number;
  tasks: FunctionTask[];
  output?: Expression;
}

/**
 * Compiled task output
 */
export interface CompiledTask {
  type: TaskType;
  prompt?: unknown;
  responses?: unknown[];
  ensemble?: unknown;
  profile?: unknown;
  function?: {
    owner: string;
    repository: string;
    commit?: string;
  };
  input?: unknown;
}

/**
 * Compiled function output result
 */
export interface CompiledFunctionOutput {
  output: number | number[];
  valid: boolean;
}

/**
 * Generic validation result with typed data
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// WASM Module Interface
// ============================================================================

interface WasmModule {
  validateEnsembleLlm: (llm: EnsembleLlmConfig) => EnsembleLlmWithId;
  validateEnsemble: (ensemble: EnsembleConfig) => EnsembleWithId;
  validateFunctionInput: (func: FunctionConfig, input: unknown) => boolean | null;
  compileFunctionTasks: (func: FunctionConfig, input: unknown) => CompiledTask[];
  compileFunctionOutput: (func: FunctionConfig, input: unknown, taskOutputs: unknown[]) => CompiledFunctionOutput;
  compileFunctionInputMaps: (func: FunctionConfig, input: unknown) => unknown[][] | null;
  compileFunctionInputSplit: (func: FunctionConfig, input: unknown) => unknown[] | null;
  promptId: (prompt: ChatMessage[]) => string;
}

// WASM module instance
let wasmModule: WasmModule | null = null;
let loadingPromise: Promise<WasmModule | null> | null = null;

/**
 * Load the WASM module dynamically.
 * Only works in browser environment.
 */
export async function loadWasm(): Promise<WasmModule | null> {
  // Only load in browser
  if (typeof window === "undefined") {
    return null;
  }

  // Return cached module
  if (wasmModule) {
    return wasmModule;
  }

  // Return existing loading promise to prevent multiple loads
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // Dynamic import of the WASM module
      // Note: In production, this would be from an npm package or CDN
      // Using dynamic import with type assertion to handle missing module gracefully
      const modulePath = "objectiveai-wasm-js";
      const wasm = await import(/* webpackIgnore: true */ modulePath) as WasmModule;
      wasmModule = wasm;
      return wasm;
    } catch (error) {
      console.warn("WASM validation module not available. This is expected in development.", error);
      return null;
    }
  })();

  return loadingPromise;
}

/**
 * Check if WASM validation is available
 */
export function isWasmAvailable(): boolean {
  return wasmModule !== null;
}

/**
 * Validate an Ensemble LLM and compute its content-addressed ID.
 *
 * Accepts any object with a `model` field. Additional fields (temperature, top_p, etc.)
 * will be validated by the WASM module.
 *
 * @param llm - The Ensemble LLM configuration object (must have at least a `model` field)
 * @returns Validation result with the LLM including computed ID, or error
 */
export async function validateEnsembleLlm<T extends { model: string }>(llm: T): Promise<ValidationResult<EnsembleLlmWithId>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available. Validation will happen server-side."
    };
  }

  try {
    const result = wasm.validateEnsembleLlm(llm as EnsembleLlmConfig);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validate an Ensemble and compute its content-addressed ID.
 *
 * Accepts any object with an `ensemble_llms` array. Each entry must have
 * `ensemble_llm` (string) and `count` (number) fields.
 *
 * @param ensemble - The Ensemble configuration object
 * @returns Validation result with the Ensemble including computed ID, or error
 */
export async function validateEnsemble<T extends { ensemble_llms: Array<{ ensemble_llm: string; count: number }> }>(
  ensemble: T
): Promise<ValidationResult<EnsembleWithId>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available. Validation will happen server-side."
    };
  }

  try {
    const result = wasm.validateEnsemble(ensemble as EnsembleConfig);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Validate function input against its schema.
 *
 * @param func - The Function definition
 * @param input - The input to validate
 * @returns true if valid, false if invalid, null for inline functions
 */
export async function validateFunctionInput(
  func: FunctionConfig,
  input: unknown
): Promise<ValidationResult<boolean | null>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.validateFunctionInput(func, input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compile function tasks to preview what will execute.
 *
 * @param func - The Function definition
 * @param input - The function input
 * @returns Compiled tasks array
 */
export async function compileFunctionTasks(
  func: FunctionConfig,
  input: unknown
): Promise<ValidationResult<CompiledTask[]>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.compileFunctionTasks(func, input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compile function output to preview the final result.
 *
 * @param func - The Function definition
 * @param input - The function input
 * @param taskOutputs - Array of task outputs
 * @returns Compiled output with validation status
 */
export async function compileFunctionOutput(
  func: FunctionConfig,
  input: unknown,
  taskOutputs: unknown[]
): Promise<ValidationResult<CompiledFunctionOutput>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.compileFunctionOutput(func, input, taskOutputs);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compile function input maps.
 *
 * @param func - The Function definition
 * @param input - The function input
 * @returns Compiled input maps (2D array) or null if no input_maps
 */
export async function compileFunctionInputMaps(
  func: FunctionConfig,
  input: unknown
): Promise<ValidationResult<unknown[][] | null>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.compileFunctionInputMaps(func, input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compile the input_split expression to get the items being ranked.
 *
 * For vector functions, this returns the array of items that will be scored.
 * The index of each item matches the corresponding score in the output.
 *
 * @param func - The Function definition
 * @param input - The function input
 * @returns Array of split inputs, or null for scalar functions or functions without input_split
 */
export async function compileFunctionInputSplit(
  func: FunctionConfig,
  input: unknown
): Promise<ValidationResult<unknown[] | null>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.compileFunctionInputSplit(func, input);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Compute the content-addressed ID for a prompt (array of messages).
 *
 * @param prompt - Array of chat messages
 * @returns The computed prompt ID
 */
export async function computePromptId(prompt: ChatMessage[]): Promise<ValidationResult<string>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.promptId(prompt);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
