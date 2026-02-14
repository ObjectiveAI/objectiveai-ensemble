import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";

export function readInputSchema(dir?: string): Result<unknown> {
  const fn = readFunction(dir);
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.input_schema, error: undefined };
}

export function readInputSchemaSchema(): typeof Functions.Expression.InputSchemaSchema {
  return Functions.Expression.InputSchemaSchema;
}

export function checkInputSchema(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: undefined, error: `Unable to check input_schema: ${read.error}` };
    }
    fn = read.value;
  }

  const result = validateInputSchema(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_schema is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

function hasArrayProperty(schema: Functions.Expression.InputSchema): boolean {
  if (!("properties" in schema) || typeof schema.properties !== "object" || schema.properties === null) return false;
  for (const val of Object.values(schema.properties as Record<string, unknown>)) {
    if (typeof val === "object" && val !== null && (val as Record<string, unknown>).type === "array") {
      return true;
    }
  }
  return false;
}

/** Check if a schema is valid for a vector function (array or object with array property). */
export function isValidVectorInputSchema(schema: Functions.Expression.InputSchema): boolean {
  if (!("type" in schema)) return false;
  return schema.type === "array" || (schema.type === "object" && hasArrayProperty(schema));
}

export function editInputSchema(value: unknown): Result<undefined> {
  const result = validateInputSchema({ input_schema: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid input_schema: ${result.error}`,
    };
  }

  // Vector functions need an array input (either top-level array or object with array property)
  const fn = readFunction();
  if (fn.ok && fn.value.type === "vector.function") {
    if (!isValidVectorInputSchema(result.value)) {
      return {
        ok: false,
        value: undefined,
        error: `Vector functions require an input schema that is an array or an object with at least one array property.`,
      };
    }
  }

  return editFunction({ input_schema: result.value });
}

export function isDefaultInputSchema(): boolean {
  const result = readInputSchema();
  return result.ok && result.value === undefined;
}

export function validateInputSchema(
  fn: DeserializedFunction,
): Result<Functions.Expression.InputSchema> {
  const parsed = Functions.Expression.InputSchemaSchema.safeParse(
    fn.input_schema,
  );
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
