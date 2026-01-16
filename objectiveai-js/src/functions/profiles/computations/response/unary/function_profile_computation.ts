import z from "zod";
import { FunctionExecutionSchema } from "./function_execution";
import { InlineProfileSchema } from "src/functions/profile";
import { FittingStatsSchema } from "../fitting_stats";
import { ResponseObjectSchema } from "./response_object";
import { UsageSchema } from "src/vector/completions/response/usage";

export const FunctionProfileComputationSchema = z
  .object({
    id: z
      .string()
      .describe("The unique identifier of the function profile computation."),
    executions: z
      .array(FunctionExecutionSchema)
      .describe(
        "The function executions performed as part of computing the profile."
      ),
    executions_errors: z
      .boolean()
      .describe(
        "When true, indicates that one or more function executions encountered errors during profile computation."
      ),
    profile: InlineProfileSchema,
    fitting_stats: FittingStatsSchema,
    retry_token: z
      .string()
      .nullable()
      .describe(
        "A token which may be used to retry the function profile computation."
      ),
    created: z
      .uint32()
      .describe(
        "The UNIX timestamp (in seconds) when the function profile computation was created."
      ),
    function: z
      .string()
      .describe(
        "The unique identifier of the function for which the profile is being computed."
      ),
    object: ResponseObjectSchema,
    usage: UsageSchema,
  })
  .describe("A function profile computation.");
export type FunctionProfileComputation = z.infer<
  typeof FunctionProfileComputationSchema
>;
