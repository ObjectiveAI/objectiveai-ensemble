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
  QualityMessagesExpressionSchema,
  QualityMessagesSchema,
} from "src/chat/completions/request/message";
import {
  ToolsExpressionSchema,
  ToolsSchema,
} from "src/chat/completions/request/tool";
import {
  QualityScalarVectorResponsesExpressionSchema,
  QualityScalarVectorResponsesSchema,
  QualityVectorVectorResponsesExpressionSchema,
  VectorResponsesExpressionSchema,
  VectorResponsesSchema,
} from "src/vector/completions/request/vector_response";
import { convert, type JSONSchema } from "../json_schema";
import { RemoteSchema } from "./remote";

// Task Expression

export const TaskExpressionSkipSchema = ExpressionSchema.describe(
  "An expression which evaluates to a boolean indicating whether to skip this task. Receives: `input`.",
).meta({ title: "Expression", wrapper: true });
export type TaskExpressionSkip = z.infer<typeof TaskExpressionSkipSchema>;
export const TaskExpressionSkipJsonSchema: JSONSchema = convert(
  TaskExpressionSkipSchema,
);

export const TaskExpressionMapSchema = z
  .uint32()
  .describe(
    "Index into the function's `input_maps` 2D array. " +
      "When present, this task is compiled once per element in `input_maps[map]`, producing multiple task instances. " +
      "Each compiled instance's expressions receive the current element as `map`.",
  );
export type TaskExpressionMap = z.infer<typeof TaskExpressionMapSchema>;
export const TaskExpressionMapJsonSchema: JSONSchema = convert(
  TaskExpressionMapSchema,
);

export const QualityTaskExpressionMapSchema = z
  .uint32()
  .describe(TaskExpressionMapSchema.description! + " Unique across tasks.");
export type QualityTaskExpressionMap = z.infer<
  typeof QualityTaskExpressionMapSchema
>;
export const QualityTaskExpressionMapJsonSchema: JSONSchema = convert(
  QualityTaskExpressionMapSchema,
);

export const TaskOutputExpressionSchema = ExpressionSchema.describe(
  "An expression which transforms the task result into a FunctionOutput. " +
    "Receives `output` as one of 4 variants depending on task type: " +
    "a single FunctionOutput (for non-mapped function tasks), an array of FunctionOutputs (for mapped function tasks), " +
    "a VectorCompletionOutput (for non-mapped vector completion tasks), or an array of VectorCompletionOutputs (for mapped vector completion tasks). " +
    "Must return a FunctionOutput valid for the parent function's type: " +
    "scalar functions require a number in [0,1], vector functions require an array of numbers summing to ~1. " +
    "The function's final output is the weighted average of all task outputs using profile weights. " +
    "Receives: `input`, `output`.",
).meta({ title: "Expression", wrapper: true });
export type TaskOutputExpression = z.infer<typeof TaskOutputExpressionSchema>;
export const TaskOutputExpressionJsonSchema: JSONSchema = convert(
  TaskOutputExpressionSchema,
);

export const ScalarFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("scalar.function"),
    remote: RemoteSchema,
    owner: z
      .string()
      .describe("The owner of the repository containing the function."),
    repository: z
      .string()
      .describe("The name of the repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the repository containing the function.",
      ),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A scalar function task expression.")
  .meta({ title: "ScalarFunctionTaskExpression" });
export type ScalarFunctionTaskExpression = z.infer<
  typeof ScalarFunctionTaskExpressionSchema
>;
export const ScalarFunctionTaskExpressionJsonSchema: JSONSchema = convert(
  ScalarFunctionTaskExpressionSchema,
);

export const QualityScalarFunctionTaskExpressionSchema = z
  .object({
    type: ScalarFunctionTaskExpressionSchema.shape.type,
    remote: ScalarFunctionTaskExpressionSchema.shape.remote,
    owner: ScalarFunctionTaskExpressionSchema.shape.owner,
    repository: ScalarFunctionTaskExpressionSchema.shape.repository,
    commit: ScalarFunctionTaskExpressionSchema.shape.commit,
    skip: ScalarFunctionTaskExpressionSchema.shape.skip,
    map: QualityTaskExpressionMapSchema.optional().nullable(),
    input: ScalarFunctionTaskExpressionSchema.shape.input,
    output: ScalarFunctionTaskExpressionSchema.shape.output,
  })
  .describe(ScalarFunctionTaskExpressionSchema.description!)
  .meta({ title: "QualityScalarFunctionTaskExpression" });
