import { unstable_cache } from "next/cache";
import { EnsembleLlm } from "objectiveai";
import { createPublicClient } from "./client";

export interface EnsembleLlmItem {
  id: string;
}

/**
 * Fetches all ensemble LLMs from the API with 120s ISR caching.
 * This runs server-side and is shared across all users.
 */
export const getEnsembleLlms = unstable_cache(
  async (): Promise<EnsembleLlmItem[]> => {
    const client = createPublicClient();
    const result = await EnsembleLlm.list(client);
    return result.data || [];
  },
  ["ensemble-llms-list"],
  {
    revalidate: 120, // 2 minutes
    tags: ["ensemble-llms"],
  }
);
