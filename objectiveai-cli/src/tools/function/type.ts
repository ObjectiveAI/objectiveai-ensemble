import z from "zod";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";

const FunctionTypeSchema = z.enum([
  ...new Set(
    Functions.RemoteFunctionSchema.options.map((opt) => opt.shape.type.value),
  ),
] as [string, ...string[]]);
type FunctionType = z.infer<typeof FunctionTypeSchema>;

export function readType(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.type, error: undefined };
}

export function readTypeSchema(): typeof FunctionTypeSchema {
  return FunctionTypeSchema;
}

export function checkType(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: undefined, error: `Unable to check type: ${read.error}` };
    }
    fn = read.value;
  }

  const result = validateType(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Type is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function editType(value: unknown): Result<undefined> {
  const result = validateType({ type: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid type: ${result.error}`,
    };
  }
  return editFunction({ type: result.value });
}

export function isDefaultType(): boolean {
  const result = readType();
  return result.ok && result.value === undefined;
}

export function validateType(fn: DeserializedFunction): Result<FunctionType> {
  const parsed = FunctionTypeSchema.safeParse(fn.type);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
