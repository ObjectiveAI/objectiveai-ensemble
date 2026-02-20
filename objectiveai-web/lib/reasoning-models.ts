/**
 * Runtime utility for loading reasoning models from build-time generated JSON
 * Exported types match the structure from scripts/fetch-reasoning-models.ts
 */

export interface ReasoningModel {
  value: string; // model ID (e.g., "openai/gpt-5-mini")
  label: string; // display name (e.g., "GPT-5 Mini")
  provider: string; // "OpenAI", "Google", "Anthropic"
  tier: "affordable" | "premium"; // cost/quality tier
  pricing: { prompt: number; completion: number };
}

export interface ReasoningModelsConfig {
  generated_at: string;
  default_model: string;
  models: ReasoningModel[];
}

let cachedModels: ReasoningModelsConfig | null = null;

/**
 * Load reasoning models from static JSON file
 * Result is cached for subsequent calls
 */
export async function loadReasoningModels(): Promise<ReasoningModelsConfig> {
  if (cachedModels) return cachedModels;

  try {
    const response = await fetch('/reasoning-models.json');
    if (!response.ok) {
      throw new Error(`Failed to load reasoning models: ${response.status}`);
    }
    const data = await response.json() as ReasoningModelsConfig;
    cachedModels = data;
    return data;
  } catch (error) {
    console.error('Error loading reasoning models:', error);
    // Fallback to minimal configuration
    return {
      generated_at: new Date().toISOString(),
      default_model: 'anthropic/claude-haiku-4.5',
      models: [
        {
          value: 'anthropic/claude-haiku-4.5',
          label: 'Claude Haiku 4.5',
          provider: 'Anthropic',
          tier: 'affordable',
          pricing: { prompt: 0.000001, completion: 0.000005 }
        },
        {
          value: 'anthropic/claude-sonnet-4.5',
          label: 'Claude Sonnet 4.5',
          provider: 'Anthropic',
          tier: 'premium',
          pricing: { prompt: 0.000003, completion: 0.000015 }
        }
      ]
    };
  }
}

/**
 * Group models by provider
 * Useful for displaying options grouped by vendor
 */
export function groupByProvider(
  models: ReasoningModel[]
): Record<string, ReasoningModel[]> {
  return models.reduce(
    (acc, model) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, ReasoningModel[]>
  );
}

/**
 * Sort models by tier (affordable first) then by label
 * Useful for displaying options in logical order
 */
export function sortByTier(models: ReasoningModel[]): ReasoningModel[] {
  return [...models].sort((a, b) => {
    if (a.tier === b.tier) {
      return a.label.localeCompare(b.label);
    }
    return a.tier === 'affordable' ? -1 : 1;
  });
}

/**
 * Sort models by provider and tier (provider grouping)
 * Useful for displaying options grouped by vendor, then by cost
 */
export function sortByProviderAndTier(models: ReasoningModel[]): ReasoningModel[] {
  const providerOrder = { OpenAI: 0, Google: 1, Anthropic: 2 };
  return [...models].sort((a, b) => {
    const providerCmp =
      (providerOrder[a.provider as keyof typeof providerOrder] ?? 99) -
      (providerOrder[b.provider as keyof typeof providerOrder] ?? 99);
    if (providerCmp !== 0) return providerCmp;

    if (a.tier === b.tier) {
      return a.label.localeCompare(b.label);
    }
    return a.tier === 'affordable' ? -1 : 1;
  });
}

/**
 * Get models for a specific provider
 */
export function filterByProvider(
  models: ReasoningModel[],
  provider: string
): ReasoningModel[] {
  return models.filter(m => m.provider === provider);
}

/**
 * Get models for a specific tier
 */
export function filterByTier(
  models: ReasoningModel[],
  tier: "affordable" | "premium"
): ReasoningModel[] {
  return models.filter(m => m.tier === tier);
}