export type QualityScalarFunctionTaskExpression = z.infer<
  typeof QualityScalarFunctionTaskExpressionSchema
>;
export const QualityScalarFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityScalarFunctionTaskExpressionSchema);

export const VectorFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("vector.function"),
    remote: RemoteSchema,
    owner: z
      .string()
      .describe("The owner of the repository containing the function."),
    repository: z
      .string()
      .describe("The name of the repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the repository containing the function.",
      ),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe("A vector function task expression.")
  .meta({ title: "VectorFunctionTaskExpression" });
export type VectorFunctionTaskExpression = z.infer<
  typeof VectorFunctionTaskExpressionSchema
>;
export const VectorFunctionTaskExpressionJsonSchema: JSONSchema = convert(
  VectorFunctionTaskExpressionSchema,
);

export const QualityVectorFunctionTaskExpressionSchema = z
  .object({
    type: VectorFunctionTaskExpressionSchema.shape.type,
    remote: VectorFunctionTaskExpressionSchema.shape.remote,
    owner: VectorFunctionTaskExpressionSchema.shape.owner,
    repository: VectorFunctionTaskExpressionSchema.shape.repository,
    commit: VectorFunctionTaskExpressionSchema.shape.commit,
    skip: VectorFunctionTaskExpressionSchema.shape.skip,
    map: QualityTaskExpressionMapSchema.optional().nullable(),
    input: VectorFunctionTaskExpressionSchema.shape.input,
    output: VectorFunctionTaskExpressionSchema.shape.output,
  })
  .describe(VectorFunctionTaskExpressionSchema.description!)
  .meta({ title: "QualityVectorFunctionTaskExpression" });
export type QualityVectorFunctionTaskExpression = z.infer<
  typeof QualityVectorFunctionTaskExpressionSchema
>;
export const QualityVectorFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityVectorFunctionTaskExpressionSchema);

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
  .describe("A vector completion task expression.")
  .meta({ title: "VectorCompletionTaskExpression" });
export type VectorCompletion = z.infer<
  typeof VectorCompletionTaskExpressionSchema
>;
export const VectorCompletionTaskExpressionJsonSchema: JSONSchema = convert(
  VectorCompletionTaskExpressionSchema,
);

export const QualityScalarVectorCompletionTaskExpressionSchema = z
  .object({
    type: VectorCompletionTaskExpressionSchema.shape.type,
    skip: VectorCompletionTaskExpressionSchema.shape.skip,
    map: z.undefined(),
    messages: QualityMessagesExpressionSchema,
    tools: VectorCompletionTaskExpressionSchema.shape.tools,
    responses: QualityScalarVectorResponsesExpressionSchema,
    output: VectorCompletionTaskExpressionSchema.shape.output,
  })
  .describe(
    VectorCompletionTaskExpressionSchema.description! +
      " Message content and responses must be arrays of content parts, not plain strings.",
  )
  .meta({ title: "QualityScalarVectorCompletionTaskExpression" });
export type QualityScalarVectorCompletionTaskExpression = z.infer<
  typeof QualityScalarVectorCompletionTaskExpressionSchema
>;
export const QualityScalarVectorCompletionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityScalarVectorCompletionTaskExpressionSchema);

export const QualityVectorVectorCompletionTaskExpressionSchema = z
  .object({
    type: VectorCompletionTaskExpressionSchema.shape.type,
    skip: VectorCompletionTaskExpressionSchema.shape.skip,
    map: z.undefined(),
    messages: QualityMessagesExpressionSchema,
    tools: VectorCompletionTaskExpressionSchema.shape.tools,
    responses: QualityVectorVectorResponsesExpressionSchema,
    output: VectorCompletionTaskExpressionSchema.shape.output,
  })
  .describe(
    VectorCompletionTaskExpressionSchema.description! +
      " Responses must be a single expression for vector parent functions.",
  )
  .meta({ title: "QualityVectorVectorCompletionTaskExpression" });
export type QualityVectorVectorCompletionTaskExpression = z.infer<
  typeof QualityVectorVectorCompletionTaskExpressionSchema
>;
export const QualityVectorVectorCompletionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityVectorVectorCompletionTaskExpressionSchema);

