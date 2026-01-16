import {
  EnsembleLlmBaseWithFallbacksAndCountSchema,
  EnsembleLlmWithFallbacksAndCountSchema,
} from "src/ensemble_llm/ensemble_llm";
import z from "zod";

export const EnsembleBaseSchema = z
  .object({
    llms: z
      .array(EnsembleLlmBaseWithFallbacksAndCountSchema)
      .describe("The list of LLMs that make up the ensemble."),
  })
  .describe("An ensemble of LLMs.")
  .meta({ title: "EnsembleBase" });
export type EnsembleBase = z.infer<typeof EnsembleBaseSchema>;

export const EnsembleSchema = z
  .object({
    id: z.string().describe("The unique identifier for the Ensemble."),
    llms: z
      .array(EnsembleLlmWithFallbacksAndCountSchema)
      .describe(EnsembleBaseSchema.shape.llms.description!),
  })
  .describe("An ensemble of LLMs with a unique identifier.")
  .meta({ title: "Ensemble" });
export type Ensemble = z.infer<typeof EnsembleSchema>;
