import z from "zod";
import {
  FunctionExecutionChunk,
  FunctionExecutionChunkSchema,
} from "./function_execution_chunk";
import { InlineProfileSchema } from "src/functions/profile";
import { FittingStatsSchema } from "../fitting_stats";
import { ResponseObjectSchema } from "./response_object";
import { UsageSchema } from "src/vector/completions/response/usage";
import { merge } from "src/merge";

export const FunctionProfileComputationChunkSchema = z
  .object({
    id: z
      .string()
      .describe(
        "The unique identifier of the function profile computation chunk."
      ),
    executions: z
      .array(FunctionExecutionChunkSchema)
      .describe(
        "The function executions performed as part of computing the profile."
      ),
    executions_errors: z
      .boolean()
      .optional()
      .describe(
        "When true, indicates that one or more function executions encountered errors during profile computation."
      ),
    profile: InlineProfileSchema.optional(),
    fitting_stats: FittingStatsSchema.optional(),
    retry_token: z
      .string()
      .optional()
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
    usage: UsageSchema.optional(),
  })
  .describe("A chunk of a function profile computation.");
export type FunctionProfileComputationChunk = z.infer<
  typeof FunctionProfileComputationChunkSchema
>;

export namespace FunctionProfileComputationChunk {
  export function merged(
    a: FunctionProfileComputationChunk,
    b: FunctionProfileComputationChunk
  ): [FunctionProfileComputationChunk, boolean] {
    const id = a.id;
    const [executions, executionsChanged] = FunctionExecutionChunk.mergedList(
      a.executions,
      b.executions
    );
    const [executions_errors, executions_errorsChanged] = merge(
      a.executions_errors,
      b.executions_errors
    );
    const [profile, profileChanged] = merge(a.profile, b.profile);
    const [fitting_stats, fitting_statsChanged] = merge(
      a.fitting_stats,
      b.fitting_stats
    );
    const created = a.created;
    const function_ = a.function;
    const object = a.object;
    const [usage, usageChanged] = merge(a.usage, b.usage);
    if (
      executionsChanged ||
      executions_errorsChanged ||
      profileChanged ||
      fitting_statsChanged ||
      usageChanged
    ) {
      return [
        {
          id,
          executions,
          ...(executions_errors !== undefined ? { executions_errors } : {}),
          ...(profile !== undefined ? { profile } : {}),
          ...(fitting_stats !== undefined ? { fitting_stats } : {}),
          created,
          function: function_,
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
