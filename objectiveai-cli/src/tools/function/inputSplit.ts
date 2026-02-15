import z from "zod";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";
import { validateType } from "./type";

const InputSplitSchema = Functions.RemoteVectorFunctionSchema.shape.input_split;
type InputSplit = z.infer<typeof InputSplitSchema>;

export function readInputSplit(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.input_split, error: undefined };
}

export function readInputSplitSchema(): typeof InputSplitSchema {
  return InputSplitSchema;
}

export function checkInputSplit(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: undefined, error: `Unable to check input_split: ${read.error}` };
    }
    fn = read.value;
  }

  const typeResult = validateType(fn);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check input_split: type is invalid: ${typeResult.error}`,
    };
  }

  if (typeResult.value !== "vector.function") {
    if (fn.input_split !== undefined) {
      return {
        ok: false,
        value: undefined,
        error: `input_split must not be present for type "${typeResult.value}"`,
      };
    }
    return { ok: true, value: undefined, error: undefined };
  }

  const result = validateInputSplit(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_split is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function delInputSplit(): Result<undefined> {
  return editFunction({ input_split: null });
}

export function editInputSplit(value: unknown): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit input_split: ${fn.error}`,
    };
  }

  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit input_split: type is invalid: ${typeResult.error}`,
    };
  }
  if (typeResult.value !== "vector.function") {
    return {
      ok: false,
      value: undefined,
      error: `input_split is not applicable for type "${typeResult.value}"`,
    };
  }

  const result = validateInputSplit({ input_split: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid input_split: ${result.error}`,
    };
  }
  return editFunction({ input_split: result.value });
}

export function isDefaultInputSplit(): boolean {
  const result = readInputSplit();
  return result.ok && result.value === undefined;
}

export function validateInputSplit(
  fn: DeserializedFunction,
): Result<InputSplit> {
  const parsed = InputSplitSchema.safeParse(fn.input_split);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
