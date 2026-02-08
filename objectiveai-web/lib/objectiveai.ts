/**
 * ObjectiveAI helpers.
 * For SDK clients, use lib/client.ts (createPublicClient / createClient)
 * or hooks/useObjectiveAI.ts (getClient / getPublicClient).
 */

// Development defaults per CLAUDE.md - no real LLM costs
export const DEV_EXECUTION_OPTIONS = {
  from_cache: true,
  from_rng: true,
  stream: true, // Enabled for production - only had issues in Next.js dev mode
  // reasoning: disabled by default to avoid costs
  // To enable, uncomment below (costs ~$0.0001-0.001 per execution):
  // reasoning: {
  //   model: {
  //     model: "openai/gpt-4o-mini",
  //     output_mode: "instruction" as const,
  //   },
  // },
} as const;

// Reasoning config for when you want AI-generated explanations (has cost)
export const REASONING_MODEL = {
  model: {
    model: "openai/gpt-4o-mini",
    output_mode: "instruction" as const,
  },
} as const;

// Helper: derive category from function type
export function deriveCategory(fn: { type?: string; repository?: string }): string {
  if (fn.type === "vector.function") {
    return "Ranking";
  }
  const repo = (fn as { repository?: string }).repository?.toLowerCase() || "";
  if (repo.includes("rank") || repo.includes("sort")) return "Ranking";
  if (repo.includes("transform") || repo.includes("convert")) return "Transformation";
  if (repo.includes("composite") || repo.includes("multi")) return "Composite";
  return "Scoring";
}

// Helper: derive display name from repository name
export function deriveDisplayName(repository: string): string {
  return repository
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
