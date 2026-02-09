import { unstable_cache } from "next/cache";
import { Functions } from "objectiveai";
import { createPublicClient } from "./client";
import { deriveCategory, deriveDisplayName } from "./objectiveai";

// Function item type for UI
export interface FunctionItem {
  slug: string;
  owner: string;
  repository: string;
  commit: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
}

/**
 * Fetch all functions with their details (N+1 query).
 * Cached with 120s revalidation (ISR).
 */
export const fetchFunctionsWithDetails = unstable_cache(
  async (): Promise<FunctionItem[]> => {
    const client = createPublicClient();

    // Get all functions via SDK
    const result = await Functions.list(client);

    // Deduplicate by owner/repository (same function may have multiple commits)
    const uniqueFunctions = new Map<
      string,
      { owner: string; repository: string; commit: string }
    >();
    for (const fn of result.data) {
      const key = `${fn.owner}/${fn.repository}`;
      if (!uniqueFunctions.has(key)) {
        uniqueFunctions.set(key, fn);
      }
    }

    // Fetch details for each unique function via API
    const functionItems: FunctionItem[] = await Promise.all(
      Array.from(uniqueFunctions.values()).map(async (fn) => {
        // Use -- separator for slug (single path segment)
        const slug = `${fn.owner}--${fn.repository}`;

        // Fetch full function details via SDK
        const details = await Functions.retrieve(
          client,
          fn.owner,
          fn.repository,
          fn.commit
        );

        const category = deriveCategory(details);
        const name = deriveDisplayName(fn.repository);

        // Extract tags from repository name
        const tags = fn.repository.split("-").filter((t: string) => t.length > 2);
        if (details.type === "vector.function") tags.push("ranking");
        else tags.push("scoring");

        return {
          slug,
          owner: fn.owner,
          repository: fn.repository,
          commit: fn.commit,
          name,
          description: details.description || `${name} function`,
          category,
          tags,
        };
      })
    );

    return functionItems;
  },
  ["functions-with-details"],
  {
    revalidate: 120, // ISR: revalidate every 2 minutes
    tags: ["functions"],
  }
);