export const PlaceholderScalarFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("placeholder.scalar.function"),
    input_schema: InputSchemaSchema,
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe(
    "A placeholder scalar function task expression. Always outputs 0.5.",
  )
  .meta({ title: "PlaceholderScalarFunctionTaskExpression" });
export type PlaceholderScalarFunctionTaskExpression = z.infer<
  typeof PlaceholderScalarFunctionTaskExpressionSchema
>;
export const PlaceholderScalarFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(PlaceholderScalarFunctionTaskExpressionSchema);

export const PlaceholderVectorFunctionTaskExpressionSchema = z
  .object({
    type: z.literal("placeholder.vector.function"),
    input_schema: InputSchemaSchema,
    output_length: z
      .union([
        z.uint32().describe("The fixed length of the output vector."),
        ExpressionSchema.describe(
          "An expression which evaluates to the length of the output vector. Receives: `input`.",
        ),
      ])
      .describe("The length of the output vector."),
    input_split: ExpressionSchema.describe(
      "Splits the function input into an array of sub-inputs, one per output element. Receives: `input`.",
    ),
    input_merge: ExpressionSchema.describe(
      "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs back into one input. Receives: `input` (an array of sub-inputs).",
    ),
    skip: TaskExpressionSkipSchema.optional().nullable(),
    map: TaskExpressionMapSchema.optional().nullable(),
    input: InputValueExpressionSchema,
    output: TaskOutputExpressionSchema,
  })
  .describe(
    "A placeholder vector function task expression. Always outputs an equalized vector.",
  )
  .meta({ title: "PlaceholderVectorFunctionTaskExpression" });
export type PlaceholderVectorFunctionTaskExpression = z.infer<
  typeof PlaceholderVectorFunctionTaskExpressionSchema
>;
export const PlaceholderVectorFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(PlaceholderVectorFunctionTaskExpressionSchema);

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
  )
  .meta({ title: "TaskExpression" });
export type TaskExpression = z.infer<typeof TaskExpressionSchema>;
export const TaskExpressionJsonSchema: JSONSchema =
  convert(TaskExpressionSchema);

export const TaskExpressionsSchema = z
  .array(TaskExpressionSchema)
  .describe(
    "The list of tasks to be executed as part of the function. Each will first be compiled using the parent function's input.",
  )
  .meta({ title: "TaskExpressions" });
export type TaskExpressions = z.infer<typeof TaskExpressionsSchema>;
export const TaskExpressionsJsonSchema: JSONSchema = convert(
  TaskExpressionsSchema,
);

// Quality task variants: unmapped (no map field) and mapped (map required)

export const QualityUnmappedScalarFunctionTaskExpressionSchema =
  QualityScalarFunctionTaskExpressionSchema.extend({ map: z.undefined() })
    .describe(QualityScalarFunctionTaskExpressionSchema.description!)
    .meta({ title: "QualityUnmappedScalarFunctionTaskExpression" });
export type QualityUnmappedScalarFunctionTaskExpression = z.infer<
  typeof QualityUnmappedScalarFunctionTaskExpressionSchema
>;
export const QualityUnmappedScalarFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityUnmappedScalarFunctionTaskExpressionSchema);

export const QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema =
  PlaceholderScalarFunctionTaskExpressionSchema.extend({ map: z.undefined() })
    .describe(PlaceholderScalarFunctionTaskExpressionSchema.description!)
    .meta({ title: "QualityUnmappedPlaceholderScalarFunctionTaskExpression" });
export type QualityUnmappedPlaceholderScalarFunctionTaskExpression = z.infer<
  typeof QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema
>;
export const QualityUnmappedPlaceholderScalarFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema);

export const QualityMappedScalarFunctionTaskExpressionSchema =
  QualityScalarFunctionTaskExpressionSchema.extend({
    map: QualityTaskExpressionMapSchema,
  })
    .describe(QualityScalarFunctionTaskExpressionSchema.description!)
    .meta({ title: "QualityMappedScalarFunctionTaskExpression" });
export type QualityMappedScalarFunctionTaskExpression = z.infer<
  typeof QualityMappedScalarFunctionTaskExpressionSchema
>;
export const QualityMappedScalarFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityMappedScalarFunctionTaskExpressionSchema);

export const QualityMappedPlaceholderScalarFunctionTaskExpressionSchema =
  PlaceholderScalarFunctionTaskExpressionSchema.extend({
    map: QualityTaskExpressionMapSchema,
  })
    .describe(PlaceholderScalarFunctionTaskExpressionSchema.description!)
    .meta({ title: "QualityMappedPlaceholderScalarFunctionTaskExpression" });
