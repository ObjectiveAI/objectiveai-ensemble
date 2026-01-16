import OpenAI from "openai";
import { OpenRouterByokApiKey } from "./openrouter_byok_api_key";

export async function retrieve(
  openai: OpenAI,
  options?: OpenAI.RequestOptions
): Promise<OpenRouterByokApiKey> {
  const response = await openai.get("/auth/keys/openrouter", options);
  return response as OpenRouterByokApiKey;
}

export async function create(
  openai: OpenAI,
  apiKey: string,
  options?: OpenAI.RequestOptions
): Promise<OpenRouterByokApiKey> {
  const response = await openai.post("/auth/keys/openrouter", {
    body: {
      api_key: apiKey,
    },
    ...options,
  });
  return response as OpenRouterByokApiKey;
}

export async function remove(
  openai: OpenAI,
  options?: OpenAI.RequestOptions
): Promise<void> {
  const _ = await openai.delete("/auth/keys/openrouter", options);
}
