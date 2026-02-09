import { unstable_cache } from "next/cache";
import { Ensemble } from "objectiveai";
import { createPublicClient } from "./client";

export interface EnsembleItem {
  id: string;
}

/**
 * Fetches all ensembles from the API with 120s ISR caching.
 * This runs server-side and is shared across all users.
 */
export const getEnsembles = unstable_cache(
  async (): Promise<EnsembleItem[]> => {
    const client = createPublicClient();
    const result = await Ensemble.list(client);
    return result.data || [];
  },
  ["ensembles-list"],
  {
    revalidate: 120, // 2 minutes
    tags: ["ensembles"],
  }
);