export type QualityMappedPlaceholderScalarFunctionTaskExpression = z.infer<
  typeof QualityMappedPlaceholderScalarFunctionTaskExpressionSchema
>;
export const QualityMappedPlaceholderScalarFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityMappedPlaceholderScalarFunctionTaskExpressionSchema);

export const QualityUnmappedVectorFunctionTaskExpressionSchema =
  QualityVectorFunctionTaskExpressionSchema.extend({ map: z.undefined() })
    .describe(QualityVectorFunctionTaskExpressionSchema.description!)
    .meta({ title: "QualityUnmappedVectorFunctionTaskExpression" });
export type QualityUnmappedVectorFunctionTaskExpression = z.infer<
  typeof QualityUnmappedVectorFunctionTaskExpressionSchema
>;
export const QualityUnmappedVectorFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityUnmappedVectorFunctionTaskExpressionSchema);

export const QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema =
  PlaceholderVectorFunctionTaskExpressionSchema.extend({ map: z.undefined() })
    .describe(PlaceholderVectorFunctionTaskExpressionSchema.description!)
    .meta({ title: "QualityUnmappedPlaceholderVectorFunctionTaskExpression" });
export type QualityUnmappedPlaceholderVectorFunctionTaskExpression = z.infer<
  typeof QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema
>;
export const QualityUnmappedPlaceholderVectorFunctionTaskExpressionJsonSchema: JSONSchema =
  convert(QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema);

// Quality Branch Scalar Function Tasks: all unmapped scalar-like

export const QualityBranchScalarFunctionTasksExpressionSchema = z
  .discriminatedUnion("type", [
    QualityUnmappedScalarFunctionTaskExpressionSchema,
    QualityUnmappedPlaceholderScalarFunctionTaskExpressionSchema,
  ])
  .describe(
    "A task in a scalar function. Must be an unmapped scalar.function or placeholder.scalar.function task. " +
      "At depth 0, only vector.completion tasks are allowed instead.",
  );
export type QualityBranchScalarFunctionTasksExpression = z.infer<
  typeof QualityBranchScalarFunctionTasksExpressionSchema
>;
export const QualityBranchScalarFunctionTasksExpressionJsonSchema: JSONSchema =
  convert(QualityBranchScalarFunctionTasksExpressionSchema);

export const QualityBranchScalarFunctionTasksExpressionsSchema = z
  .array(QualityBranchScalarFunctionTasksExpressionSchema)
  .describe(
    "Tasks for a scalar function. All tasks must be unmapped scalar-like (scalar.function or placeholder.scalar.function). " +
      "Must contain at least 1 task. Task count must be within min_width and max_width from parameters. " +
      "At depth 0, only vector.completion tasks are allowed instead.",
  );
export type QualityBranchScalarFunctionTasksExpressions = z.infer<
  typeof QualityBranchScalarFunctionTasksExpressionsSchema
>;
export const QualityBranchScalarFunctionTasksExpressionsJsonSchema: JSONSchema =
  convert(QualityBranchScalarFunctionTasksExpressionsSchema);

// Quality Branch Vector Function Tasks: mapped scalar-like or unmapped vector-like

export const QualityBranchVectorFunctionTasksExpressionSchema = z
  .discriminatedUnion("type", [
    QualityMappedScalarFunctionTaskExpressionSchema,
    QualityMappedPlaceholderScalarFunctionTaskExpressionSchema,
    QualityUnmappedVectorFunctionTaskExpressionSchema,
    QualityUnmappedPlaceholderVectorFunctionTaskExpressionSchema,
  ])
  .describe(
    "A task in a vector function. Must be either a mapped scalar-like task (scalar.function or placeholder.scalar.function with map required) " +
      "or an unmapped vector-like task (vector.function or placeholder.vector.function). " +
      "At depth 0, only vector.completion tasks are allowed instead.",
  );
export type QualityBranchVectorFunctionTasksExpression = z.infer<
  typeof QualityBranchVectorFunctionTasksExpressionSchema
>;
export const QualityBranchVectorFunctionTasksExpressionJsonSchema: JSONSchema =
  convert(QualityBranchVectorFunctionTasksExpressionSchema);

