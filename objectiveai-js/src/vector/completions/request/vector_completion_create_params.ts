import { MessagesSchema } from "src/chat/completions/request/message";
import { ProviderSchema } from "src/chat/completions/request/provider";
import z from "zod";
import { EnsembleSchema } from "./ensemble";
import { ProfileSchema } from "./profile";
import {
  BackoffMaxElapsedTimeSchema,
  FirstChunkTimeoutSchema,
  OtherChunkTimeoutSchema,
  SeedSchema,
  StreamFalseSchema,
  StreamSchema,
  StreamTrueSchema,
} from "src/chat/completions/request/chat_completion_create_params";
import { ToolsSchema } from "src/chat/completions/request/tool";
import { VectorResponsesSchema } from "./vector_response";

export const VectorCompletionCreateParamsBaseSchema = z
  .object({
    retry: z
      .string()
      .optional()
      .nullable()
      .describe(
        "The unique ID of a previous incomplete or failed completion. Successful votes from it will be reused, sans any that were RNGed or came from cache."
      ),
    from_cache: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "If true, uses cached votes from the global ObjectiveAI votes cache when available. Has lower priority than `retry`, higher priority than `from_rng`."
      ),
    from_rng: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "If true, any remaining votes are generated via RNG. Has lower priority than `retry` or `from_cache`."
      ),
    messages: MessagesSchema,
    provider: ProviderSchema.optional().nullable(),
    ensemble: EnsembleSchema,
    profile: ProfileSchema,
    seed: SeedSchema.optional().nullable(),
    tools: ToolsSchema.optional()
      .nullable()
      .describe(
        `${ToolsSchema.description} These are readonly and will only be useful for explaining prior tool calls or otherwise influencing behavior.`
      ),
    responses: VectorResponsesSchema,
    backoff_max_elapsed_time: BackoffMaxElapsedTimeSchema.optional().nullable(),
    first_chunk_timeout: FirstChunkTimeoutSchema.optional().nullable(),
    other_chunk_timeout: OtherChunkTimeoutSchema.optional().nullable(),
  })
  .describe("Base parameters for creating a vector completion.");
export type VectorCompletionCreateParamsBase = z.infer<
  typeof VectorCompletionCreateParamsBaseSchema
>;

export const VectorCompletionCreateParamsStreamingSchema =
  VectorCompletionCreateParamsBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe("Parameters for creating a streaming vector completion.")
    .meta({ title: "VectorCompletionCreateParamsStreaming" });
export type VectorCompletionCreateParamsStreaming = z.infer<
  typeof VectorCompletionCreateParamsStreamingSchema
>;

export const VectorCompletionCreateParamsNonStreamingSchema =
  VectorCompletionCreateParamsBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe("Parameters for creating a unary vector completion.")
    .meta({ title: "VectorCompletionCreateParamsNonStreaming" });
export type VectorCompletionCreateParamsNonStreaming = z.infer<
  typeof VectorCompletionCreateParamsNonStreamingSchema
>;

export const VectorCompletionCreateParamsSchema =
  VectorCompletionCreateParamsBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe("Parameters for creating a vector completion.")
    .meta({ title: "VectorCompletionCreateParams" });
export type VectorCompletionCreateParams = z.infer<
  typeof VectorCompletionCreateParamsSchema
>;
