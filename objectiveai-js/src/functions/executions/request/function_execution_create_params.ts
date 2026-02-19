import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";
import { ReasoningSchema } from "./reasoning";
import { StrategySchema } from "./strategy";
import { InputValueSchema } from "src/functions/expression/input";
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
import { InlineProfileSchema } from "src/functions/profile";
import { InlineFunctionSchema } from "src/functions/function";

// Remote Function Remote Profile

export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema =
  z
    .object({
      retry_token: z
        .string()
        .optional()
        .nullable()
        .describe(
          "The retry token provided by a previous incomplete or failed function execution.",
        ),
      from_cache: z
        .boolean()
        .optional()
        .nullable()
        .describe(
          "If true, vector completion tasks use cached votes from the global ObjectiveAI votes cache when available. Has lower priority than `retry_token`, higher priority than `from_rng`.",
        ),
      from_rng: z
        .boolean()
        .optional()
        .nullable()
        .describe(
          "If true, any remaining votes from vector completion tasks are generated via RNG. Has lower priority than `retry_token` or `from_cache`.",
        ),
      strategy: StrategySchema.optional()
        .nullable()
        .describe(
          "Strategy for function execution. Defaults to 'default'. Use 'swiss_system' for vector functions to run tournament-style ranking across multiple rounds.",
        ),
      reasoning: ReasoningSchema.optional().nullable(),
      input: InputValueSchema,
      provider: ProviderSchema.optional().nullable(),
      seed: SeedSchema.optional().nullable(),
      backoff_max_elapsed_time:
        BackoffMaxElapsedTimeSchema.optional().nullable(),
      first_chunk_timeout: FirstChunkTimeoutSchema.optional().nullable(),
      other_chunk_timeout: OtherChunkTimeoutSchema.optional().nullable(),
    })
    .describe(
      "Base parameters for executing a remote function with a remote profile.",
    );
export type FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBase =
  z.infer<
    typeof FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema
  >;
export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema);

export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreamingSchema =
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe(
      "Parameters for executing a remote function with a remote profile and streaming the response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming",
    });
export type FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreamingSchema
  >;
export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreamingSchema);

export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreamingSchema =
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing a remote function with a remote profile with a unary response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreaming",
    });
export type FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreamingSchema
  >;
export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreamingSchema);

export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileSchema =
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing a remote function with a remote profile.",
    )
    .meta({
      title: "FunctionExecutionCreateParamsRemoteFunctionRemoteProfile",
    });
export type FunctionExecutionCreateParamsRemoteFunctionRemoteProfile = z.infer<
  typeof FunctionExecutionCreateParamsRemoteFunctionRemoteProfileSchema
>;
export const FunctionExecutionCreateParamsRemoteFunctionRemoteProfileJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionRemoteProfileSchema);

// Remote Function Inline Profile

export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseSchema =
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema.extend({
    profile: InlineProfileSchema,
  }).describe(
    "Base parameters for executing a remote function with an inline profile.",
  );
export type FunctionExecutionCreateParamsRemoteFunctionInlineProfileBase =
  z.infer<
    typeof FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseSchema
  >;
export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseSchema);

export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreamingSchema =
  FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe(
      "Parameters for executing a remote function with an inline profile and streaming the response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreaming",
    });
export type FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreamingSchema
  >;
export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreamingSchema);

export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreamingSchema =
  FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing a remote function with an inline profile with a unary response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreaming",
    });
export type FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreamingSchema
  >;
export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreamingSchema);

export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileSchema =
  FunctionExecutionCreateParamsRemoteFunctionInlineProfileBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing a remote function with an inline profile.",
    )
    .meta({
      title: "FunctionExecutionCreateParamsRemoteFunctionInlineProfile",
    });
export type FunctionExecutionCreateParamsRemoteFunctionInlineProfile = z.infer<
  typeof FunctionExecutionCreateParamsRemoteFunctionInlineProfileSchema
>;
export const FunctionExecutionCreateParamsRemoteFunctionInlineProfileJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsRemoteFunctionInlineProfileSchema);

// Inline Function Remote Profile

export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseSchema =
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema.extend({
    function: InlineFunctionSchema,
  }).describe(
    "Base parameters for executing an inline function with a remote profile.",
  );
export type FunctionExecutionCreateParamsInlineFunctionRemoteProfileBase =
  z.infer<
    typeof FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseSchema
  >;
export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseSchema);

export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreamingSchema =
  FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe(
      "Parameters for executing an inline function with a remote profile and streaming the response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreaming",
    });
export type FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreamingSchema
  >;
export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreamingSchema);

export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreamingSchema =
  FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing an inline function with a remote profile with a unary response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreaming",
    });
export type FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreamingSchema
  >;
export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreamingSchema);

export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileSchema =
  FunctionExecutionCreateParamsInlineFunctionRemoteProfileBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing an inline function with a remote profile.",
    )
    .meta({
      title: "FunctionExecutionCreateParamsInlineFunctionRemoteProfile",
    });
export type FunctionExecutionCreateParamsInlineFunctionRemoteProfile = z.infer<
  typeof FunctionExecutionCreateParamsInlineFunctionRemoteProfileSchema
>;
export const FunctionExecutionCreateParamsInlineFunctionRemoteProfileJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionRemoteProfileSchema);

// Inline Function Inline Profile

export const FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseSchema =
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileBaseSchema.extend({
    function: InlineFunctionSchema,
    profile: InlineProfileSchema,
  }).describe(
    "Base parameters for executing an inline function with an inline profile.",
  );
export type FunctionExecutionCreateParamsInlineFunctionInlineProfileBase =
  z.infer<
    typeof FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseSchema
  >;
export const FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseSchema);

export const FunctionExecutionCreateParamsInlineFunctionInlineProfileStreamingSchema =
  FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe(
      "Parameters for executing an inline function with an inline profile and streaming the response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsInlineFunctionInlineProfileStreaming",
    });
export type FunctionExecutionCreateParamsInlineFunctionInlineProfileStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsInlineFunctionInlineProfileStreamingSchema
  >;
export const FunctionExecutionCreateParamsInlineFunctionInlineProfileStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionInlineProfileStreamingSchema);

export const FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreamingSchema =
  FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing an inline function with an inline profile with a unary response.",
    )
    .meta({
      title:
        "FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreaming",
    });
export type FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreaming =
  z.infer<
    typeof FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreamingSchema
  >;
export const FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreamingJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreamingSchema);

export const FunctionExecutionCreateParamsInlineFunctionInlineProfileSchema =
  FunctionExecutionCreateParamsInlineFunctionInlineProfileBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe(
      "Parameters for executing an inline function with an inline profile.",
    )
    .meta({
      title: "FunctionExecutionCreateParamsInlineFunctionInlineProfile",
    });
export type FunctionExecutionCreateParamsInlineFunctionInlineProfile = z.infer<
  typeof FunctionExecutionCreateParamsInlineFunctionInlineProfileSchema
>;
export const FunctionExecutionCreateParamsInlineFunctionInlineProfileJsonSchema: JSONSchema =
  convert(FunctionExecutionCreateParamsInlineFunctionInlineProfileSchema);
