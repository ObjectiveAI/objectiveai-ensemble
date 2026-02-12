import { Functions, Chat, Vector } from "objectiveai";
import z from "zod";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Result } from "../result";
import {
  ExampleInput,
  ExampleInputSchema,
  ExampleInputs,
  ExampleInputsSchema,
} from "../../exampleInput";
import { validateInputSchema } from "../function/inputSchema";
import { DeserializedFunction, readFunction, validateFunction } from "../function/function";
import { buildProfile, readProfile, validateProfile } from "../profile";
import { readParameters, validateParameters } from "../parameters";

export function validateExampleInput(
  value: unknown,
  fn: DeserializedFunction,
): Result<ExampleInput> {
  // Parse the value as an ExampleInput
  const parsed = ExampleInputSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  const exampleInput = parsed.data;

  // Validate input_schema and check value conforms
  const inputSchemaResult = validateInputSchema(fn);
  if (!inputSchemaResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_schema is invalid: ${inputSchemaResult.error}`,
    };
  }
  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(
    inputSchemaResult.value,
  );
  const valueParsed = zodSchema.safeParse(exampleInput.value);
  if (!valueParsed.success) {
    return {
      ok: false,
      value: undefined,
      error: `value does not conform to input_schema: ${valueParsed.error.message}`,
    };
  }

  // Validate outputLength presence matches function
  const hasOutputLength = fn.output_length != null;
  if (hasOutputLength && exampleInput.outputLength === null) {
    return {
      ok: false,
      value: undefined,
      error: "outputLength must be present because function has output_length",
    };
  }
  if (!hasOutputLength && exampleInput.outputLength !== null) {
    return {
      ok: false,
      value: undefined,
      error:
        "outputLength must be null because function does not have output_length",
    };
  }

  // Validate compiled task content format
  const tasksResult = validateTasks(exampleInput.compiledTasks);
  if (!tasksResult.ok) {
    return { ok: false, value: undefined, error: tasksResult.error };
  }

  return { ok: true, value: exampleInput, error: undefined };
}

export function validateExampleInputs(
  value: unknown,
  fn: DeserializedFunction,
): Result<ExampleInputs> {
  const parsed = ExampleInputsSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  const exampleInputs = parsed.data;

  for (let i = 0; i < exampleInputs.length; i++) {
    const result = validateExampleInput(exampleInputs[i], fn);
    if (!result.ok) {
      return {
        ok: false,
        value: undefined,
        error: `example_inputs[${i}]: ${result.error}`,
      };
    }
  }

  return { ok: true, value: exampleInputs, error: undefined };
}

export function delExampleInputs(): Result<undefined> {
  writeFileSync("inputs.json", "[]");
  return { ok: true, value: undefined, error: undefined };
}

export function isDefaultExampleInputs(): boolean {
  const result = readExampleInputsFile();
  const v = result.ok ? result.value : [];
  return !Array.isArray(v) || v.length === 0;
}

export function readExampleInput(index: number): Result<unknown> {
  const file = readExampleInputsFile();
  if (!file.ok) return file;
  if (index < 0 || index >= file.value.length) {
    return {
      ok: false,
      value: undefined,
      error: `index ${index} is out of bounds (length ${file.value.length})`,
    };
  }
  return { ok: true, value: file.value[index], error: undefined };
}

export function readExampleInputs(): Result<unknown> {
  return readExampleInputsFile();
}

export function readExampleInputsSchema(): Result<z.ZodType> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: `Unable to read function: ${fn.error}` };
  }
  const inputSchemaResult = validateInputSchema(fn.value);
  if (!inputSchemaResult.ok) {
    return { ok: false, value: undefined, error: `Unable to read input_schema: ${inputSchemaResult.error}` };
  }
  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(inputSchemaResult.value);
  const itemSchema = ExampleInputSchema.extend({ value: zodSchema });

  // Derive array constraints from ExampleInputsSchema so changes there propagate
  let arraySchema: z.ZodArray<typeof itemSchema> = z.array(itemSchema);
  const def = (ExampleInputsSchema as any)._def ?? (ExampleInputsSchema as any).def;
  if (def?.minLength != null) {
    arraySchema = arraySchema.min(def.minLength.value ?? def.minLength);
  }
  if (def?.maxLength != null) {
    arraySchema = arraySchema.max(def.maxLength.value ?? def.maxLength);
  }
  if (ExampleInputsSchema.description) {
    arraySchema = arraySchema.describe(ExampleInputsSchema.description);
  }

  return { ok: true, value: arraySchema, error: undefined };
}

function readExampleInputsFile(): Result<unknown[]> {
  if (!existsSync("inputs.json")) {
    return { ok: true, value: [], error: undefined };
  }
  let content: unknown;
  try {
    content = JSON.parse(readFileSync("inputs.json", "utf-8"));
  } catch {
    return { ok: true, value: [], error: undefined };
  }
  if (!Array.isArray(content)) {
    return { ok: true, value: [], error: undefined };
  }
  return { ok: true, value: content, error: undefined };
}

function writeExampleInputsFile(value: unknown[]): void {
  writeFileSync("inputs.json", JSON.stringify(value, null, 2));
}

export function appendExampleInput(value: unknown): Result<string> {
  const file = readExampleInputsFile();
  if (!file.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to append example input: ${file.error}`,
    };
  }
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to append example input: ${fn.error}`,
    };
  }

  const existing = file.value;
  const newInputs = [...existing, value];

  for (const [index, input] of newInputs.entries()) {
    const result = validateExampleInput(input, fn.value);
    if (!result.ok) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid example input at index ${index}: ${result.error}`,
      };
    }
  }

  writeExampleInputsFile(newInputs);
  return { ok: true, value: `new length: ${newInputs.length}`, error: undefined };
}

