import { unstable_cache } from "next/cache";
import { Functions } from "objectiveai";
import { createPublicClient } from "./client";

export interface ProfileItem {
  owner: string;
  repository: string;
  commit: string;
}

/**
 * Fetch all profiles with ISR caching (120s revalidation).
 *
 * Note: The profiles endpoint only returns identifiers (owner, repository, commit).
 * Unlike functions, there's no N+1 fetch pattern needed since descriptions aren't
 * available in the list response.
 */
export const getProfiles = unstable_cache(
  async (): Promise<ProfileItem[]> => {
    const client = createPublicClient();
    const response = await Functions.Profiles.list(client);
    return response.data || [];
  },
  ["profiles-list"],
  {
    revalidate: 120, // 2 minutes
    tags: ["profiles"],
  }
);
