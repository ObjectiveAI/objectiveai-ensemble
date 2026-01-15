import z from "zod";
import {
  ReasoningSummaryChunk,
  ReasoningSummaryChunkSchema,
} from "./reasoning_summary_chunk";
import { JsonValueSchema } from "src/json";
import { ObjectiveAIErrorSchema } from "src/error";
import { UsageSchema } from "src/vector/completions/response/usage";
import { TaskChunk, TaskChunkSchema } from "./task_chunk";
import { merge } from "src/merge";
import { ResponseObjectSchema } from "./response_object";

export const FunctionExecutionChunkSchema = z
  .object({
    id: z.string().describe("The unique identifier of the function execution."),
    tasks: z
      .array(TaskChunkSchema)
      .describe("The tasks executed as part of the function execution."),
    tasks_errors: z
      .boolean()
      .optional()
      .describe(
        "When true, indicates that one or more tasks encountered errors during execution."
      ),
    reasoning: ReasoningSummaryChunkSchema.optional(),
    output: z
      .union([
        z.number().describe("The scalar output of the function execution."),
        z
          .array(z.number())
          .describe("The vector output of the function execution."),
        JsonValueSchema.describe(
          "The erroneous output of the function execution."
        ),
      ])
      .optional()
      .describe("The output of the function execution."),
    error: ObjectiveAIErrorSchema.optional().describe(
      "When present, indicates that an error occurred during the function execution."
    ),
    retry_token: z
      .string()
      .optional()
      .describe("A token which may be used to retry the function execution."),
    created: z
      .uint32()
      .describe(
        "The UNIX timestamp (in seconds) when the function execution chunk was created."
      ),
    function: z
      .string()
      .nullable()
      .describe("The unique identifier of the function being executed."),
    profile: z
      .string()
      .nullable()
      .describe("The unique identifier of the profile being used."),
    object: ResponseObjectSchema,
    usage: UsageSchema.optional(),
  })
  .describe("A chunk of a function execution.");
export type FunctionExecutionChunk = z.infer<
  typeof FunctionExecutionChunkSchema
>;

export namespace FunctionExecutionChunk {
  export function merged(
    a: FunctionExecutionChunk,
    b: FunctionExecutionChunk
  ): [FunctionExecutionChunk, boolean] {
    const id = a.id;
    const [tasks, tasksChanged] = TaskChunk.mergedList(a.tasks, b.tasks);
    const [tasks_errors, tasks_errorsChanged] = merge(
      a.tasks_errors,
      b.tasks_errors
    );
    const [reasoning, reasoningChanged] = merge(
      a.reasoning,
      b.reasoning,
      ReasoningSummaryChunk.merged
    );
    const [output, outputChanged] = merge(a.output, b.output);
    const [error, errorChanged] = merge(a.error, b.error);
    const [retry_token, retry_tokenChanged] = merge(
      a.retry_token,
      b.retry_token
    );
    const created = a.created;
    const function_ = a.function;
    const profile = a.profile;
    const object = a.object;
    const [usage, usageChanged] = merge(a.usage, b.usage);
    if (
      tasksChanged ||
      tasks_errorsChanged ||
      reasoningChanged ||
      outputChanged ||
      errorChanged ||
      retry_tokenChanged ||
      usageChanged
    ) {
      return [
        {
          id,
          tasks,
          ...(tasks_errors !== undefined ? { tasks_errors } : {}),
          ...(reasoning !== undefined ? { reasoning } : {}),
          ...(output !== undefined ? { output } : {}),
          ...(error !== undefined ? { error } : {}),
          ...(retry_token !== undefined ? { retry_token } : {}),
          created,
          function: function_,
          profile,
          object,
          ...(usage !== undefined ? { usage } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
