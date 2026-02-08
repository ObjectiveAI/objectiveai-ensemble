import { Functions } from "objectiveai";
import z from "zod";

export const ExampleInputSchema = z.object({
  value: Functions.Expression.InputValueSchema,
  compiledTasks: Functions.CompiledTasksSchema,
  outputLength: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe("Expected output length for vector functions"),
});
export type ExampleInput = z.infer<typeof ExampleInputSchema>;

export const ExampleInputsSchema = z
  .array(ExampleInputSchema)
  .min(10)
  .max(100)
  .describe(
    "An array of example inputs for the function. Must contain between 10 and 100 items.",
  );
export type ExampleInputs = z.infer<typeof ExampleInputsSchema>;
