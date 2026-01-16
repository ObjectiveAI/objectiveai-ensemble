import { ChatCompletionSchema } from "src/chat/completions/response/unary/chat_completion";
import { ObjectiveAIErrorSchema } from "src/error";
import z from "zod";

export const ReasoningSummarySchema = ChatCompletionSchema.extend({
  error: ObjectiveAIErrorSchema.nullable().describe(
    "When non-null, indicates that an error occurred during the chat completion."
  ),
}).describe("A reasoning summary generation.");
export type ReasoningSummary = z.infer<typeof ReasoningSummarySchema>;
