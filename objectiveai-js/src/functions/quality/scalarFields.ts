import z from "zod";
import { InputSchemaSchema } from "../expression/input.js";
import { convert, type JSONSchema } from "../../json_schema";

/**
 * Zod schema for the fields needed to validate a scalar function's input
 * behavior: input_schema only.
 */
export const ScalarFieldsValidationSchema = z
  .object({
    input_schema: InputSchemaSchema.describe(
      "The input schema defining the structure of function inputs.",
    ),
  })
  .describe(
    "The fields needed to validate a scalar function's input behavior.",
  );

export type ScalarFieldsValidation = z.infer<typeof ScalarFieldsValidationSchema>;
export const ScalarFieldsValidationJsonSchema: JSONSchema = convert(ScalarFieldsValidationSchema);