export const QualityBranchVectorFunctionTasksExpressionsSchema = z
  .array(QualityBranchVectorFunctionTasksExpressionSchema)
  .describe(
    "Tasks for a vector function. Each task must be either a mapped scalar-like task or an unmapped vector-like task. " +
      "Must contain at least 1 task. At most 50% of tasks may have a map index (unless there is only 1 task). " +
      "Map indices must be unique across tasks and reference valid input_maps entries. " +
      "Task count must be within min_width and max_width from parameters. " +
      "At depth 0, only vector.completion tasks are allowed instead.",
  );
export type QualityBranchVectorFunctionTasksExpressions = z.infer<
  typeof QualityBranchVectorFunctionTasksExpressionsSchema
>;
export const QualityBranchVectorFunctionTasksExpressionsJsonSchema: JSONSchema =
  convert(QualityBranchVectorFunctionTasksExpressionsSchema);

// Quality Depth-0 Tasks: only vector.completion

export const QualityLeafScalarTasksExpressionsSchema = z
  .array(QualityScalarVectorCompletionTaskExpressionSchema)
  .describe(
    "Tasks at depth 0 of a scalar function. Only vector.completion tasks are allowed. " +
      "Responses must be arrays of content parts. " +
      "Must contain at least 1 task. Task count must be within min_width and max_width from parameters.",
  );
export type QualityLeafScalarTasksExpressions = z.infer<
  typeof QualityLeafScalarTasksExpressionsSchema
>;
export const QualityLeafScalarTasksExpressionsJsonSchema: JSONSchema = convert(
  QualityLeafScalarTasksExpressionsSchema,
);

export const QualityLeafVectorTasksExpressionsSchema = z
  .array(QualityVectorVectorCompletionTaskExpressionSchema)
  .describe(
    "Tasks at depth 0 of a vector function. Only vector.completion tasks are allowed. " +
      "Responses must be a single expression. " +
      "Must contain at least 1 task. Task count must be within min_width and max_width from parameters.",
  );
export type QualityLeafVectorTasksExpressions = z.infer<
  typeof QualityLeafVectorTasksExpressionsSchema
>;
export const QualityLeafVectorTasksExpressionsJsonSchema: JSONSchema = convert(
  QualityLeafVectorTasksExpressionsSchema,
);

// Task

export const ScalarFunctionTaskSchema = z
  .object({
    type: z.literal("scalar.function"),
    remote: RemoteSchema,
    owner: z
      .string()
      .describe("The owner of the repository containing the function."),
    repository: z
      .string()
      .describe("The name of the repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the repository containing the function.",
      ),
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the task result into a valid function output. Receives: `input`, `output` (the raw FunctionOutput from the nested function).",
    ),
  })
  .describe("A scalar function task.")
  .meta({ title: "ScalarFunctionTask" });
export type ScalarFunctionTask = z.infer<typeof ScalarFunctionTaskSchema>;
export const ScalarFunctionTaskJsonSchema: JSONSchema = convert(
  ScalarFunctionTaskSchema,
);

export const VectorFunctionTaskSchema = z
  .object({
    type: z.literal("vector.function"),
    remote: RemoteSchema,
    owner: z
      .string()
      .describe("The owner of the repository containing the function."),
    repository: z
      .string()
      .describe("The name of the repository containing the function."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the repository containing the function.",
      ),
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the task result into a valid function output. Receives: `input`, `output` (the raw FunctionOutput from the nested function).",
    ),
  })
  .describe("A vector function task.")
  .meta({ title: "VectorFunctionTask" });
export type VectorFunctionTask = z.infer<typeof VectorFunctionTaskSchema>;
export const VectorFunctionTaskJsonSchema: JSONSchema = convert(
  VectorFunctionTaskSchema,
);

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
  .describe("A vector completion task.")
  .meta({ title: "VectorCompletionTask" });
export type VectorCompletionTask = z.infer<typeof VectorCompletionTaskSchema>;
export const VectorCompletionTaskJsonSchema: JSONSchema = convert(
  VectorCompletionTaskSchema,
);

export const PlaceholderScalarFunctionTaskSchema = z
  .object({
    type: z.literal("placeholder.scalar.function"),
    input_schema: InputSchemaSchema,
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the fixed 0.5 output. Receives: `input`, `output` (the raw FunctionOutput).",
    ),
  })
  .describe("A placeholder scalar function task. Always outputs 0.5.")
  .meta({ title: "PlaceholderScalarFunctionTask" });
