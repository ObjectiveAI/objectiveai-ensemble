import { ObjectiveAI, RequestOptions } from "../../../client";
import { OpenRouterByokApiKey } from "./openrouter_byok_api_key";

export function retrieve(
  client: ObjectiveAI,
  options?: RequestOptions,
): Promise<OpenRouterByokApiKey> {
  return client.get_unary<OpenRouterByokApiKey>(
    "/auth/keys/openrouter",
    undefined,
    options,
  );
}

export function create(
  client: ObjectiveAI,
  apiKey: string,
  options?: RequestOptions,
): Promise<OpenRouterByokApiKey> {
  return client.post_unary<OpenRouterByokApiKey>(
    "/auth/keys/openrouter",
    { api_key: apiKey },
    options,
  );
}

export function remove(
  client: ObjectiveAI,
  options?: RequestOptions,
): Promise<void> {
  return client.delete_unary<void>("/auth/keys/openrouter", undefined, options);
}