export function editExampleInput(
  index: number,
  value: unknown,
): Result<undefined> {
  const file = readExampleInputsFile();
  if (!file.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit example input: ${file.error}`,
    };
  }
  if (index < 0 || index >= file.value.length) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit example input: index ${index} is out of bounds (length ${file.value.length})`,
    };
  }
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit example input: ${fn.error}`,
    };
  }

  const newInputs = [...file.value];
  newInputs[index] = value;

  for (const [index, input] of newInputs.entries()) {
    const result = validateExampleInput(input, fn.value);
    if (!result.ok) {
      return {
        ok: false,
        value: undefined,
        error: `Invalid example input at index ${index}: ${result.error}`,
      };
    }
  }

  writeExampleInputsFile(newInputs);
  return { ok: true, value: undefined, error: undefined };
}

export function delExampleInput(index: number): Result<string> {
  const file = readExampleInputsFile();
  if (!file.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to delete example input: ${file.error}`,
    };
  }
  if (index < 0 || index >= file.value.length) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to delete example input: index ${index} is out of bounds (length ${file.value.length})`,
    };
  }

  const newInputs = [...file.value];
  newInputs.splice(index, 1);
  writeExampleInputsFile(newInputs);
  return { ok: true, value: `new length: ${newInputs.length}`, error: undefined };
}

export function checkExampleInputs(): Result<undefined> {
  // Read and validate function.json
  const fnRaw = readFunction();
  if (!fnRaw.ok) {
    return { ok: false, value: undefined, error: `Unable to read function.json: ${fnRaw.error}` };
  }
  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) {
    return { ok: false, value: undefined, error: `Function schema validation failed: ${funcResult.error}` };
  }
  const func = funcResult.value;

  // Build and validate profile.json
  const buildResult = buildProfile();
  if (!buildResult.ok) {
    return { ok: false, value: undefined, error: `Failed to build profile: ${buildResult.error}` };
  }
  const profileRaw = readProfile();
  if (!profileRaw.ok) {
    return { ok: false, value: undefined, error: profileRaw.error };
  }
  const profileResult = validateProfile(profileRaw.value);
  if (!profileResult.ok) {
    return { ok: false, value: undefined, error: `Profile schema validation failed: ${profileResult.error}` };
  }

  // Read and validate parameters.json
  const paramsRaw = readParameters();
  if (!paramsRaw.ok) {
    return { ok: false, value: undefined, error: paramsRaw.error };
  }
  const paramsResult = validateParameters(paramsRaw.value);
  if (!paramsResult.ok) {
    return { ok: false, value: undefined, error: `Parameters validation failed: ${paramsResult.error}` };
  }
  const parameters = paramsResult.value;

  // Task type validation
  if (parameters.depth === 0) {
    for (const task of func.tasks) {
      if (task.type !== "vector.completion") {
        return { ok: false, value: undefined, error: `All tasks must be vector.completion at depth 0, but found task of type: ${task.type}` };
      }
    }
  } else {
    for (const task of func.tasks) {
      if (task.type !== "scalar.function" && task.type !== "vector.function") {
        return { ok: false, value: undefined, error: `All tasks must be function tasks (scalar.function or vector.function) at depth > 0, but found task of type: ${task.type}` };
      }
    }
  }

  // Task count validation
  if (func.tasks.length < parameters.min_width) {
    return { ok: false, value: undefined, error: `Too few tasks: ${func.tasks.length} is below min_width of ${parameters.min_width}` };
  }
  if (func.tasks.length > parameters.max_width) {
    return { ok: false, value: undefined, error: `Too many tasks: ${func.tasks.length} exceeds max_width of ${parameters.max_width}` };
  }

  // Read and validate inputs.json
  const file = readExampleInputsFile();
  if (!file.ok) {
    return { ok: false, value: undefined, error: `Unable to read inputs.json: ${file.error}` };
  }
  const inputs: ExampleInput[] = [];
  for (let i = 0; i < file.value.length; i++) {
    const parsed = ExampleInputSchema.safeParse(file.value[i]);
    if (!parsed.success) {
      return { ok: false, value: undefined, error: `Example input [${i}] schema validation failed: ${parsed.error.message}` };
    }
    inputs.push(parsed.data);
  }

  // Length validation
  if (inputs.length < 10 || inputs.length > 100) {
    return { ok: false, value: undefined, error: `Expected between 10 and 100 example inputs, but got ${inputs.length}` };
  }

  // Example inputs validation
  for (let i = 0; i < inputs.length; i++) {
    const { value, compiledTasks, outputLength } = inputs[i];
    const ctParsed = Functions.CompiledTasksSchema.safeParse(compiledTasks);
    if (!ctParsed.success) {
      return { ok: false, value: undefined, error: `Example input [${i}] compiledTasks schema validation failed: ${ctParsed.error.message}` };
    }
    if (!Functions.validateFunctionInput(func, value)) {
      return { ok: false, value: undefined, error: `Example input [${i}] value failed validation against function's input_schema: ${JSON.stringify(value)}` };
    }
    if (func.type === "scalar.function") {
      if (outputLength !== null) {
        return { ok: false, value: undefined, error: `Example input [${i}] outputLength must be null for scalar function` };
      }
    } else if (func.type === "vector.function") {
      if (outputLength === null) {
        return { ok: false, value: undefined, error: `Example input [${i}] outputLength must be non-null for vector function` };
      }
      if (typeof outputLength !== "number") {
        return { ok: false, value: undefined, error: `Example input [${i}] outputLength must be a number for vector function` };
      }
    }
  }

  // Compiled task validation
  for (let i = 0; i < inputs.length; i++) {
    const { value, compiledTasks: expectedCompiledTasks } = inputs[i];
    let compiledTasks: Functions.CompiledTasks;
    try {
      compiledTasks = Functions.compileFunctionTasks(func, value);
    } catch (e) {
      return { ok: false, value: undefined, error: `Example input [${i}] failed to compile tasks: ${(e as Error).message}` };
    }
    if (compiledTasks.length !== expectedCompiledTasks.length) {
      return { ok: false, value: undefined, error: `Example input [${i}] number of compiled tasks (${compiledTasks.length}) does not match expected (${expectedCompiledTasks.length})` };
    }
    for (let j = 0; j < compiledTasks.length; j++) {
      if (!compiledTasksEqual(compiledTasks[j], expectedCompiledTasks[j])) {
        return { ok: false, value: undefined, error: `Example input [${i}] compiled task [${j}] does not match.\n\nExpected: ${JSON.stringify(expectedCompiledTasks[j])}\n\nGot: ${JSON.stringify(compiledTasks[j])}` };
      }
    }
  }

  // Function task input validation against sub-function input schemas
  for (let i = 0; i < inputs.length; i++) {
    const { compiledTasks } = inputs[i];
    for (let j = 0; j < compiledTasks.length; j++) {
      const result = validateFunctionTaskInputs(compiledTasks[j], i, j);
      if (!result.ok) return result;
    }
  }

  // Vector function validation
  if (func.type === "vector.function") {
    for (let i = 0; i < inputs.length; i++) {
      const { value, outputLength } = inputs[i];

      // Validate output length
      const compiledOutputLength = Functions.compileFunctionOutputLength(func, value);
      if (compiledOutputLength === null) {
        return { ok: false, value: undefined, error: `Example input [${i}] compiled output length is null for vector function` };
      }
      if (compiledOutputLength !== outputLength) {
        return { ok: false, value: undefined, error: `Example input [${i}] compiled output length (${compiledOutputLength}) does not match expected (${outputLength})` };
      }
      if (compiledOutputLength <= 1) {
        return { ok: false, value: undefined, error: `Example input [${i}] output length must be greater than 1 for vector function, got ${compiledOutputLength}` };
      }

      // Split input
      const inputSplit = Functions.compileFunctionInputSplit(func, value);
      if (inputSplit === null) {
        return { ok: false, value: undefined, error: `Example input [${i}] input split is null for vector function` };
      }

      // Validate output length for each split input
      for (let j = 0; j < inputSplit.length; j++) {
        const compiledSplitOutputLength = Functions.compileFunctionOutputLength(func, inputSplit[j]);
        if (compiledSplitOutputLength !== 1) {
          return { ok: false, value: undefined, error: `Example input [${i}] split input [${j}] output length must be 1, got ${compiledSplitOutputLength}` };
        }
      }

      // Merge outputs
      const mergedOutput = Functions.compileFunctionInputMerge(func, inputSplit);
      if (mergedOutput === null) {
        return { ok: false, value: undefined, error: `Example input [${i}] merged output is null for vector function` };
      }

      // Validate merged output length equals original output length
      const mergedOutputLength = Functions.compileFunctionOutputLength(func, mergedOutput);
      if (mergedOutputLength !== outputLength) {
        return { ok: false, value: undefined, error: `Example input [${i}] merged output length (${mergedOutputLength}) does not match expected (${outputLength})` };
      }

      // Validate merged input matches original input
      if (!deepEqual(mergedOutput, value)) {
        return { ok: false, value: undefined, error: `Example input [${i}] merged input does not match original input.\n\nOriginal: ${JSON.stringify(value)}\n\nMerged: ${JSON.stringify(mergedOutput)}` };
      }

      // Validate random subsets: merge random combinations and check output_length matches subset size
      const subsets = randomSubsets(inputSplit.length, 5);
      for (const subset of subsets) {
        const subSplits = subset.map(idx => inputSplit[idx]);
        const merged = Functions.compileFunctionInputMerge(func, subSplits);
        if (merged === null) {
          return { ok: false, value: undefined, error: `Example input [${i}] input_merge returned null for subset [${subset.join(", ")}]` };
        }
        const mergedLen = Functions.compileFunctionOutputLength(func, merged);
        if (mergedLen !== subset.length) {
          return { ok: false, value: undefined, error: `Example input [${i}] merged subset [${subset.join(", ")}] output_length is ${mergedLen}, expected ${subset.length}` };
        }
      }
    }
  }

  // Schema coverage validation
  const allValues = inputs.map(input => input.value);
  const coverageResult = checkSchemaCoverage(func.input_schema, allValues, "input_schema");
  if (!coverageResult.ok) {
    return coverageResult;
  }

  // Multimodal coverage validation
  const modalities = collectModalities(func.input_schema);
  if (modalities.size > 0) {
    const allCompiledTasks = inputs.flatMap(input => input.compiledTasks);
    const found = new Set<Modality>();
    for (const ct of allCompiledTasks) {
      collectModalitiesFromCompiledTask(ct, found);
    }
    for (const modality of modalities) {
      if (!found.has(modality)) {
        return { ok: false, value: undefined, error: `Input schema declares "${modality}" modality but no compiled task across all example inputs contains a rich content part of that type. Add at least one example input that uses "${modality}" content.` };
      }
    }
  }

  return { ok: true, value: undefined, error: undefined };
}

