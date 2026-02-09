import { Functions } from "objectiveai";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";

export function readInputMaps(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.input_maps, error: undefined };
}

export function readInputMapsSchema(): typeof Functions.Expression.InputMapsExpressionSchema {
  return Functions.Expression.InputMapsExpressionSchema;
}

export function checkInputMaps(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: undefined, error: `Unable to check input_maps: ${read.error}` };
    }
    fn = read.value;
  }

  if (fn.input_maps === undefined) {
    return { ok: true, value: undefined, error: undefined };
  }

  const result = validateInputMaps(fn);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_maps is invalid: ${result.error}`,
    };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function editInputMaps(value: unknown): Result<undefined> {
  const result = validateInputMaps({ input_maps: value });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid input_maps: ${result.error}`,
    };
  }
  return editFunction({ input_maps: result.value });
}

export function validateInputMaps(
  fn: DeserializedFunction,
): Result<Functions.Expression.InputMapsExpression> {
  const parsed = Functions.Expression.InputMapsExpressionSchema.safeParse(
    fn.input_maps,
  );
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
