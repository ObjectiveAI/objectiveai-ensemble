import z from "zod";
import { DatasetSchema } from "./dataset";
import { EnsembleSchema } from "src/vector/completions/request/ensemble";
import { ProviderSchema } from "src/chat/completions/request/provider";
import {
  BackoffMaxElapsedTimeSchema,
  FirstChunkTimeoutSchema,
  OtherChunkTimeoutSchema,
  SeedSchema,
  StreamFalseSchema,
  StreamSchema,
  StreamTrueSchema,
} from "src/chat/completions/request/chat_completion_create_params";
import { InlineFunctionSchema } from "src/functions/function";

// Remote Function

export const FunctionProfileComputationCreateParamsRemoteFunctionBaseSchema = z
  .object({
    retry_token: z
      .string()
      .optional()
      .nullable()
      .describe(
        "The retry token provided by a previous incomplete or failed profile computation."
      ),
    from_cache: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "If true, vector completion tasks use cached votes from the global ObjectiveAI votes cache when available. Has lower priority than `retry_token`, higher priority than `from_rng`."
      ),
    from_rng: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "If true, any remaining votes from vector completion tasks are generated via RNG. Has lower priority than `retry_token` or `from_cache`."
      ),
    max_retries: z
      .uint32()
      .optional()
      .nullable()
      .describe(
        "The maximum number of retries to attempt when a function execution fails during profile computation."
      ),
    n: z
      .uint32()
      .describe(
        "The number of function executions to perform per dataset item. Generally speaking, higher N values increase the quality of the computed profile."
      ),
    dataset: DatasetSchema,
    ensemble: EnsembleSchema,
    provider: ProviderSchema.optional().nullable(),
    seed: SeedSchema.optional().nullable(),
    backoff_max_elapsed_time: BackoffMaxElapsedTimeSchema.optional().nullable(),
    first_chunk_timeout: FirstChunkTimeoutSchema.optional().nullable(),
    other_chunk_timeout: OtherChunkTimeoutSchema.optional().nullable(),
  })
  .describe(
    "Base parameters for computing a function profile for a remote function."
  );
export type FunctionProfileComputationCreateParamsRemoteFunctionBase = z.infer<
  typeof FunctionProfileComputationCreateParamsRemoteFunctionBaseSchema
>;

export const FunctionProfileComputationCreateParamsRemoteFunctionStreamingSchema =
  FunctionProfileComputationCreateParamsRemoteFunctionBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe(
      "Parameters for computing a function profile for a remote function and streaming the response."
    )
    .meta({ title: "FunctionProfileComputationCreateParamsStreaming" });
export type FunctionProfileComputationCreateParamsRemoteFunctionStreaming =
  z.infer<
    typeof FunctionProfileComputationCreateParamsRemoteFunctionStreamingSchema
  >;

export const FunctionProfileComputationCreateParamsRemoteFunctionNonStreamingSchema =
  FunctionProfileComputationCreateParamsRemoteFunctionBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe(
      "Parameters for computing a function profile for a remote function with a unary response."
    )
    .meta({ title: "FunctionProfileComputationCreateParamsNonStreaming" });
export type FunctionProfileComputationCreateParamsRemoteFunctionNonStreaming =
  z.infer<
    typeof FunctionProfileComputationCreateParamsRemoteFunctionNonStreamingSchema
  >;

export const FunctionProfileComputationCreateParamsRemoteFunctionSchema =
  FunctionProfileComputationCreateParamsRemoteFunctionBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe(
      "Parameters for computing a function profile for a remote function."
    )
    .meta({ title: "FunctionProfileComputationCreateParams" });
export type FunctionProfileComputationCreateParamsRemoteFunction = z.infer<
  typeof FunctionProfileComputationCreateParamsRemoteFunctionSchema
>;

// Inline Function

export const FunctionProfileComputationCreateParamsInlineFunctionBaseSchema =
  FunctionProfileComputationCreateParamsRemoteFunctionBaseSchema.extend({
    function: InlineFunctionSchema,
  }).describe(
    "Base parameters for computing a function profile for an inline function."
  );
export type FunctionProfileComputationCreateParamsInlineFunctionBase = z.infer<
  typeof FunctionProfileComputationCreateParamsInlineFunctionBaseSchema
>;

export const FunctionProfileComputationCreateParamsInlineFunctionStreamingSchema =
  FunctionProfileComputationCreateParamsInlineFunctionBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe(
      "Parameters for computing a function profile for an inline function and streaming the response."
    )
    .meta({
      title: "FunctionProfileComputationCreateParamsInlineFunctionStreaming",
    });
export type FunctionProfileComputationCreateParamsInlineFunctionStreaming =
  z.infer<
    typeof FunctionProfileComputationCreateParamsInlineFunctionStreamingSchema
  >;

export const FunctionProfileComputationCreateParamsInlineFunctionNonStreamingSchema =
  FunctionProfileComputationCreateParamsInlineFunctionBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe(
      "Parameters for computing a function profile for an inline function with a unary response."
    )
    .meta({
      title: "FunctionProfileComputationCreateParamsInlineFunctionNonStreaming",
    });
export type FunctionProfileComputationCreateParamsInlineFunctionNonStreaming =
  z.infer<
    typeof FunctionProfileComputationCreateParamsInlineFunctionNonStreamingSchema
  >;

export const FunctionProfileComputationCreateParamsInlineFunctionSchema =
  FunctionProfileComputationCreateParamsInlineFunctionBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe(
      "Parameters for computing a function profile for an inline function."
    )
    .meta({ title: "FunctionProfileComputationCreateParamsInlineFunction" });
export type FunctionProfileComputationCreateParamsInlineFunction = z.infer<
  typeof FunctionProfileComputationCreateParamsInlineFunctionSchema
>;
