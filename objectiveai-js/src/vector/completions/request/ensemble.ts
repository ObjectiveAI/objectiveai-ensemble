import { EnsembleBaseSchema } from "src/ensemble/ensemble";
import z from "zod";

export const EnsembleSchema = z
  .union([
    z
      .string()
      .describe("The unique identifier for the Ensemble.")
      .meta({ title: "EnsembleId" }),
    EnsembleBaseSchema,
  ])
  .describe(
    "The Ensemble to use for this completion. May be a unique ID or an inline definition."
  );
export type Ensemble = z.infer<typeof EnsembleSchema>;
