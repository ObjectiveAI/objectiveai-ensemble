import z from "zod";

export const UsageCompletionTokensDetailsSchema = z
  .object({
    accepted_prediction_tokens: z
      .uint32()
      .optional()
      .describe("The number of accepted prediction tokens in the completion."),
    audio_tokens: z
      .uint32()
      .optional()
      .describe("The number of generated audio tokens in the completion."),
    reasoning_tokens: z
      .uint32()
      .optional()
      .describe("The number of generated reasoning tokens in the completion."),
    rejected_prediction_tokens: z
      .uint32()
      .optional()
      .describe("The number of rejected prediction tokens in the completion."),
  })
  .describe("Detailed breakdown of generated completion tokens.");
export type UsageCompletionTokensDetails = z.infer<
  typeof UsageCompletionTokensDetailsSchema
>;

export const UsagePromptTokensDetailsSchema = z
  .object({
    audio_tokens: z
      .uint32()
      .optional()
      .describe("The number of audio tokens in the prompt."),
    cached_tokens: z
      .uint32()
      .optional()
      .describe("The number of cached tokens in the prompt."),
    cache_write_tokens: z
      .uint32()
      .optional()
      .describe("The number of prompt tokens written to cache."),
    video_tokens: z
      .uint32()
      .optional()
      .describe("The number of video tokens in the prompt."),
  })
  .describe("Detailed breakdown of prompt tokens.");
export type UsagePromptTokensDetails = z.infer<
  typeof UsagePromptTokensDetailsSchema
>;

export const UsageCostDetailsSchema = z
  .object({
    upstream_inference_cost: z
      .number()
      .optional()
      .describe("The cost incurred upstream."),
    upstream_upstream_inference_cost: z
      .number()
      .optional()
      .describe("The cost incurred by upstream's upstream."),
  })
  .describe("Detailed breakdown of upstream costs incurred.");
export type UsageCostDetails = z.infer<typeof UsageCostDetailsSchema>;

export const UsageSchema = z
  .object({
    completion_tokens: z
      .uint32()
      .describe("The number of tokens generated in the completion."),
    prompt_tokens: z.uint32().describe("The number of tokens in the prompt."),
    total_tokens: z
      .uint32()
      .describe(
        "The total number of tokens used in the prompt or generated in the completion."
      ),
    completion_tokens_details: UsageCompletionTokensDetailsSchema.optional(),
    prompt_tokens_details: UsagePromptTokensDetailsSchema.optional(),
    cost: z
      .number()
      .describe("The cost in credits incurred for this completion."),
    cost_details: UsageCostDetailsSchema.optional(),
    total_cost: z
      .number()
      .describe("The total cost in credits incurred including upstream costs."),
    cost_multiplier: z
      .number()
      .describe(
        "The cost multiplier applied to upstream costs for computing ObjectiveAI costs."
      ),
    is_byok: z
      .boolean()
      .describe(
        "Whether the completion used a BYOK (Bring Your Own Key) API Key."
      ),
  })
  .describe("Token and cost usage statistics for the completion.");
export type Usage = z.infer<typeof UsageSchema>;
