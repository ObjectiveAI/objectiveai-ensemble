import z from "zod";
import { TaskSchema } from "./task";
import { ReasoningSummarySchema } from "./reasoning_summary";
import { JsonValueSchema } from "src/json";
import { ObjectiveAIErrorSchema } from "src/error";
import { UsageSchema } from "src/vector/completions/response/usage";
import { ResponseObjectSchema } from "./response_object";

export const FunctionExecutionSchema = z
  .object({
    id: z.string().describe("The unique identifier of the function execution."),
    tasks: z
      .array(TaskSchema)
      .describe("The tasks executed as part of the function execution."),
    tasks_errors: z
      .boolean()
      .describe(
        "When true, indicates that one or more tasks encountered errors during execution."
      ),
    reasoning: ReasoningSummarySchema.nullable(),
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
      .describe("The output of the function execution."),
    error: ObjectiveAIErrorSchema.nullable().describe(
      "When non-null, indicates that an error occurred during the function execution."
    ),
    retry_token: z
      .string()
      .nullable()
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
    usage: UsageSchema,
  })
  .describe("A function execution.");
export type FunctionExecution = z.infer<typeof FunctionExecutionSchema>;
