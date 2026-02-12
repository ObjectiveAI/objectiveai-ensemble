import { Functions } from "objectiveai";
import z from "zod";

/**
 * Read the schema for `map` in expression context.
 * For a task with `map: i`, the task is compiled once per element in `input_maps[i]`.
 * Each compiled instance receives the current element as `map`.
 */
export function readMapParamSchema(): z.ZodType {
  return Functions.Expression.InputMapsAsParameterSchema;
}
