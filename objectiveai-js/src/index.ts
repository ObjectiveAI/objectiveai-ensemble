import OpenAI from "openai";
import { Stream } from "openai/streaming";
import z from "zod";

export namespace Auth {
  export const ApiKeySchema = z.object({
    api_key: z.string().describe("The API key."),
    created: z
      .string()
      .describe("The RFC 3339 timestamp when the API key was created."),
    expires: z
      .string()
      .nullable()
      .describe(
        "The RFC 3339 timestamp when the API key expires, or null if it does not expire."
      ),
    disabled: z
      .string()
      .nullable()
      .describe(
        "The RFC 3339 timestamp when the API key was disabled, or null if it is not disabled."
      ),
    name: z.string().describe("The name of the API key."),
    description: z
      .string()
      .nullable()
      .describe(
        "The description of the API key, or null if no description was provided."
      ),
  });
  export type ApiKey = z.infer<typeof ApiKeySchema>;

  export const ApiKeyWithCostSchema = ApiKeySchema.extend({
    cost: z
      .number()
      .describe("The total cost incurred while using this API key."),
  });
  export type ApiKeyWithCost = z.infer<typeof ApiKeyWithCostSchema>;

  export namespace ApiKey {
    export async function list(
      openai: OpenAI,
      options?: OpenAI.RequestOptions
    ): Promise<{ data: ApiKeyWithCost[] }> {
      const response = await openai.get("/auth/keys", options);
      return response as { data: ApiKeyWithCost[] };
    }

    export async function create(
      openai: OpenAI,
      name: string,
      expires?: Date | null,
      description?: string | null,
      options?: OpenAI.RequestOptions
    ): Promise<ApiKey> {
      const response = await openai.post("/auth/keys", {
        body: {
          name,
          expires,
          description,
        },
        ...options,
      });
      return response as ApiKey;
    }

    export async function remove(
      openai: OpenAI,
      key: string,
      options?: OpenAI.RequestOptions
    ): Promise<ApiKey> {
      const response = await openai.delete("/auth/keys", {
        body: {
          api_key: key,
        },
        ...options,
      });
      return response as ApiKey;
    }
  }

  export const OpenRouterApiKeySchema = z.object({
    api_key: z.string().describe("The OpenRouter API key."),
  });
  export type OpenRouterApiKey = z.infer<typeof OpenRouterApiKeySchema>;

  export namespace OpenRouterApiKey {
    export async function retrieve(
      openai: OpenAI,
      options?: OpenAI.RequestOptions
    ): Promise<OpenRouterApiKey> {
      const response = await openai.get("/auth/keys/openrouter", options);
      return response as OpenRouterApiKey;
    }

    export async function create(
      openai: OpenAI,
      apiKey: string,
      options?: OpenAI.RequestOptions
    ): Promise<OpenRouterApiKey> {
      const response = await openai.post("/auth/keys/openrouter", {
        body: {
          api_key: apiKey,
        },
        ...options,
      });
      return response as OpenRouterApiKey;
    }

    export async function remove(
      openai: OpenAI,
      options?: OpenAI.RequestOptions
    ): Promise<OpenRouterApiKey> {
      const response = await openai.delete("/auth/keys/openrouter", options);
      return response as OpenRouterApiKey;
    }
  }
}
