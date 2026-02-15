import z from "zod";
import { MessagesSchema } from "./message";
import { FallbackModelsSchema, ModelSchema } from "./model";
import { ProviderSchema } from "./provider";
import { ResponseFormatSchema } from "./response_format";
import { ToolChoiceSchema } from "./tool_choice";
import { ToolsSchema } from "./tool";
import { PredictionSchema } from "./prediction";
import { convert, type JSONSchema } from "../../../json_schema";

export const SeedSchema = z
  .bigint()
  .describe(
    "If specified, upstream systems will make a best effort to sample deterministically, such that repeated requests with the same seed and parameters should return the same result."
  );
export type Seed = z.infer<typeof SeedSchema>;
export const SeedJsonSchema: JSONSchema = convert(SeedSchema);

export const BackoffMaxElapsedTimeSchema = z
  .uint32()
  .describe(
    "The maximum total time in milliseconds to spend on retries when a transient error occurs."
  );
export type BackoffMaxElapsedTime = z.infer<typeof BackoffMaxElapsedTimeSchema>;
export const BackoffMaxElapsedTimeJsonSchema: JSONSchema = convert(BackoffMaxElapsedTimeSchema);

export const FirstChunkTimeoutSchema = z
  .uint32()
  .describe(
    "The maximum time in milliseconds to wait for the first chunk of a streaming response."
  );
export type FirstChunkTimeout = z.infer<typeof FirstChunkTimeoutSchema>;
export const FirstChunkTimeoutJsonSchema: JSONSchema = convert(FirstChunkTimeoutSchema);

export const OtherChunkTimeoutSchema = z
  .uint32()
  .describe(
    "The maximum time in milliseconds to wait between subsequent chunks of a streaming response."
  );
export type OtherChunkTimeout = z.infer<typeof OtherChunkTimeoutSchema>;
export const OtherChunkTimeoutJsonSchema: JSONSchema = convert(OtherChunkTimeoutSchema);

export const ChatCompletionCreateParamsBaseSchema = z
  .object({
    messages: MessagesSchema,
    provider: ProviderSchema.optional().nullable(),
    model: ModelSchema,
    models: FallbackModelsSchema.optional().nullable(),
    top_logprobs: z
      .int()
      .min(0)
      .max(20)
      .optional()
      .nullable()
      .describe(
        "An integer between 0 and 20 specifying the number of most likely tokens to return at each token position, each with an associated log probability."
      ),
    response_format: ResponseFormatSchema.optional().nullable(),
    seed: SeedSchema.optional().nullable(),
    tool_choice: ToolChoiceSchema.optional().nullable(),
    tools: ToolsSchema,
    parallel_tool_calls: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "Whether to allow the model to make multiple tool calls in parallel."
      ),
    prediction: PredictionSchema.optional().nullable(),
    backoff_max_elapsed_time: BackoffMaxElapsedTimeSchema.optional().nullable(),
    first_chunk_timeout: FirstChunkTimeoutSchema.optional().nullable(),
    other_chunk_timeout: OtherChunkTimeoutSchema.optional().nullable(),
  })
  .describe("Base parameters for creating a chat completion.");
export type ChatCompletionCreateParamsBase = z.infer<
  typeof ChatCompletionCreateParamsBaseSchema
>;
export const ChatCompletionCreateParamsBaseJsonSchema: JSONSchema = convert(ChatCompletionCreateParamsBaseSchema);

export const StreamTrueSchema = z
  .literal(true)
  .describe("Whether to stream the response as a series of chunks.");
export type StreamTrue = z.infer<typeof StreamTrueSchema>;
export const StreamTrueJsonSchema: JSONSchema = convert(StreamTrueSchema);

export const ChatCompletionCreateParamsStreamingSchema =
  ChatCompletionCreateParamsBaseSchema.extend({
    stream: StreamTrueSchema,
  })
    .describe("Parameters for creating a streaming chat completion.")
    .meta({ title: "ChatCompletionCreateParamsStreaming" });
export type ChatCompletionCreateParamsStreaming = z.infer<
  typeof ChatCompletionCreateParamsStreamingSchema
>;
export const ChatCompletionCreateParamsStreamingJsonSchema: JSONSchema = convert(ChatCompletionCreateParamsStreamingSchema);

export const StreamFalseSchema = z
  .literal(false)
  .describe("Whether to stream the response as a series of chunks.");
export type StreamFalse = z.infer<typeof StreamFalseSchema>;
export const StreamFalseJsonSchema: JSONSchema = convert(StreamFalseSchema);

export const ChatCompletionCreateParamsNonStreamingSchema =
  ChatCompletionCreateParamsBaseSchema.extend({
    stream: StreamFalseSchema.optional().nullable(),
  })
    .describe("Parameters for creating a unary chat completion.")
    .meta({ title: "ChatCompletionCreateParamsNonStreaming" });
export type ChatCompletionCreateParamsNonStreaming = z.infer<
  typeof ChatCompletionCreateParamsNonStreamingSchema
>;
export const ChatCompletionCreateParamsNonStreamingJsonSchema: JSONSchema = convert(ChatCompletionCreateParamsNonStreamingSchema);

export const StreamSchema = z
  .boolean()
  .describe("Whether to stream the response as a series of chunks.");
export type Stream = z.infer<typeof StreamSchema>;
export const StreamJsonSchema: JSONSchema = convert(StreamSchema);

export const ChatCompletionCreateParamsSchema =
  ChatCompletionCreateParamsBaseSchema.extend({
    stream: StreamSchema.optional().nullable(),
  })
    .describe("Parameters for creating a chat completion.")
    .meta({ title: "ChatCompletionCreateParams" });
export type ChatCompletionCreateParams = z.infer<
  typeof ChatCompletionCreateParamsSchema
>;
export const ChatCompletionCreateParamsJsonSchema: JSONSchema = convert(ChatCompletionCreateParamsSchema);
