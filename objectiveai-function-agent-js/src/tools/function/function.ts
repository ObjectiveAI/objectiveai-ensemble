import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Functions } from "objectiveai";
import z from "zod";
import { Result } from "../result";
import { checkType, validateType } from "./type";
import { checkDescription } from "./description";
import { checkInputSchema } from "./inputSchema";
import { checkInputMaps } from "./inputMaps";
import { checkTasks } from "./tasks";
import { checkOutputLength } from "./outputLength";
import { checkInputSplit } from "./inputSplit";
import { checkInputMerge } from "./inputMerge";

export interface DeserializedFunction {
  type?: unknown;
  description?: unknown;
  input_schema?: unknown;
  input_maps?: unknown;
  tasks?: unknown;
  output_length?: unknown;
  input_split?: unknown;
  input_merge?: unknown;
}

export function readFunctionSchema(): z.ZodType {
  const fn = readFunction();
  if (!fn.ok) return Functions.RemoteFunctionSchema;

  const type = validateType(fn.value);
  if (!type.ok) return Functions.RemoteFunctionSchema;

  switch (type.value) {
    case "scalar.function":
      return Functions.RemoteScalarFunctionSchema;
    case "vector.function":
      return Functions.RemoteVectorFunctionSchema;
    default:
      return Functions.RemoteFunctionSchema;
  }
}

export function checkFunction(): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check function: ${fn.error}`,
    };
  }

  const result = validateFunction(fn.value);
  if (!result.ok) {
    return { ok: false, value: undefined, error: result.error };
  }

  const checks = [
    checkType,
    checkDescription,
    checkInputSchema,
    checkInputMaps,
    checkTasks,
    checkOutputLength,
    checkInputSplit,
    checkInputMerge,
  ];
  const errors: string[] = [];
  for (const check of checks) {
    const r = check(fn.value);
    if (!r.ok) {
      errors.push(r.error!);
    }
  }
  if (errors.length > 0) {
    return { ok: false, value: undefined, error: errors.join("\n") };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function validateFunction(
  fn: DeserializedFunction,
): Result<Functions.RemoteFunction> {
  const parsed = Functions.RemoteFunctionSchema.safeParse(fn);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}

export function readFunction(dir?: string): Result<DeserializedFunction> {
  const path = dir ? join(dir, "function.json") : "function.json";
  if (!existsSync(path)) {
    return { ok: true, value: {}, error: undefined };
  }
  let fn: unknown;
  try {
    fn = JSON.parse(readFileSync(path, "utf-8"));
  } catch (e) {
    return { ok: true, value: {}, error: undefined };
  }
  if (typeof fn !== "object" || fn === null) {
    return { ok: true, value: {}, error: undefined };
  }
  return { ok: true, value: fn as DeserializedFunction, error: undefined };
}

export function editFunction(
  fields: Partial<Record<keyof Functions.RemoteVectorFunction, unknown | null>>,
): Result<undefined> {
  let fn: Record<string, unknown> = {};

  if (existsSync("function.json")) {
    try {
      const parsed = JSON.parse(readFileSync("function.json", "utf-8"));
      if (typeof parsed === "object" && parsed !== null) {
        fn = parsed;
      }
    } catch {}
  }

  for (const key in fields) {
    const value = (fields as Record<string, unknown>)[key];
    if (value === null) {
      delete fn[key];
    } else if (value !== undefined) {
      fn[key] = value;
    }
  }

  // Serialize in the same field order as objectiveai-rs
  const fieldOrder = [
    "type",
    "description",
    "changelog",
    "input_schema",
    "input_maps",
    "tasks",
    "output_length",
    "input_split",
    "input_merge",
  ];
  const ordered: Record<string, unknown> = {};
  for (const key of fieldOrder) {
    if (key in fn) {
      ordered[key] = fn[key];
    }
  }
  // Preserve any unknown fields at the end
  for (const key in fn) {
    if (!(key in ordered)) {
      ordered[key] = fn[key];
    }
  }

  writeFileSync("function.json", JSON.stringify(ordered, null, 2));
  return { ok: true, value: undefined, error: undefined };
}
