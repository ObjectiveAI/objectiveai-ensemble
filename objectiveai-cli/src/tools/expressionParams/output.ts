import { Functions } from "objectiveai";
import z from "zod";

/**
 * Read the schema for `output` in expression context.
 * Union of all possible task output types:
 * VectorCompletionOutput, VectorCompletionOutput[], FunctionOutput, FunctionOutput[], or null (skipped).
 */
export function readOutputParamSchema(): z.ZodType {
  return Functions.Expression.TaskOutputSchema;
}
