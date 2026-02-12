import { Functions } from "objectiveai";
import z from "zod";
import { Result } from "../result";
import { readFunction } from "../function/function";
import { validateInputSchema } from "../function/inputSchema";

/**
 * Read the schema for `input` in expression context.
 * Converts the function's input_schema to a Zod schema.
 * Errors if input_schema is not defined or invalid.
 */
export function readInputParamSchema(): Result<z.ZodType> {
  const fn = readFunction();
  if (!fn.ok) {
    return { ok: false, value: undefined, error: fn.error };
  }

  const validated = validateInputSchema(fn.value);
  if (!validated.ok) {
    return {
      ok: false,
      value: undefined,
      error: `input_schema must be defined before reading the input parameter schema: ${validated.error}`,
    };
  }

  const zodSchema = Functions.Expression.InputSchemaExt.toZodSchema(
    validated.value,
  );
  return { ok: true, value: zodSchema, error: undefined };
}
