import z from "zod";
import { ExpressionSchema } from "./expression/expression";
import {
  InputSchemaSchema,
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
  "An expression which evaluates to a boolean indicating whether to skip this task. Receives: `input`.",
);
export type TaskExpressionSkip = z.infer<typeof TaskExpressionSkipSchema>;

export const TaskExpressionMapSchema = z
  .uint32()
  .describe(
    "Index into the function's `input_maps` 2D array. " +
      "When present, this task is compiled once per element in `input_maps[map]`, producing multiple task instances. " +
      "Each compiled instance's expressions receive the current element as `map`.",
  );
export type TaskExpressionMap = z.infer<typeof TaskExpressionMapSchema>;

export const TaskOutputExpressionSchema = ExpressionSchema.describe(
  "An expression which transforms the task result into a FunctionOutput. " +
  "Receives `output` as one of 4 variants depending on task type: " +
  "a single FunctionOutput (for non-mapped function tasks), an array of FunctionOutputs (for mapped function tasks), " +
  "a VectorCompletionOutput (for non-mapped vector completion tasks), or an array of VectorCompletionOutputs (for mapped vector completion tasks). " +
  "Must return a FunctionOutput valid for the parent function's type: " +
  "scalar functions require a number in [0,1], vector functions require an array of numbers summing to ~1. " +
  "The function's final output is the weighted average of all task outputs using profile weights. " +
  "Receives: `input`, `output`.",
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

export const PlaceholderScalarFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("placeholder.scalar.function"),
    input_schema: InputSchemaSchema,
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A placeholder scalar function task expression. Always outputs 0.5.");
export type PlaceholderScalarFunctionTaskExpression = z.infer<
  typeof PlaceholderScalarFunctionTaskExpressionSchema
>;

export const PlaceholderVectorFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("placeholder.vector.function"),
    input_schema: InputSchemaSchema,
    output_length: z
      .union([
        z.uint32().describe("The fixed length of the output vector."),
        ExpressionSchema.describe(
          "An expression which evaluates to the length of the output vector. Receives: `input`."
        ),
      ])
      .describe("The length of the output vector."),
    input_split: ExpressionSchema.describe(
      "Splits the function input into an array of sub-inputs, one per output element. Receives: `input`."
    ),
    input_merge: ExpressionSchema.describe(
      "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs back into one input. Receives: `input` (an array of sub-inputs)."
    ),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A placeholder vector function task expression. Always outputs an equalized vector.");
export type PlaceholderVectorFunctionTaskExpression = z.infer<
  typeof PlaceholderVectorFunctionTaskExpressionSchema
>;

export const TaskExpressionSchema = z
  .discriminatedUnion("type", [
    ScalarFunctionTaskExpressionSchema,
    VectorFunctionTaskExpressionSchema,
    VectorCompletionTaskExpressionSchema,
    PlaceholderScalarFunctionTaskExpressionSchema,
    PlaceholderVectorFunctionTaskExpressionSchema,
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
      "Expression to transform the task result into a valid function output. Receives: `input`, `output` (the raw FunctionOutput from the nested function).",
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
      "Expression to transform the task result into a valid function output. Receives: `input`, `output` (the raw FunctionOutput from the nested function).",
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
      "Expression to transform the task result into a valid function output. Receives: `input`, `output` (the raw VectorCompletionOutput).",
    ),
  })
  .describe("A vector completion task.");
export type VectorCompletionTask = z.infer<typeof VectorCompletionTaskSchema>;

export const PlaceholderScalarFunctionTaskSchema = z
  .object({
    type: z.literal("placeholder.scalar.function"),
    input_schema: InputSchemaSchema,
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the fixed 0.5 output. Receives: `input`, `output` (the raw FunctionOutput).",
    ),
  })
  .describe("A placeholder scalar function task. Always outputs 0.5.");
export type PlaceholderScalarFunctionTask = z.infer<
  typeof PlaceholderScalarFunctionTaskSchema
>;

export const PlaceholderVectorFunctionTaskSchema = z
  .object({
    type: z.literal("placeholder.vector.function"),
    input_schema: InputSchemaSchema,
    output_length: z
      .union([
        z.uint32().describe("The fixed length of the output vector."),
        ExpressionSchema.describe(
          "An expression which evaluates to the length of the output vector. Receives: `input`."
        ),
      ])
      .describe("The length of the output vector."),
    input_split: ExpressionSchema.describe(
      "Splits the function input into an array of sub-inputs, one per output element. Receives: `input`."
    ),
    input_merge: ExpressionSchema.describe(
      "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs back into one input. Receives: `input` (an array of sub-inputs)."
    ),
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the equalized vector output. Receives: `input`, `output` (the raw FunctionOutput).",
    ),
  })
  .describe("A placeholder vector function task. Always outputs an equalized vector.");
export type PlaceholderVectorFunctionTask = z.infer<
  typeof PlaceholderVectorFunctionTaskSchema
>;

export const TaskSchema = z
  .discriminatedUnion("type", [
    ScalarFunctionTaskSchema,
    VectorFunctionTaskSchema,
    VectorCompletionTaskSchema,
    PlaceholderScalarFunctionTaskSchema,
    PlaceholderVectorFunctionTaskSchema,
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
