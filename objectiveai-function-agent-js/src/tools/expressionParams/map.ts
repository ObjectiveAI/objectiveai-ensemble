import { Functions } from "objectiveai";
import z from "zod";

/**
 * Read the schema for `map` in expression context.
 * Map is a 1D array from the 2D input maps, selected by the task's map index.
 */
export function readMapParamSchema(): z.ZodType {
  return Functions.Expression.InputMapsAsParameterSchema;
}
