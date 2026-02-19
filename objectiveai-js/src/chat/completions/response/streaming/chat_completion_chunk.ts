import z from "zod";
import { Choice, ChoiceSchema } from "./choice";
import { UsageSchema } from "../usage";
import { ResponseObjectSchema } from "./response_object";
import { merge } from "src/merge";
import { convert, type JSONSchema } from "../../../../json_schema";

export const ChatCompletionChunkSchema = z
  .object({
    id: z.string().describe("The unique identifier of the chat completion."),
    upstream_id: z
      .string()
      .describe("The unique identifier of the upstream chat completion."),
    choices: z
      .array(ChoiceSchema)
      .describe("The list of choices in this chunk."),
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
    usage: UsageSchema.optional(),
    provider: z
      .string()
      .optional()
      .describe("The provider used for this chat completion."),
  })
  .describe("A chunk in a streaming chat completion response.");
export type ChatCompletionChunk = z.infer<typeof ChatCompletionChunkSchema>;
export const ChatCompletionChunkJsonSchema: JSONSchema = convert(ChatCompletionChunkSchema);

export namespace ChatCompletionChunk {
  export function merged(
    a: ChatCompletionChunk,
    b: ChatCompletionChunk
  ): [ChatCompletionChunk, boolean] {
    const id = a.id;
    const upstream_id = a.upstream_id;
    const [choices, choicesChanged] = Choice.mergedList(a.choices, b.choices);
    const created = a.created;
    const model = a.model;
    const upstream_model = a.upstream_model;
    const object = a.object;
    const [service_tier, service_tierChanged] = merge(
      a.service_tier,
      b.service_tier
    );
    const [system_fingerprint, system_fingerprintChanged] = merge(
      a.system_fingerprint,
      b.system_fingerprint
    );
    const [usage, usageChanged] = merge(a.usage, b.usage);
    const [provider, providerChanged] = merge(a.provider, b.provider);
    if (
      choicesChanged ||
      service_tierChanged ||
      system_fingerprintChanged ||
      usageChanged ||
      providerChanged
    ) {
      return [
        {
          id,
          upstream_id,
          choices,
          created,
          model,
          upstream_model,
          object,
          ...(service_tier !== undefined ? { service_tier } : {}),
          ...(system_fingerprint !== undefined ? { system_fingerprint } : {}),
          ...(usage !== undefined ? { usage } : {}),
          ...(provider !== undefined ? { provider } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
