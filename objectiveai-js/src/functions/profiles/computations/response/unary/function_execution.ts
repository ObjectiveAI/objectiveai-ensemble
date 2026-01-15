import { FunctionExecutionSchema as SuperFunctionExecutionSchema } from "src/functions/executions/response/unary/function_execution";
import z from "zod";

export const FunctionExecutionSchema = SuperFunctionExecutionSchema.extend({
  index: z
    .uint32()
    .describe("The index of the function execution in the list of executions."),
  dataset: z
    .uint32()
    .describe(
      "The index of the dataset item this function execution corresponds to."
    ),
  n: z
    .uint32()
    .describe(
      "The N index for this function execution. There will be N function executions, and N comes from the request parameters."
    ),
  retry: z
    .uint32()
    .describe(
      "The retry index for this function execution. There may be multiple retries for a given dataset item and N index."
    ),
}).describe("A function execution ran during profile computation.");
export type FunctionExecution = z.infer<typeof FunctionExecutionSchema>;
