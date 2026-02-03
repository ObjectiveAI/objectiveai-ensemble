/**
 * WASM Validation Utilities
 *
 * Client-side validation using WebAssembly bindings from objectiveai-rs-wasm-js.
 * Provides zero-cost validation and ID computation without server round-trips.
 */

// WASM module instance
let wasmModule: WasmModule | null = null;
let loadingPromise: Promise<WasmModule | null> | null = null;

interface WasmModule {
  validateEnsembleLlm: (llm: unknown) => unknown;
  validateEnsemble: (ensemble: unknown) => unknown;
  validateFunctionInput: (func: unknown, input: unknown) => boolean | null;
  compileFunctionTasks: (func: unknown, input: unknown) => unknown;
  compileFunctionOutput: (func: unknown, input: unknown, taskOutputs: unknown) => unknown;
  compileFunctionInputMaps: (func: unknown, input: unknown) => unknown | null;
  promptId: (prompt: unknown) => string;
}

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

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
 * @param llm - The Ensemble LLM configuration object
 * @returns Validation result with the LLM including computed ID, or error
 */
export async function validateEnsembleLlm(llm: unknown): Promise<ValidationResult<{ id: string } & Record<string, unknown>>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available. Validation will happen server-side."
    };
  }

  try {
    const result = wasm.validateEnsembleLlm(llm);
    return { success: true, data: result as { id: string } & Record<string, unknown> };
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
 * @param ensemble - The Ensemble configuration object
 * @returns Validation result with the Ensemble including computed ID, or error
 */
export async function validateEnsemble(ensemble: unknown): Promise<ValidationResult<{ id: string } & Record<string, unknown>>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available. Validation will happen server-side."
    };
  }

  try {
    const result = wasm.validateEnsemble(ensemble);
    return { success: true, data: result as { id: string } & Record<string, unknown> };
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
  func: unknown,
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
  func: unknown,
  input: unknown
): Promise<ValidationResult<unknown[]>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.compileFunctionTasks(func, input);
    return { success: true, data: result as unknown[] };
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
  func: unknown,
  input: unknown,
  taskOutputs: unknown
): Promise<ValidationResult<{ output: number | number[]; valid: boolean }>> {
  const wasm = await loadWasm();

  if (!wasm) {
    return {
      success: false,
      error: "WASM validation not available"
    };
  }

  try {
    const result = wasm.compileFunctionOutput(func, input, taskOutputs);
    return { success: true, data: result as { output: number | number[]; valid: boolean } };
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
  func: unknown,
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
    return { success: true, data: result as unknown[][] | null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
