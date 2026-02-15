import z from "zod";
import { ChoiceSchema } from "./choice";
import { UsageSchema } from "../usage";
import { ResponseObjectSchema } from "./response_object";
import { convert, type JSONSchema } from "../../../../json_schema";

export const ChatCompletionSchema = z
  .object({
    id: z.string().describe("The unique identifier of the chat completion."),
    upstream_id: z
      .string()
      .describe("The unique identifier of the upstream chat completion."),
    choices: z
      .array(ChoiceSchema)
      .describe("The list of choices in this chat completion."),
    created: z
      .uint32()
      .describe(
        "The Unix timestamp (in seconds) when the chat completion was created."
      ),
    model: z
      .string()
      .describe(
        "The unique identifier of the Ensemble LLM used for this chat completion."
      ),
    upstream_model: z
      .string()
      .describe("The upstream model used for this chat completion."),
    object: ResponseObjectSchema,
    service_tier: z.string().optional(),
    system_fingerprint: z.string().optional(),
    usage: UsageSchema,
    provider: z
      .string()
      .optional()
      .describe("The provider used for this chat completion."),
  })
  .describe("A unary chat completion response.");
export type ChatCompletion = z.infer<typeof ChatCompletionSchema>;
export const ChatCompletionJsonSchema: JSONSchema = convert(ChatCompletionSchema);
