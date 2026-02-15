import z from "zod";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";
import { validateType } from "./type";

const InputMergeSchema = Functions.RemoteVectorFunctionSchema.shape.input_merge;
type InputMerge = z.infer<typeof InputMergeSchema>;

export function readInputMerge(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.input_merge, error: undefined };
}

export function readInputMergeSchema(): typeof InputMergeSchema {
  return InputMergeSchema;
}

export function checkInputMerge(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: undefined, error: `Unable to check input_merge: ${read.error}` };
    }
    fn = read.value;
  }

  const typeResult = validateType(fn);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check input_merge: type is invalid: ${typeResult.error}`,
    };
  }

  if (typeResult.value !== "vector.function") {
    if (fn.input_merge !== undefined) {
      return {
        ok: false,
        value: undefined,
        error: `input_merge must not be present for type "${typeResult.value}"`,
      };
    }
    return { ok: true, value: undefined, error: undefined };
  }

  const result = validateInputMerge(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_merge is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function delInputMerge(): Result<undefined> {
  return editFunction({ input_merge: null });
}

export function editInputMerge(value: unknown): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit input_merge: ${fn.error}`,
    };
  }

  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit input_merge: type is invalid: ${typeResult.error}`,
    };
  }
  if (typeResult.value !== "vector.function") {
    return {
      ok: false,
      value: undefined,
      error: `input_merge is not applicable for type "${typeResult.value}"`,
    };
  }

  const result = validateInputMerge({ input_merge: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid input_merge: ${result.error}`,
    };
  }
  return editFunction({ input_merge: result.value });
}

export function isDefaultInputMerge(): boolean {
  const result = readInputMerge();
  return result.ok && result.value === undefined;
}

export function validateInputMerge(
  fn: DeserializedFunction,
): Result<InputMerge> {
  const parsed = InputMergeSchema.safeParse(fn.input_merge);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
