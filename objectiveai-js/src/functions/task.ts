import z from "zod";
import { ExpressionSchema } from "./expression/expression";
import {
  InputValueExpressionSchema,
  InputValueSchema,
} from "./expression/input";
import {
  MessagesExpressionSchema,
  MessagesSchema,
} from "src/chat/completions/request/message";
import {
  ToolsExpressionSchema,
  ToolsSchema,
} from "src/chat/completions/request/tool";
import {
  VectorResponsesExpressionSchema,
  VectorResponsesSchema,
} from "src/vector/completions/request/vector_response";

// Task Expression

export const TaskExpressionSkipSchema = ExpressionSchema.describe(
  "An expression which evaluates to a boolean indicating whether to skip this task.",
);
export type TaskExpressionSkip = z.infer<typeof TaskExpressionSkipSchema>;

export const TaskExpressionMapSchema = z
  .uint32()
  .describe(
    "If present, indicates that this task should be ran once for each entry in the specified input map (input map is a 2D array indexed by this value).",
  );
export type TaskExpressionMap = z.infer<typeof TaskExpressionMapSchema>;

export const TaskOutputExpressionSchema = ExpressionSchema.describe(
  "An expression which transforms the task result into a FunctionOutput. " +
  "Receives 'output' as one of 4 variants depending on task type: " +
  "a single FunctionOutput (for non-mapped function tasks), an array of FunctionOutputs (for mapped function tasks), " +
  "a VectorCompletionOutput (for non-mapped vector completion tasks), or an array of VectorCompletionOutputs (for mapped vector completion tasks). " +
  "Must return a FunctionOutput valid for the parent function's type: " +
  "scalar functions require a number in [0,1], vector functions require an array of numbers summing to ~1. " +
  "The function's final output is the weighted average of all task outputs using profile weights.",
);
export type TaskOutputExpression = z.infer<typeof TaskOutputExpressionSchema>;

export const ScalarFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("scalar.function"),
    owner: z
      .string()
      .describe("The owner of the GitHub repository containing the function."),
    repository: z
      .string()
      .describe("The name of the GitHub repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the GitHub repository containing the function.",
      ),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A scalar function task expression.");
export type ScalarFunctionTaskExpression = z.infer<
  typeof ScalarFunctionTaskExpressionSchema
>;

export const VectorFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("vector.function"),
    owner: z
      .string()
      .describe("The owner of the GitHub repository containing the function."),
    repository: z
      .string()
      .describe("The name of the GitHub repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the GitHub repository containing the function.",
      ),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A vector function task expression.");
export type VectorFunctionTaskExpression = z.infer<
  typeof VectorFunctionTaskExpressionSchema
>;

export const VectorCompletionTaskExpressionSchema = z
  .object({
    type: z.literal("vector.completion"),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    messages: MessagesExpressionSchema,
    tools: ToolsExpressionSchema.optional()
      .nullable()
      .describe(
        `${ToolsExpressionSchema.description} These are readonly and will only be useful for explaining prior tool calls or otherwise influencing behavior.`,
      ),
    responses: VectorResponsesExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A vector completion task expression.");
export type VectorCompletion = z.infer<
  typeof VectorCompletionTaskExpressionSchema
>;

export const TaskExpressionSchema = z
  .discriminatedUnion("type", [
    ScalarFunctionTaskExpressionSchema,
    VectorFunctionTaskExpressionSchema,
    VectorCompletionTaskExpressionSchema,
  ])
  .describe(
    "A task to be executed as part of the function. Will first be compiled using the parent function's input. May be skipped or mapped.",
  );
export type TaskExpression = z.infer<typeof TaskExpressionSchema>;

export const TaskExpressionsSchema = z
  .array(TaskExpressionSchema)
  .describe(
    "The list of tasks to be executed as part of the function. Each will first be compiled using the parent function's input.",
  );
export type TaskExpressions = z.infer<typeof TaskExpressionsSchema>;

// Task

export const ScalarFunctionTaskSchema = z
  .object({
    type: z.literal("scalar.function"),
    owner: z
      .string()
      .describe("The owner of the GitHub repository containing the function."),
    repository: z
      .string()
      .describe("The name of the GitHub repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the GitHub repository containing the function.",
      ),
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the task result. Receives: input (function input), output (the raw FunctionOutput from the nested function).",
    ),
  })
  .describe("A scalar function task.");
export type ScalarFunctionTask = z.infer<typeof ScalarFunctionTaskSchema>;

export const VectorFunctionTaskSchema = z
  .object({
    type: z.literal("vector.function"),
    owner: z
      .string()
      .describe("The owner of the GitHub repository containing the function."),
    repository: z
      .string()
      .describe("The name of the GitHub repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the GitHub repository containing the function.",
      ),
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the task result. Receives: input (function input), output (the raw FunctionOutput from the nested function).",
    ),
  })
  .describe("A vector function task.");
export type VectorFunctionTask = z.infer<typeof VectorFunctionTaskSchema>;

export const VectorCompletionTaskSchema = z
  .object({
    type: z.literal("vector.completion"),
    messages: MessagesSchema,
    tools: ToolsSchema.optional(),
    responses: VectorResponsesSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the task result. Receives: input (function input), output (the raw VectorCompletionOutput).",
    ),
  })
  .describe("A vector completion task.");
export type VectorCompletionTask = z.infer<typeof VectorCompletionTaskSchema>;

export const TaskSchema = z
  .discriminatedUnion("type", [
    ScalarFunctionTaskSchema,
    VectorFunctionTaskSchema,
    VectorCompletionTaskSchema,
  ])
  .describe("A task to be executed as part of the function.");
export type Task = z.infer<typeof TaskSchema>;

export const CompiledTaskSchema = z
  .union([
    TaskSchema.describe("An un-mapped, un-skipped task."),
    z
      .array(TaskSchema)
      .describe("A task which was mapped over an input array."),
    z.null().describe("A task which was skipped."),
  ])
  .describe("A compiled task, which may be un-mapped, mapped, or skipped.");
export type CompiledTask = z.infer<typeof CompiledTaskSchema>;

export const CompiledTasksSchema = z
  .array(CompiledTaskSchema)
  .describe(
    "The compiled list of tasks to be executed as part of the function.",
  );
export type CompiledTasks = z.infer<typeof CompiledTasksSchema>;
