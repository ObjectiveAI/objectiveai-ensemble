import z from "zod";
import {
  InputMapsExpressionSchema,
  InputSchemaSchema,
  QualityInputMapsExpressionSchema,
  QualityVectorFunctionInputSchemaSchema,
} from "./expression/input";
import {
  QualityBranchScalarFunctionTasksExpressionsSchema,
  QualityBranchVectorFunctionTasksExpressionsSchema,
  QualityLeafScalarTasksExpressionsSchema,
  QualityLeafVectorTasksExpressionsSchema,
  TaskExpressionsSchema,
} from "./task";
import { ExpressionSchema } from "./expression/expression";
import { convert, type JSONSchema } from "../json_schema";

// Inline Function

export const InlineScalarFunctionSchema = z
  .object({
    type: z.literal("scalar.function"),
    input_maps: InputMapsExpressionSchema.optional().nullable(),
    tasks: TaskExpressionsSchema,
  })
  .describe(
    "A scalar function defined inline. Each task's output expression must return a number in [0,1]. The function's output is the weighted average of all task outputs using profile weights. If there is only one task, its output becomes the function's output directly.",
  )
  .meta({ title: "InlineScalarFunction" });
export type InlineScalarFunction = z.infer<typeof InlineScalarFunctionSchema>;
export const InlineScalarFunctionJsonSchema: JSONSchema = convert(
  InlineScalarFunctionSchema,
);

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
          "Receives: `input`.",
      ),
    input_merge: ExpressionSchema.optional()
      .nullable()
      .describe(
        "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (produced by `input_split`) into a single input. " +
          "The merged input is then executed as a normal function call. " +
          "Used by execution strategies (e.g., swiss_system) that group sub-inputs into pools for parallel evaluation. " +
          "Only required when using such a strategy. " +
          "Receives: `input` (an array of sub-inputs).",
      ),
  })
  .describe(
    "A vector function defined inline. Each task's output expression must return an array of numbers summing to ~1. The function's output is the weighted average of all task outputs using profile weights. If there is only one task, its output becomes the function's output directly.",
  )
  .meta({ title: "InlineVectorFunction" });
export type InlineVectorFunction = z.infer<typeof InlineVectorFunctionSchema>;
export const InlineVectorFunctionJsonSchema: JSONSchema = convert(
  InlineVectorFunctionSchema,
);

export const InlineFunctionSchema = z
  .discriminatedUnion("type", [
    InlineScalarFunctionSchema,
    InlineVectorFunctionSchema,
  ])
  .describe("A function defined inline.")
  .meta({ title: "InlineFunction" });
export type InlineFunction = z.infer<typeof InlineFunctionSchema>;
export const InlineFunctionJsonSchema: JSONSchema =
  convert(InlineFunctionSchema);

// Remote Function

export const RemoteScalarFunctionSchema = InlineScalarFunctionSchema.extend({
  description: z.string().describe("The description of the scalar function."),
  changelog: z
    .string()
    .optional()
    .nullable()
    .describe(
      "When present, describes changes from the previous version or versions.",
    ),
  input_schema: InputSchemaSchema,
})
  .describe('A scalar function fetched from GitHub. "function.json"')
  .meta({ title: "RemoteScalarFunction" });
export type RemoteScalarFunction = z.infer<typeof RemoteScalarFunctionSchema>;
export const RemoteScalarFunctionJsonSchema: JSONSchema = convert(
  RemoteScalarFunctionSchema,
);

export const RemoteVectorFunctionSchema = InlineVectorFunctionSchema.extend({
  description: z.string().describe("The description of the vector function."),
  changelog: z
    .string()
    .optional()
    .nullable()
    .describe(
      "When present, describes changes from the previous version or versions.",
    ),
  input_schema: InputSchemaSchema,
  output_length: z
    .union([
      z.uint32().describe("The fixed length of the output vector."),
      ExpressionSchema.describe(
        "An expression which evaluates to the length of the output vector. The output length must be determinable from the input alone. Receives: `input`.",
      ),
    ])
    .describe("The length of the output vector."),
  input_split: ExpressionSchema.describe(
    "Splits the function input into an array of sub-inputs, one per output element. " +
      "The array length must equal `output_length`. Each sub-input, when executed independently, must produce `output_length = 1`. " +
      "Used by execution strategies (e.g., swiss_system) that process subsets of the split inputs in parallel pools. " +
      "Receives: `input`.",
  ),
  input_merge: ExpressionSchema.describe(
    "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (produced by `input_split`) into a single input. " +
      "The merged input is then executed as a normal function call. " +
      "Used by execution strategies (e.g., swiss_system) that group sub-inputs into pools for parallel evaluation. " +
      "Receives: `input` (an array of sub-inputs).",
  ),
})
  .describe('A vector function fetched from GitHub. "function.json"')
  .meta({ title: "RemoteVectorFunction" });
export type RemoteVectorFunction = z.infer<typeof RemoteVectorFunctionSchema>;
export const RemoteVectorFunctionJsonSchema: JSONSchema = convert(
  RemoteVectorFunctionSchema,
);

