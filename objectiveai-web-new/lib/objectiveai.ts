/**
 * ObjectiveAI SDK wrapper for web-new
 * Imports from the objectiveai package
 */

// Re-export from the SDK
export { ObjectiveAI } from "objectiveai";
export { Functions } from "objectiveai";

// Import for internal use
import { ObjectiveAI } from "objectiveai";

// Singleton client instance
let clientInstance: ObjectiveAI | null = null;

export function getClient(): ObjectiveAI {
  if (!clientInstance) {
    clientInstance = new ObjectiveAI();
  }
  return clientInstance;
}

// Development defaults per CLAUDE.md - no real LLM costs
export const DEV_EXECUTION_OPTIONS = {
  from_cache: true,
  from_rng: true,
  reasoning: {
    model: "openai/gpt-4o-mini", // Fast, cheap model for reasoning summary
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
