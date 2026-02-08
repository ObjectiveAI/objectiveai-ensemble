import z from "zod";
import {
  InputMapsExpressionSchema,
  InputSchemaSchema,
} from "./expression/input";
import { TaskExpressionsSchema } from "./task";
import { ExpressionSchema } from "./expression/expression";

// Inline Function

export const InlineScalarFunctionSchema = z
  .object({
    type: z.literal("scalar.function"),
    input_maps: InputMapsExpressionSchema.optional().nullable(),
    tasks: TaskExpressionsSchema,
  })
  .describe("A scalar function defined inline. Each task's output expression must return a number in [0,1]. The function's output is the weighted average of all task outputs using profile weights. If there is only one task, its output becomes the function's output directly.")
  .meta({ title: "InlineScalarFunction" });
export type InlineScalarFunction = z.infer<typeof InlineScalarFunctionSchema>;

export const InlineVectorFunctionSchema = z
  .object({
    type: z.literal("vector.function"),
    input_maps: InputMapsExpressionSchema.optional().nullable(),
    tasks: TaskExpressionsSchema,
    input_split: ExpressionSchema.optional()
      .nullable()
      .describe(
        "Splits the function input into an array of sub-inputs, one per output element. " +
          "The array length must equal `output_length`. Each sub-input, when executed independently, must produce `output_length = 1`. " +
          "Used by execution strategies (e.g., swiss_system) that process subsets of the split inputs in parallel pools. " +
          "Only required when using such a strategy. " +
          "Receives: `input`."
      ),
    input_merge: ExpressionSchema.optional()
      .nullable()
      .describe(
        "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (produced by `input_split`) into a single input. " +
          "The merged input is then executed as a normal function call. " +
          "Used by execution strategies (e.g., swiss_system) that group sub-inputs into pools for parallel evaluation. " +
          "Only required when using such a strategy. " +
          "Receives: `input` (an array of sub-inputs)."
      ),
  })
  .describe("A vector function defined inline. Each task's output expression must return an array of numbers summing to ~1. The function's output is the weighted average of all task outputs using profile weights. If there is only one task, its output becomes the function's output directly.")
  .meta({ title: "InlineVectorFunction" });
export type InlineVectorFunction = z.infer<typeof InlineVectorFunctionSchema>;

export const InlineFunctionSchema = z
  .discriminatedUnion("type", [
    InlineScalarFunctionSchema,
    InlineVectorFunctionSchema,
  ])
  .describe("A function defined inline.");
export type InlineFunction = z.infer<typeof InlineFunctionSchema>;

// Remote Function

export const RemoteScalarFunctionSchema = InlineScalarFunctionSchema.extend({
  description: z.string().describe("The description of the scalar function."),
  changelog: z
    .string()
    .optional()
    .nullable()
    .describe(
      "When present, describes changes from the previous version or versions."
    ),
  input_schema: InputSchemaSchema,
})
  .describe('A scalar function fetched from GitHub. "function.json"')
  .meta({ title: "RemoteScalarFunction" });
export type RemoteScalarFunction = z.infer<typeof RemoteScalarFunctionSchema>;

export const RemoteVectorFunctionSchema = InlineVectorFunctionSchema.extend({
  description: z.string().describe("The description of the vector function."),
  changelog: z
    .string()
    .optional()
    .nullable()
    .describe(
      "When present, describes changes from the previous version or versions."
    ),
  input_schema: InputSchemaSchema,
  output_length: z
    .union([
      z.uint32().describe("The fixed length of the output vector."),
      ExpressionSchema.describe(
        "An expression which evaluates to the length of the output vector. The output length must be determinable from the input alone. Receives: `input`."
      ),
    ])
    .describe("The length of the output vector."),
  input_split: ExpressionSchema.describe(
    "Splits the function input into an array of sub-inputs, one per output element. " +
      "The array length must equal `output_length`. Each sub-input, when executed independently, must produce `output_length = 1`. " +
      "Used by execution strategies (e.g., swiss_system) that process subsets of the split inputs in parallel pools. " +
      "Receives: `input`."
  ),
  input_merge: ExpressionSchema.describe(
    "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (produced by `input_split`) into a single input. " +
      "The merged input is then executed as a normal function call. " +
      "Used by execution strategies (e.g., swiss_system) that group sub-inputs into pools for parallel evaluation. " +
      "Receives: `input` (an array of sub-inputs)."
  ),
})
  .describe('A vector function fetched from GitHub. "function.json"')
  .meta({ title: "RemoteVectorFunction" });
export type RemoteVectorFunction = z.infer<typeof RemoteVectorFunctionSchema>;

export const RemoteFunctionSchema = z
  .discriminatedUnion("type", [
    RemoteScalarFunctionSchema,
    RemoteVectorFunctionSchema,
  ])
  .describe('A remote function fetched from GitHub. "function.json"');
export type RemoteFunction = z.infer<typeof RemoteFunctionSchema>;

// Function

export const FunctionSchema = z
  .union([InlineFunctionSchema, RemoteFunctionSchema])
  .describe("A function.")
  .meta({ title: "Function" });
export type Function = z.infer<typeof FunctionSchema>;
