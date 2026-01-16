import {
  UsageCompletionTokensDetailsSchema,
  UsageCostDetailsSchema,
  UsagePromptTokensDetailsSchema,
} from "src/chat/completions/response/usage";
import z from "zod";

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
  })
  .describe("Token and cost usage statistics for the completion.");
export type Usage = z.infer<typeof UsageSchema>;
