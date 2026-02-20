import z from "zod";
import { InputSchemaSchema } from "../expression/input.js";
import { ExpressionSchema } from "../expression/expression.js";
import { convert, type JSONSchema } from "../../json_schema";

/**
 * Zod schema for the 4 fields needed to validate a vector function's
 * split/merge behavior: input_schema, output_length, input_split, input_merge.
 */
export const VectorFieldsValidationSchema = z
  .object({
    input_schema: InputSchemaSchema.describe(
      "The input schema defining the structure of function inputs.",
    ),
    output_length: z
      .union([
        z.number().int().positive().describe("A fixed output length."),
        ExpressionSchema.describe(
          "An expression evaluating to the output length. Receives: `input`.",
        ),
      ])
      .describe("The length of the output vector, or an expression computing it from input."),
    input_split: ExpressionSchema.describe(
      "Splits the function input into an array of sub-inputs, one per output element. " +
        "The array length must equal `output_length`. Each sub-input, when executed independently, must produce `output_length = 1`. " +
        "Receives: `input`.",
    ),
    input_merge: ExpressionSchema.describe(
      "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (produced by `input_split`) into a single input. " +
        "Receives: `input` (an array of sub-inputs).",
    ),
  })
  .describe(
    "The 4 fields needed to validate a vector function's split/merge behavior.",
  );

export type VectorFieldsValidation = z.infer<typeof VectorFieldsValidationSchema>;
export const VectorFieldsValidationJsonSchema: JSONSchema = convert(VectorFieldsValidationSchema);
