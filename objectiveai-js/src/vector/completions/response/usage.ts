import {
  UsageCompletionTokensDetails,
  UsageCompletionTokensDetailsSchema,
  UsageCostDetails,
  UsageCostDetailsSchema,
  UsagePromptTokensDetails,
  UsagePromptTokensDetailsSchema,
} from "src/chat/completions/response/usage";
import { numberIsEmpty } from "src/isEmpty";
import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

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
