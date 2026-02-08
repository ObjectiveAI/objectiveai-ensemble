import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";

export function readInputSchema(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.input_schema, error: undefined };
}

export function readInputSchemaSchema(): typeof Functions.Expression.InputSchemaSchema {
  return Functions.Expression.InputSchemaSchema;
}

export function checkInputSchema(): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check input_schema: ${fn.error}`,
    };
  }

  const result = validateInputSchema(fn.value);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_schema is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
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
  return editFunction({ input_schema: result.value });
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