function validateTasks(compiledTasks: Functions.CompiledTasks): Result<undefined> {
  for (let i = 0; i < compiledTasks.length; i++) {
    const result = validateCompiledTaskContent(compiledTasks[i], i);
    if (!result.ok) return result;
  }
  return { ok: true, value: undefined, error: undefined };
}

function validateCompiledTaskContent(ct: Functions.CompiledTask, index: number): Result<undefined> {
  if (ct === null) return { ok: true, value: undefined, error: undefined };
  if (Array.isArray(ct)) {
    for (const sub of ct) {
      const result = validateCompiledTaskContent(sub, index);
      if (!result.ok) return result;
    }
    return { ok: true, value: undefined, error: undefined };
  }
  if (ct.type !== "vector.completion") {
    return { ok: true, value: undefined, error: undefined };
  }

  // Message content must be an array of content parts, not a plain string
  for (let j = 0; j < ct.messages.length; j++) {
    const msg = ct.messages[j];
    if ("content" in msg && msg.content != null && typeof msg.content === "string") {
      return {
        ok: false,
        value: undefined,
        error: `compiledTasks[${index}] messages[${j}] content must be an array of content parts, not a string`,
      };
    }
  }

  // Each response must be an array of content parts, not a plain string
  for (let j = 0; j < ct.responses.length; j++) {
    if (typeof ct.responses[j] === "string") {
      return {
        ok: false,
        value: undefined,
        error: `compiledTasks[${index}] responses[${j}] must be an array of content parts, not a string`,
      };
    }
  }

  return { ok: true, value: undefined, error: undefined };
}