export type PlaceholderScalarFunctionTask = z.infer<
  typeof PlaceholderScalarFunctionTaskSchema
>;
export const PlaceholderScalarFunctionTaskJsonSchema: JSONSchema = convert(
  PlaceholderScalarFunctionTaskSchema,
);

export const PlaceholderVectorFunctionTaskSchema = z
  .object({
    type: z.literal("placeholder.vector.function"),
    input_schema: InputSchemaSchema,
    output_length: z
      .union([
        z.uint32().describe("The fixed length of the output vector."),
        ExpressionSchema.describe(
          "An expression which evaluates to the length of the output vector. Receives: `input`.",
        ),
      ])
      .describe("The length of the output vector."),
    input_split: ExpressionSchema.describe(
      "Splits the function input into an array of sub-inputs, one per output element. Receives: `input`.",
    ),
    input_merge: ExpressionSchema.describe(
      "Recombines a variable-size, arbitrarily-ordered subset of sub-inputs back into one input. Receives: `input` (an array of sub-inputs).",
    ),
    input: InputValueSchema,
    output: ExpressionSchema.describe(
      "Expression to transform the equalized vector output. Receives: `input`, `output` (the raw FunctionOutput).",
    ),
  })
  .describe(
    "A placeholder vector function task. Always outputs an equalized vector.",
  )
  .meta({ title: "PlaceholderVectorFunctionTask" });
export type PlaceholderVectorFunctionTask = z.infer<
  typeof PlaceholderVectorFunctionTaskSchema
>;
export const PlaceholderVectorFunctionTaskJsonSchema: JSONSchema = convert(
  PlaceholderVectorFunctionTaskSchema,
);

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
export const TaskJsonSchema: JSONSchema = convert(TaskSchema);

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
export const CompiledTaskJsonSchema: JSONSchema = convert(CompiledTaskSchema);

export const CompiledTasksSchema = z
  .array(CompiledTaskSchema)
  .describe(
    "The compiled list of tasks to be executed as part of the function.",
  );
export type CompiledTasks = z.infer<typeof CompiledTasksSchema>;
export const CompiledTasksJsonSchema: JSONSchema = convert(CompiledTasksSchema);

// Quality Compiled Tasks (message content and responses must be arrays of content parts, not plain strings)

export const QualityVectorCompletionTaskSchema = z
  .object({
    type: z.literal("vector.completion"),
    messages: QualityMessagesSchema,
    tools: ToolsSchema.optional(),
    responses: QualityScalarVectorResponsesSchema,
    output: VectorCompletionTaskSchema.shape.output,
  })
  .describe(
    VectorCompletionTaskSchema.description! +
      " Message content and responses must be arrays of content parts, not plain strings.",
  );
export type QualityVectorCompletionTask = z.infer<
  typeof QualityVectorCompletionTaskSchema
>;
export const QualityVectorCompletionTaskJsonSchema: JSONSchema = convert(
  QualityVectorCompletionTaskSchema,
);

export const QualityTaskSchema = z
  .discriminatedUnion("type", [
    ScalarFunctionTaskSchema,
    VectorFunctionTaskSchema,
    QualityVectorCompletionTaskSchema,
    PlaceholderScalarFunctionTaskSchema,
    PlaceholderVectorFunctionTaskSchema,
  ])
  .describe(
    TaskSchema.description! +
      " Vector completion tasks require content parts arrays, not plain strings.",
  );
export type QualityTask = z.infer<typeof QualityTaskSchema>;
export const QualityTaskJsonSchema: JSONSchema = convert(QualityTaskSchema);

export const QualityCompiledTaskSchema = z
  .union([
    QualityTaskSchema.describe("An un-mapped, un-skipped task."),
    z
      .array(QualityTaskSchema)
      .describe("A task which was mapped over an input array."),
    z.null().describe("A task which was skipped."),
  ])
  .describe(CompiledTaskSchema.description!);
export type QualityCompiledTask = z.infer<typeof QualityCompiledTaskSchema>;
export const QualityCompiledTaskJsonSchema: JSONSchema = convert(
  QualityCompiledTaskSchema,
);

export const QualityCompiledTasksSchema = z
  .array(QualityCompiledTaskSchema)
  .describe(CompiledTasksSchema.description!);
export type QualityCompiledTasks = z.infer<typeof QualityCompiledTasksSchema>;
export const QualityCompiledTasksJsonSchema: JSONSchema = convert(
  QualityCompiledTasksSchema,
);
