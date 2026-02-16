import { Functions } from "objectiveai";
import z from "zod";

// Placeholder task schemas with name/spec metadata

export const PlaceholderScalarFunctionTaskExpressionSchema =
  Functions.PlaceholderScalarFunctionTaskExpressionSchema.extend({
    name: z.string().describe("Short name for the sub-function (used as directory and repo name)"),
    spec: z.string().describe("Specification describing what the sub-function should evaluate"),
  });

export const PlaceholderVectorFunctionTaskExpressionSchema =
  Functions.PlaceholderVectorFunctionTaskExpressionSchema.extend({
    name: z.string().describe("Short name for the sub-function (used as directory and repo name)"),
    spec: z.string().describe("Specification describing what the sub-function should evaluate"),
  });

export const TaskExpressionSchema = z.discriminatedUnion("type", [
  Functions.ScalarFunctionTaskExpressionSchema,
  Functions.VectorFunctionTaskExpressionSchema,
  Functions.VectorCompletionTaskExpressionSchema,
  PlaceholderScalarFunctionTaskExpressionSchema,
  PlaceholderVectorFunctionTaskExpressionSchema,
]);

const TaskExpressionsSchema = z.array(TaskExpressionSchema);

// ---------------------------------------------------------------------------
// Required (complete function ready for submission)
// ---------------------------------------------------------------------------

export const RemoteScalarFunctionSchema = Functions.RemoteScalarFunctionSchema.extend({
  tasks: TaskExpressionsSchema,
});

export const RemoteVectorFunctionSchema = Functions.RemoteVectorFunctionSchema.extend({
  tasks: TaskExpressionsSchema,
});

export const RemoteFunctionSchema = z.discriminatedUnion("type", [
  RemoteScalarFunctionSchema,
  RemoteVectorFunctionSchema,
]);

export type RemoteFunction = z.infer<typeof RemoteFunctionSchema>;

// ---------------------------------------------------------------------------
// Partial (function being authored incrementally)
// ---------------------------------------------------------------------------

export const PartialScalarFunctionSchema = RemoteScalarFunctionSchema.partial().extend({
  type: z.literal("scalar.function"),
});

export const PartialVectorFunctionSchema = RemoteVectorFunctionSchema.partial().extend({
  type: z.literal("vector.function"),
});

export const PartialFunctionSchema = z.discriminatedUnion("type", [
  PartialScalarFunctionSchema,
  PartialVectorFunctionSchema,
]);

export type PartialFunction = z.infer<typeof PartialFunctionSchema>;
