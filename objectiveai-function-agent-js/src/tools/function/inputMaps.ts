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

export function appendInputMap(value: unknown): Result<string> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to append input_map: ${fn.error}`,
    };
  }

  const existing = Array.isArray(fn.value.input_maps) ? fn.value.input_maps : [];
  const newInputMaps = [...existing, value];

  const result = validateInputMaps({ input_maps: newInputMaps });
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Invalid input_maps after append: ${result.error}`,
    };
  }
  const editResult = editFunction({ input_maps: result.value });
  if (!editResult.ok) {
    return editResult as Result<string>;
  }
  return { ok: true, value: `new length: ${newInputMaps.length}`, error: undefined };
}

export function delInputMap(index: number): Result<string> {
  const fn = readFunction();
  if (!fn.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to delete input_map: ${fn.error}`,
    };
  }

  if (!Array.isArray(fn.value.input_maps)) {
    return {
      ok: false,
      value: undefined,
      error: "Unable to delete input_map: input_maps is not an array",
    };
  }
  if (index < 0 || index >= fn.value.input_maps.length) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to delete input_map: index ${index} is out of bounds (length ${fn.value.input_maps.length})`,
    };
  }

  const newInputMaps = [...fn.value.input_maps];
  newInputMaps.splice(index, 1);
  const editResult = editFunction({ input_maps: newInputMaps.length > 0 ? newInputMaps : undefined });
  if (!editResult.ok) {
    return editResult as Result<string>;
  }
  return { ok: true, value: `new length: ${newInputMaps.length}`, error: undefined };
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
