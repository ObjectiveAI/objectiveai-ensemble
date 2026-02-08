import { existsSync, readFileSync, writeFileSync } from "fs";
import { Functions } from "objectiveai";
import { Result } from "../result";

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

export function readFunctionSchema(): typeof Functions.RemoteFunctionSchema {
  return Functions.RemoteFunctionSchema;
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

export function readFunction(): Result<DeserializedFunction> {
  if (!existsSync("function.json")) {
    return { ok: true, value: {}, error: undefined };
  }
  let fn: unknown;
  try {
    fn = JSON.parse(readFileSync("function.json", "utf-8"));
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
