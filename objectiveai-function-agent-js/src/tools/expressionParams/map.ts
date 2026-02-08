import { Functions } from "objectiveai";
import z from "zod";

/**
 * Read the schema for `map` in expression context.
 * For a task with `map: i`, `map` is the full sub-array produced by `input_maps[i]`.
 * Use indexing (e.g., `map[0]`) to access individual elements.
 */
export function readMapParamSchema(): z.ZodType {
  return Functions.Expression.InputMapsAsParameterSchema;
}
