import z from "zod";
import { Scores } from "./scores";
import { convert, type JSONSchema } from "../../../json_schema";

export const WeightsSchema = z
  .array(z.number())
  .describe(
    "The weights assigned to each response in the request, aggregated from the votes of the Ensemble LLMs."
  );
export type Weights = z.infer<typeof WeightsSchema>;
export const WeightsJsonSchema: JSONSchema = convert(WeightsSchema);

export namespace Weights {
  export function merged(a: Weights, b: Weights): [Weights, boolean] {
    return Scores.merged(a, b);
  }
}
