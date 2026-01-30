import z from "zod";
import { ApiKeyWithMetadata, ApiKeyWithMetadataSchema } from "./api_key";
import { ObjectiveAI, RequestOptions } from "../../client";

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

export function list(
  client: ObjectiveAI,
  options?: RequestOptions,
): Promise<List> {
  return client.get_unary<List>("/auth/keys", undefined, options);
}

export function create(
  client: ObjectiveAI,
  name: string,
  expires?: Date | null,
  description?: string | null,
  options?: RequestOptions,
): Promise<ApiKeyWithMetadata> {
  return client.post_unary<ApiKeyWithMetadata>(
    "/auth/keys",
    { name, expires, description },
    options,
  );
}

export function disable(
  client: ObjectiveAI,
  key: string,
  options?: RequestOptions,
): Promise<ApiKeyWithMetadata> {
  return client.delete_unary<ApiKeyWithMetadata>(
    "/auth/keys",
    { api_key: key },
    options,
  );
}
