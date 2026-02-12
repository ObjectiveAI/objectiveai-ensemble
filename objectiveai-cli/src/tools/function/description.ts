import z from "zod";
import { Result } from "../result";
import { DeserializedFunction, editFunction, readFunction } from "./function";

const DescriptionSchema = z.string().nonempty();
type Description = z.infer<typeof DescriptionSchema>;

export function readDescription(): Result<unknown> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }
  return { ok: true, value: fn.value.description, error: undefined };
}

export function readDescriptionSchema(): typeof DescriptionSchema {
  return DescriptionSchema;
}

export function checkDescription(fn?: DeserializedFunction): Result<undefined> {
  if (!fn) {
    const read = readFunction();
    if (!read.ok) {
      return { ok: false, value: undefined, error: `Unable to check description: ${read.error}` };
    }
    fn = read.value;
  }

  const result = validateDescription(fn);
  if (!result.ok) {
    return { ok: false, value: undefined, error: `Description is invalid: ${result.error}` };
  }

  return { ok: true, value: undefined, error: undefined };
}

export function editDescription(value: unknown): Result<undefined> {
  const result = validateDescription({ description: value });
  if (!result.ok) {
    return { ok: false, value: undefined, error: `Invalid description: ${result.error}` };
  }
  return editFunction({ description: result.value });
}

export function isDefaultDescription(): boolean {
  const result = readDescription();
  return result.ok && result.value === undefined;
}

export function validateDescription(
  fn: DeserializedFunction,
): Result<Description> {
  const parsed = DescriptionSchema.safeParse(fn.description);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}
