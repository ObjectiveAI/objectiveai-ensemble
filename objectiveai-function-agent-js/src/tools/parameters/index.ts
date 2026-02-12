import { existsSync, readFileSync } from "fs";
import z from "zod";
import { Result } from "../result";

const ParametersSchema = z.object({
  depth: z.number().int().nonnegative(),
  min_width: z.int().positive(),
  max_width: z.int().positive(),
});
type Parameters = z.infer<typeof ParametersSchema>;

export function readParameters(): Result<unknown> {
  if (!existsSync("parameters.json")) {
    return { ok: true, value: { depth: 0 }, error: undefined };
  }
  try {
    return { ok: true, value: JSON.parse(readFileSync("parameters.json", "utf-8")), error: undefined };
  } catch {
    return { ok: false, value: undefined, error: "parameters.json is not valid JSON" };
  }
}

export function readParametersSchema(): typeof ParametersSchema {
  return ParametersSchema;
}

export function validateParameters(value: unknown): Result<Parameters> {
  const parsed = ParametersSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}

export function checkParameters(): Result<undefined> {
  const raw = readParameters();
  if (!raw.ok) {
    return { ok: false, value: undefined, error: raw.error };
  }
  const result = validateParameters(raw.value);
  if (!result.ok) {
    return { ok: false, value: undefined, error: `Parameters are invalid: ${result.error}` };
  }
  return { ok: true, value: undefined, error: undefined };
}
