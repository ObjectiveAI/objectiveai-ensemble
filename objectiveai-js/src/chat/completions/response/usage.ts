import { numberIsEmpty } from "src/isEmpty";
import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

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
export const UsageCompletionTokensDetailsJsonSchema: JSONSchema = convert(
  UsageCompletionTokensDetailsSchema,
);

export namespace UsageCompletionTokensDetails {
  export function isEmpty({
    accepted_prediction_tokens,
    audio_tokens,
    reasoning_tokens,
    rejected_prediction_tokens,
  }: UsageCompletionTokensDetails): boolean {
    return (
      numberIsEmpty(accepted_prediction_tokens) &&
      numberIsEmpty(audio_tokens) &&
      numberIsEmpty(reasoning_tokens) &&
      numberIsEmpty(rejected_prediction_tokens)
    );
  }
}

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
export const UsagePromptTokensDetailsJsonSchema: JSONSchema = convert(
  UsagePromptTokensDetailsSchema,
);

export namespace UsagePromptTokensDetails {
  export function isEmpty({
    audio_tokens,
    cached_tokens,
    cache_write_tokens,
    video_tokens,
  }: UsagePromptTokensDetails): boolean {
    return (
      numberIsEmpty(audio_tokens) &&
      numberIsEmpty(cached_tokens) &&
      numberIsEmpty(cache_write_tokens) &&
      numberIsEmpty(video_tokens)
    );
  }
}

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
export const UsageCostDetailsJsonSchema: JSONSchema = convert(
  UsageCostDetailsSchema,
);

export namespace UsageCostDetails {
  export function isEmpty({
    upstream_inference_cost,
    upstream_upstream_inference_cost,
  }: UsageCostDetails): boolean {
    return (
      numberIsEmpty(upstream_inference_cost) &&
      numberIsEmpty(upstream_upstream_inference_cost)
    );
  }
}

export const UsageSchema = z
  .object({
    completion_tokens: z
      .uint32()
      .describe("The number of tokens generated in the completion."),
    prompt_tokens: z.uint32().describe("The number of tokens in the prompt."),
    total_tokens: z
      .uint32()
      .describe(
        "The total number of tokens used in the prompt or generated in the completion.",
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
        "The cost multiplier applied to upstream costs for computing ObjectiveAI costs.",
      ),
    is_byok: z
      .boolean()
      .describe(
        "Whether the completion used a BYOK (Bring Your Own Key) API Key.",
      ),
  })
  .describe("Token and cost usage statistics for the completion.");
export type Usage = z.infer<typeof UsageSchema>;
export const UsageJsonSchema: JSONSchema = convert(UsageSchema);

export namespace Usage {
  export function isEmpty({
    completion_tokens,
    prompt_tokens,
    total_tokens,
    completion_tokens_details,
    prompt_tokens_details,
    cost,
    cost_details,
    total_cost,
  }: Usage): boolean {
    return (
      numberIsEmpty(completion_tokens) &&
      numberIsEmpty(prompt_tokens) &&
      numberIsEmpty(total_tokens) &&
      (completion_tokens_details === undefined ||
        UsageCompletionTokensDetails.isEmpty(completion_tokens_details)) &&
      (prompt_tokens_details === undefined ||
        UsagePromptTokensDetails.isEmpty(prompt_tokens_details)) &&
      numberIsEmpty(cost) &&
      (cost_details === undefined || UsageCostDetails.isEmpty(cost_details)) &&
      numberIsEmpty(total_cost)
    );
  }
}
