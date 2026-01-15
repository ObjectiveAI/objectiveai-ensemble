import z from "zod";

export const EnsembleSchema = z
  .string()
  .describe(
    "The unique identifier of the Ensemble used for this vector completion."
  );
export type Ensemble = z.infer<typeof EnsembleSchema>;
