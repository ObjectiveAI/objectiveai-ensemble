import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const EnsembleSchema = z
  .string()
  .describe(
    "The unique identifier of the Ensemble used for this vector completion."
  );
export type Ensemble = z.infer<typeof EnsembleSchema>;
export const EnsembleJsonSchema: JSONSchema = convert(EnsembleSchema);
