import z from "zod";
import { QualityVectorFunctionInputSchemaSchema } from "../expression/input";
import {
  QualityScalarFunctionTaskExpressionSchema,
  QualityVectorCompletionTaskExpressionSchema,
  QualityVectorFunctionTaskExpressionSchema,
  PlaceholderScalarFunctionTaskExpressionSchema,
  PlaceholderVectorFunctionTaskExpressionSchema,
  TaskExpressionsSchema as CoreTaskExpressionsSchema,
} from "../task";
import {
  RemoteScalarFunctionSchema as CoreRemoteScalarFunctionSchema,
  RemoteVectorFunctionSchema as CoreRemoteVectorFunctionSchema,
  RemoteFunctionSchema as CoreRemoteFunctionSchema,
} from "../function";
import { InputMapsExpressionSchema } from "./expression/input";

// Quality Task Expressions

export const TaskExpressionSchema = z
  .discriminatedUnion("type", [
    QualityScalarFunctionTaskExpressionSchema,
    QualityVectorFunctionTaskExpressionSchema,
    QualityVectorCompletionTaskExpressionSchema,
    PlaceholderScalarFunctionTaskExpressionSchema,
    PlaceholderVectorFunctionTaskExpressionSchema,
  ])
  .describe(
    "A task to be executed as part of the function. " +
      "At depth 0, only vector.completion tasks are allowed. " +
      "At depth > 0, only function and placeholder tasks are allowed. " +
      "Map indices must reference valid input_maps entries. " +
      "In scalar functions: only unmapped scalar-like tasks. " +
      "In vector functions: either unmapped vector-like tasks or mapped scalar-like tasks.",
  );
export type TaskExpression = z.infer<typeof TaskExpressionSchema>;

export const TaskExpressionsSchema = z
  .array(TaskExpressionSchema)
  .min(1)
  .describe(
    CoreTaskExpressionsSchema.description! +
      " Must contain at least 1 task." +
      " At most 50% of tasks may have a map index (unless there is only 1 task)." +
      " Task count must be within min_width and max_width from parameters.",
  );
export type TaskExpressions = z.infer<typeof TaskExpressionsSchema>;

// Quality Remote Function

export const RemoteScalarFunctionSchema =
  CoreRemoteScalarFunctionSchema.extend({
    input_maps: InputMapsExpressionSchema.optional().nullable(),
    tasks: TaskExpressionsSchema,
  }).describe(CoreRemoteScalarFunctionSchema.description!);
export type RemoteScalarFunction = z.infer<typeof RemoteScalarFunctionSchema>;

export const RemoteVectorFunctionSchema =
  CoreRemoteVectorFunctionSchema.extend({
    input_schema: QualityVectorFunctionInputSchemaSchema,
    input_maps: InputMapsExpressionSchema.optional().nullable(),
    tasks: TaskExpressionsSchema,
  }).describe(CoreRemoteVectorFunctionSchema.description!);
export type RemoteVectorFunction = z.infer<typeof RemoteVectorFunctionSchema>;

export const RemoteFunctionSchema = z
  .discriminatedUnion("type", [
    RemoteScalarFunctionSchema,
    RemoteVectorFunctionSchema,
  ])
  .describe(CoreRemoteFunctionSchema.description!);
export type RemoteFunction = z.infer<typeof RemoteFunctionSchema>;
