import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const OpenRouterByokApiKeySchema = z.object({
  api_key: z.string().describe("The OpenRouter API key."),
});
export type OpenRouterByokApiKey = z.infer<typeof OpenRouterByokApiKeySchema>;
export const OpenRouterByokApiKeyJsonSchema: JSONSchema = convert(
  OpenRouterByokApiKeySchema,
);
