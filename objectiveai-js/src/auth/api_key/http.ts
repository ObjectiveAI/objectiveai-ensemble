import z from "zod";
import { ApiKeyWithMetadata, ApiKeyWithMetadataSchema } from "./api_key";
import OpenAI from "openai";

export const ListItemSchema = ApiKeyWithMetadataSchema.extend({
  cost: z
    .number()
    .describe("The total cost incurred while using this API key."),
});
export type ListItem = z.infer<typeof ListItemSchema>;

export const ListSchema = z.object({
  data: z.array(ListItemSchema).describe("A list of API keys."),
});
export type List = z.infer<typeof ListSchema>;

export async function list(
  openai: OpenAI,
  options?: OpenAI.RequestOptions
): Promise<List> {
  const response = await openai.get("/auth/keys", options);
  return response as List;
}

export async function create(
  openai: OpenAI,
  name: string,
  expires?: Date | null,
  description?: string | null,
  options?: OpenAI.RequestOptions
): Promise<ApiKeyWithMetadata> {
  const response = await openai.post("/auth/keys", {
    body: {
      name,
      expires,
      description,
    },
    ...options,
  });
  return response as ApiKeyWithMetadata;
}

export async function disable(
  openai: OpenAI,
  key: string,
  options?: OpenAI.RequestOptions
): Promise<ApiKeyWithMetadata> {
  const response = await openai.delete("/auth/keys", {
    body: {
      api_key: key,
    },
    ...options,
  });
  return response as ApiKeyWithMetadata;
}
