import { ChatCompletionSchema as SuperChatCompletionSchema } from "src/chat/completions/response/unary/chat_completion";
import { ObjectiveAIErrorSchema } from "src/error";
import z from "zod";
import { convert, type JSONSchema } from "../../../../json_schema";

export const ChatCompletionSchema = SuperChatCompletionSchema.extend({
  index: z
    .uint32()
    .describe("The index of the completion amongst all chat completions."),
  error: ObjectiveAIErrorSchema.optional().describe(
    "An error encountered during the generation of this chat completion."
  ),
}).describe(
  "A chat completion generated in the pursuit of a vector completion."
);
export type ChatCompletion = z.infer<typeof ChatCompletionSchema>;
export const ChatCompletionJsonSchema: JSONSchema = convert(ChatCompletionSchema);
