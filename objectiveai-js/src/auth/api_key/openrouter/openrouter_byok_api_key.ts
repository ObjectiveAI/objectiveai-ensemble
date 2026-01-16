import z from "zod";

export const OpenRouterByokApiKeySchema = z.object({
  api_key: z.string().describe("The OpenRouter API key."),
});
export type OpenRouterByokApiKey = z.infer<typeof OpenRouterByokApiKeySchema>;
