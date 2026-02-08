import z from "zod";
import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";
import { validateType } from "./type";

const OutputLengthSchema =
  Functions.RemoteVectorFunctionSchema.shape.output_length;
type OutputLength = z.infer<typeof OutputLengthSchema>;

export function readOutputLength(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.output_length, error: undefined };
}

export function readOutputLengthSchema(): typeof OutputLengthSchema {
  return OutputLengthSchema;
}

export function checkOutputLength(): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check output_length: ${fn.error}`,
    };
  }

  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to check output_length: type is invalid: ${typeResult.error}`,
    };
  }

  if (typeResult.value !== "vector.function") {
    if (fn.value.output_length !== undefined) {
      return {
        ok: false,
        value: undefined,
        error: `output_length must not be present for type "${typeResult.value}"`,
      };
    }
    return { ok: true, value: undefined, error: undefined };
  }

  const result = validateOutputLength(fn.value);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `output_length is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function delOutputLength(): Result<undefined> {
  return editFunction({ output_length: null });
}

export function editOutputLength(value: unknown): Result<undefined> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit output_length: ${fn.error}`,
    };
  }

  const typeResult = validateType(fn.value);
  if (!typeResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to edit output_length: type is invalid: ${typeResult.error}`,
    };
  }
  if (typeResult.value !== "vector.function") {
    return {
      ok: false,
      value: undefined,
      error: `output_length is not applicable for type "${typeResult.value}"`,
    };
  }

  const result = validateOutputLength({ output_length: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid output_length: ${result.error}`,
    };
  }
  return editFunction({ output_length: result.value });
}

export function validateOutputLength(
  fn: DeserializedFunction,
): Result<OutputLength> {
  const parsed = OutputLengthSchema.safeParse(fn.output_length);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