function validateFunctionTaskInputs(
  ct: Functions.CompiledTask,
  inputIndex: number,
  taskIndex: number,
): Result<undefined> {
  if (ct === null) return { ok: true, value: undefined, error: undefined };
  if (Array.isArray(ct)) {
    for (let k = 0; k < ct.length; k++) {
      const result = validateFunctionTaskInputs(ct[k], inputIndex, taskIndex);
      if (!result.ok) return result;
    }
    return { ok: true, value: undefined, error: undefined };
  }
  if (ct.type !== "scalar.function" && ct.type !== "vector.function") {
    return { ok: true, value: undefined, error: undefined };
  }

  const dir = join("agent_functions", ct.repository);
  const subFn = readFunction(dir);
  if (!subFn.ok) {
    return { ok: false, value: undefined, error: `Example input [${inputIndex}] compiled task [${taskIndex}]: unable to read sub-function at ${dir}: ${subFn.error}` };
  }

  const subInputSchema = validateInputSchema(subFn.value);
  if (!subInputSchema.ok) {
    return { ok: false, value: undefined, error: `Example input [${inputIndex}] compiled task [${taskIndex}]: sub-function at ${dir} has invalid input_schema: ${subInputSchema.error}` };
  }

  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(subInputSchema.value);
  const parsed = zodSchema.safeParse(ct.input);
  if (!parsed.success) {
    return {
      ok: false,
      value: undefined,
      error: `Example input [${inputIndex}] compiled task [${taskIndex}]: input does not match sub-function input_schema at ${dir}.\n\nInput: ${JSON.stringify(ct.input)}\n\nExpected schema: ${JSON.stringify(subInputSchema.value)}\n\nValidation error: ${parsed.error.message}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

function checkSchemaCoverage(
  schema: Functions.Expression.InputSchema,
  values: unknown[],
  path: string,
): Result<undefined> {
  if ("anyOf" in schema) {
    for (let optIdx = 0; optIdx < schema.anyOf.length; optIdx++) {
      const option = schema.anyOf[optIdx];
      const optionZod = Functions.Expression.InputSchemaExt.toZodSchema(option);
      const matching = values.filter(v => optionZod.safeParse(v).success);
      if (matching.length === 0) {
        return { ok: false, value: undefined, error: `${path}.anyOf[${optIdx}]: no example input matches this schema option` };
      }
      const result = checkSchemaCoverage(option, matching, `${path}.anyOf[${optIdx}]`);
      if (!result.ok) return result;
    }
  } else if (schema.type === "object") {
    const required = schema.required ?? [];
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = required.includes(key);
      const presentValues: unknown[] = [];
      let absentCount = 0;
      for (const v of values) {
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          const obj = v as Record<string, unknown>;
          if (key in obj) {
            presentValues.push(obj[key]);
          } else {
            absentCount++;
          }
        }
      }
      if (!isRequired) {
        if (presentValues.length === 0) {
          return { ok: false, value: undefined, error: `${path}.${key}: optional property is never present in any example input` };
        }
        if (absentCount === 0) {
          return { ok: false, value: undefined, error: `${path}.${key}: optional property is never absent in any example input` };
        }
      }
      if (presentValues.length > 0) {
        const result = checkSchemaCoverage(propSchema, presentValues, `${path}.${key}`);
        if (!result.ok) return result;
      }
    }
  } else if (schema.type === "array") {
    const effectiveMin = Math.max(0, schema.minItems ?? 0);
    const maxItems = schema.maxItems ?? null;

    // At least 1 value has length === effectiveMin
    const hasMin = values.some(v => Array.isArray(v) && v.length === effectiveMin);
    if (!hasMin) {
      return { ok: false, value: undefined, error: `${path}: no example input has an array of length ${effectiveMin} (minItems)` };
    }

    // At least 1 value has length === 1, if possible
    if (effectiveMin <= 1 && (maxItems === null || maxItems >= 1)) {
      const hasOne = values.some(v => Array.isArray(v) && v.length === 1);
      if (!hasOne) {
        return { ok: false, value: undefined, error: `${path}: no example input has an array of length 1` };
      }
    }

    // At least 1 value has length > threshold, if possible
    const threshold = Math.max(3, effectiveMin);
    if (maxItems === null || maxItems > threshold) {
      const hasGreater = values.some(v => Array.isArray(v) && v.length > threshold);
      if (!hasGreater) {
        return { ok: false, value: undefined, error: `${path}: no example input has an array of length greater than ${threshold}` };
      }
    }

    const allElements: unknown[] = [];
    for (const v of values) {
      if (Array.isArray(v)) {
        allElements.push(...v);
      }
    }
    if (allElements.length > 0) {
      const result = checkSchemaCoverage(schema.items, allElements, `${path}[]`);
      if (!result.ok) return result;
    }
  }
  return { ok: true, value: undefined, error: undefined };
}

function randomSubsets(length: number, count: number): number[][] {
  if (length < 2) return [];
  const result: number[][] = [];
  for (let c = 0; c < count; c++) {
    const size = 2 + Math.floor(Math.random() * (length - 2));
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    result.push(indices.slice(0, size).sort((a, b) => a - b));
  }
  return result;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return a === b;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => key in bObj && deepEqual(aObj[key], bObj[key]));
}

export type Modality = "image" | "audio" | "video" | "file";

const MODALITY_PART_TYPES: Record<Modality, string[]> = {
  image: ["image_url"],
  audio: ["input_audio"],
  video: ["video_url", "input_video"],
  file: ["file"],
};

const ALL_MODALITIES: Modality[] = ["image", "audio", "video", "file"];

export function collectModalities(schema: Functions.Expression.InputSchema): Set<Modality> {
  const result = new Set<Modality>();
  collectModalitiesRecursive(schema, result);
  return result;
}

function collectModalitiesRecursive(schema: Functions.Expression.InputSchema, result: Set<Modality>): void {
  if ("anyOf" in schema) {
    for (const option of schema.anyOf) {
      collectModalitiesRecursive(option, result);
    }
  } else if (schema.type === "object") {
    for (const propSchema of Object.values(schema.properties)) {
      collectModalitiesRecursive(propSchema, result);
    }
  } else if (schema.type === "array") {
    collectModalitiesRecursive(schema.items, result);
  } else if (ALL_MODALITIES.includes(schema.type as Modality)) {
    result.add(schema.type as Modality);
  }
}

function collectModalitiesFromCompiledTask(ct: Functions.CompiledTask, found: Set<Modality>): void {
  if (ct === null) return;
  if (Array.isArray(ct)) {
    for (const sub of ct) {
      collectModalitiesFromCompiledTask(sub, found);
    }
    return;
  }
  if (ct.type === "vector.completion") {
    collectModalitiesFromMessages(ct.messages, found);
    collectModalitiesFromResponses(ct.responses, found);
  } else {
    collectModalitiesFromInputValue(ct.input, found);
  }
}

function collectModalitiesFromMessages(messages: Chat.Completions.Request.Message[], found: Set<Modality>): void {
  for (const msg of messages) {
    if ("content" in msg && msg.content != null) {
      collectModalitiesFromRichContent(msg.content, found);
    }
  }
}

function collectModalitiesFromResponses(responses: Vector.Completions.Request.VectorResponse[], found: Set<Modality>): void {
  for (const resp of responses) {
    collectModalitiesFromRichContent(resp, found);
  }
}

function collectModalitiesFromRichContent(content: Chat.Completions.Request.RichContent, found: Set<Modality>): void {
  if (typeof content === "string") return;
  for (const part of content) {
    checkPartType(part.type, found);
  }
}

function checkPartType(partType: string, found: Set<Modality>): void {
  for (const modality of ALL_MODALITIES) {
    if (MODALITY_PART_TYPES[modality].includes(partType)) {
      found.add(modality);
    }
  }
}

function collectModalitiesFromInputValue(value: Functions.Expression.InputValue, found: Set<Modality>): void {
  if (typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) {
      collectModalitiesFromInputValue(item, found);
    }
    return;
  }
  if ("type" in value && typeof value.type === "string") {
    checkPartType(value.type, found);
  }
  for (const v of Object.values(value)) {
    if (v !== undefined) {
      collectModalitiesFromInputValue(v as Functions.Expression.InputValue, found);
    }
  }
}

function compiledTasksEqual(
  a: Functions.CompiledTask,
  b: Functions.CompiledTask,
): boolean {
  if (a === null) {
    return b === null;
  } else if (Array.isArray(a)) {
    return (
      b !== null &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((subTask, index) =>
        compiledTasksEqual(subTask, (b as Functions.CompiledTask[])[index]),
      )
    );
  } else if (a.type === "scalar.function") {
    return (
      b !== null &&
      !Array.isArray(b) &&
      b.type === "scalar.function" &&
      b.owner === a.owner &&
      b.repository === a.repository &&
      b.commit === a.commit &&
      JSON.stringify(a.input) === JSON.stringify(b.input)
    );
  } else if (a.type === "vector.function") {
    return (
      b !== null &&
      !Array.isArray(b) &&
      b.type === "vector.function" &&
      b.owner === a.owner &&
      b.repository === a.repository &&
      b.commit === a.commit &&
      JSON.stringify(a.input) === JSON.stringify(b.input)
    );
  } else if (a.type === "vector.completion") {
    return b !== null &&
      !Array.isArray(b) &&
      b.type === "vector.completion" &&
      JSON.stringify(a.messages) === JSON.stringify(b.messages) &&
      JSON.stringify(a.responses) === JSON.stringify(b.responses) &&
      a.tools === undefined
      ? b.tools === undefined
      : (b as Functions.VectorCompletionTask).tools !== undefined &&
          (a as Functions.VectorCompletionTask).tools!.length ===
            (b as Functions.VectorCompletionTask).tools!.length &&
          (a as Functions.VectorCompletionTask).tools!.every(
            (tool, index) =>
              JSON.stringify(tool) ===
              JSON.stringify(
                (b as Functions.VectorCompletionTask).tools![index],
              ),
          );
  } else {
    return false;
  }
}