export const RemoteFunctionSchema = z
  .discriminatedUnion("type", [
    RemoteScalarFunctionSchema,
    RemoteVectorFunctionSchema,
  ])
  .describe('A remote function fetched from GitHub. "function.json"')
  .meta({ title: "RemoteFunction" });
export type RemoteFunction = z.infer<typeof RemoteFunctionSchema>;
export const RemoteFunctionJsonSchema: JSONSchema =
  convert(RemoteFunctionSchema);

// Function

export const FunctionSchema = z
  .union([InlineFunctionSchema, RemoteFunctionSchema])
  .describe("A function.")
  .meta({ title: "Function" });
export type Function = z.infer<typeof FunctionSchema>;
export const FunctionJsonSchema: JSONSchema = convert(FunctionSchema);

// Quality Leaf Remote Function (depth 0: vector.completion tasks only)

export const QualityLeafRemoteScalarFunctionSchema =
  RemoteScalarFunctionSchema.extend({
    input_maps: z.undefined(),
    tasks: QualityLeafScalarTasksExpressionsSchema,
  })
    .describe(RemoteScalarFunctionSchema.description!)
    .meta({ title: "QualityLeafRemoteScalarFunction" });
export type QualityLeafRemoteScalarFunction = z.infer<
  typeof QualityLeafRemoteScalarFunctionSchema
>;
export const QualityLeafRemoteScalarFunctionJsonSchema: JSONSchema = convert(
  QualityLeafRemoteScalarFunctionSchema,
);

export const QualityLeafRemoteVectorFunctionSchema =
  RemoteVectorFunctionSchema.extend({
    input_schema: QualityVectorFunctionInputSchemaSchema,
    input_maps: QualityInputMapsExpressionSchema.optional().nullable(),
    tasks: QualityLeafVectorTasksExpressionsSchema,
  })
    .describe(RemoteVectorFunctionSchema.description!)
    .meta({ title: "QualityLeafRemoteVectorFunction" });
export type QualityLeafRemoteVectorFunction = z.infer<
  typeof QualityLeafRemoteVectorFunctionSchema
>;
export const QualityLeafRemoteVectorFunctionJsonSchema: JSONSchema = convert(
  QualityLeafRemoteVectorFunctionSchema,
);

export const QualityLeafRemoteFunctionSchema = z
  .discriminatedUnion("type", [
    QualityLeafRemoteScalarFunctionSchema,
    QualityLeafRemoteVectorFunctionSchema,
  ])
  .describe(RemoteFunctionSchema.description!)
  .meta({ title: "QualityLeafRemoteFunction" });
export type QualityLeafRemoteFunction = z.infer<
  typeof QualityLeafRemoteFunctionSchema
>;
export const QualityLeafRemoteFunctionJsonSchema: JSONSchema = convert(
  QualityLeafRemoteFunctionSchema,
);

// Quality Branch Remote Function (depth > 0: function/placeholder tasks)

export const QualityBranchRemoteScalarFunctionSchema =
  RemoteScalarFunctionSchema.extend({
    input_maps: z.undefined(),
    tasks: QualityBranchScalarFunctionTasksExpressionsSchema,
  })
    .describe(RemoteScalarFunctionSchema.description!)
    .meta({ title: "QualityBranchRemoteScalarFunction" });
export type QualityBranchRemoteScalarFunction = z.infer<
  typeof QualityBranchRemoteScalarFunctionSchema
>;
export const QualityBranchRemoteScalarFunctionJsonSchema: JSONSchema = convert(
  QualityBranchRemoteScalarFunctionSchema,
);

export const QualityBranchRemoteVectorFunctionSchema =
  RemoteVectorFunctionSchema.extend({
    input_schema: QualityVectorFunctionInputSchemaSchema,
    input_maps: QualityInputMapsExpressionSchema.optional().nullable(),
    tasks: QualityBranchVectorFunctionTasksExpressionsSchema,
  })
    .describe(RemoteVectorFunctionSchema.description!)
    .meta({ title: "QualityBranchRemoteVectorFunction" });
export type QualityBranchRemoteVectorFunction = z.infer<
  typeof QualityBranchRemoteVectorFunctionSchema
>;
export const QualityBranchRemoteVectorFunctionJsonSchema: JSONSchema = convert(
  QualityBranchRemoteVectorFunctionSchema,
);

export const QualityBranchRemoteFunctionSchema = z
  .discriminatedUnion("type", [
    QualityBranchRemoteScalarFunctionSchema,
    QualityBranchRemoteVectorFunctionSchema,
  ])
  .describe(RemoteFunctionSchema.description!)
  .meta({ title: "QualityBranchRemoteFunction" });
export type QualityBranchRemoteFunction = z.infer<
  typeof QualityBranchRemoteFunctionSchema
>;
export const QualityBranchRemoteFunctionJsonSchema: JSONSchema = convert(
  QualityBranchRemoteFunctionSchema,
);
