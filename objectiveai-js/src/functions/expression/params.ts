import { JsonValueSchema } from "src/json";
import { ScoresSchema } from "src/vector/completions/response/scores";
import { VectorCompletionChunk } from "src/vector/completions/response/streaming";
import { VectorCompletion } from "src/vector/completions/response/unary";
import { VotesSchema } from "src/vector/completions/response/vote";
import { WeightsSchema } from "src/vector/completions/response/weights";
import z from "zod";
import { InputValueSchema } from "./input";

export const InputMapsAsParameterSchema = z
  .array(InputValueSchema)
  .describe(
    "The current map sub-array provided to a mapped task expression. A 1D array from the 2D input maps, selected by the task's map index.",
  );
export type InputMapsAsParameter = z.infer<typeof InputMapsAsParameterSchema>;

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

export const MapVectorCompletionOutputSchema = z
  .array(VectorCompletionOutputSchema)
  .describe("The output of a mapped vector completion task.");
export type MapVectorCompletionOutput = z.infer<
  typeof MapVectorCompletionOutputSchema
>;

export function compileVectorCompletionOutput(
  completion: VectorCompletion | VectorCompletionChunk,
): VectorCompletionOutput {
  return {
    votes: completion.votes,
    scores: completion.scores,
    weights: completion.weights,
  };
}

export const FunctionOutputSchema = z
  .union([
    z.number().describe("The scalar output of the function execution."),
    z
      .array(z.number())
      .describe("The vector output of the function execution."),
    JsonValueSchema.describe("The erroneous output of the function execution."),
  ])
  .describe("The output of a function execution / function execution task.");
export type FunctionOutput = z.infer<typeof FunctionOutputSchema>;

export const MapFunctionOutputSchema = z
  .array(FunctionOutputSchema)
  .describe("The output of a mapped function execution task.");
export type MapFunctionOutput = z.infer<typeof MapFunctionOutputSchema>;

// export const CompiledFunctionOutputSchema = z
//   .object({
//     output: FunctionOutputSchema,
//     valid: z.boolean().describe("Whether the function output is valid."),
//   })
//   .describe("The output of a function execution, including its validity.");
// export type CompiledFunctionOutput = z.infer<
//   typeof CompiledFunctionOutputSchema
// >;

export const TaskOutputSchema = z
  .union([
    VectorCompletionOutputSchema,
    MapVectorCompletionOutputSchema,
    FunctionOutputSchema,
    MapFunctionOutputSchema,
    z.null().describe("The output of a skipped task."),
  ])
  .describe("The output of a task.");
export type TaskOutput = z.infer<typeof TaskOutputSchema>;

export const TaskOutputsSchema = z
  .array(TaskOutputSchema)
  .describe("The outputs of all tasks in a function.");
export type TaskOutputs = z.infer<typeof TaskOutputsSchema>;
