import { JsonValueSchema } from "src/json";
import { ScoresSchema } from "src/vector/completions/response/scores";
import { VotesSchema } from "src/vector/completions/response/vote";
import { WeightsSchema } from "src/vector/completions/response/weights";
import z from "zod";

export const VectorCompletionOutputSchema = z
  .object({
    votes: VotesSchema,
    scores: ScoresSchema,
    weights: WeightsSchema,
  })
  .describe("The output of a vector completion task.");
export type VectorCompletionOutput = z.infer<
  typeof VectorCompletionOutputSchema
>;

export const FunctionOutputSchema = z
  .union([
    z.number().describe("The scalar output of the function execution."),
    z
      .array(z.number())
      .describe("The vector output of the function execution."),
    JsonValueSchema.describe("The erroneous output of the function execution."),
  ])
  .describe("The output of a function execution.");
export type FunctionOutput = z.infer<typeof FunctionOutputSchema>;

export const CompiledFunctionOutputSchema = z
  .object({
    output: FunctionOutputSchema,
    valid: z.boolean().describe("Whether the function output is valid."),
  })
  .describe("The output of a function execution, including its validity.");
export type CompiledFunctionOutput = z.infer<
  typeof CompiledFunctionOutputSchema
>;

export const TaskOutputSchema = z
  .union([
    VectorCompletionOutputSchema,
    FunctionOutputSchema,
    z.null().describe("The output of a skipped task."),
  ])
  .describe("The output of a task.");
export type TaskOutput = z.infer<typeof TaskOutputSchema>;
