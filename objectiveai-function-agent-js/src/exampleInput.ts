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

export const ExampleInputsSchema = z.array(ExampleInputSchema).min(10);
export type ExampleInputs = z.infer<typeof ExampleInputsSchema>;
