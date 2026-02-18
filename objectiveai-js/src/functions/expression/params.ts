import { JsonValueSchema } from "src/json";
import { ScoresSchema } from "src/vector/completions/response/scores";
import { VectorCompletionChunk } from "src/vector/completions/response/streaming";
import { VectorCompletion } from "src/vector/completions/response/unary";
import { VotesSchema } from "src/vector/completions/response/vote";
import { WeightsSchema } from "src/vector/completions/response/weights";
import z from "zod";
import { InputValueSchema } from "./input";
import { convert, type JSONSchema } from "../../json_schema";

export const InputMapsAsParameterSchema = z
  .array(InputValueSchema)
  .describe(
    "The `map` variable in mapped task expressions. " +
      "For a task with `map: i`, the task is compiled once per element in `input_maps[i]`. " +
      "Each compiled instance receives the current element as `map`.",
  )
  .meta({ title: "InputMapsAsParameter" });
export type InputMapsAsParameter = z.infer<typeof InputMapsAsParameterSchema>;
export const InputMapsAsParameterJsonSchema: JSONSchema = convert(
  InputMapsAsParameterSchema,
);

export const VectorCompletionOutputSchema = z
  .object({
    votes: VotesSchema,
    scores: ScoresSchema,
    weights: WeightsSchema,
  })
  .describe("The output of a vector completion task.")
  .meta({ title: "VectorCompletionOutput" });
export type VectorCompletionOutput = z.infer<
  typeof VectorCompletionOutputSchema
>;
export const VectorCompletionOutputJsonSchema: JSONSchema = convert(
  VectorCompletionOutputSchema,
);

export const MapVectorCompletionOutputSchema = z
  .array(VectorCompletionOutputSchema)
  .describe("The output of a mapped vector completion task.")
  .meta({ title: "MapVectorCompletionOutput" });
export type MapVectorCompletionOutput = z.infer<
  typeof MapVectorCompletionOutputSchema
>;
export const MapVectorCompletionOutputJsonSchema: JSONSchema = convert(
  MapVectorCompletionOutputSchema,
);

export function compileVectorCompletionOutput(
  completion: VectorCompletion | VectorCompletionChunk,
): VectorCompletionOutput {
  return {
    votes: completion.votes,
    scores: completion.scores,
    weights: completion.weights,
  };
}

export const ErrorFunctionOutputSchema = JsonValueSchema.describe(
  "The erroneous output of a function execution, containing the invalid output which failed validation.",
).meta({ title: "JsonValue", wrapper: true });
export type ErrorFunctionOutput = z.infer<typeof ErrorFunctionOutputSchema>;
export const ErrorFunctionOutputJsonSchema: JSONSchema = convert(
  ErrorFunctionOutputSchema,
);

export const ValidScalarFunctionOutputSchema = z
  .number()
  .describe(
    "A valid output of a scalar function execution / function execution task. A number between 0 and 1.",
  )
  .meta({ title: "ValidScalarFunctionOutput" });
export type ValidScalarFunctionOutput = z.infer<
  typeof ValidScalarFunctionOutputSchema
>;
export const ValidScalarFunctionOutputJsonSchema: JSONSchema = convert(
  ValidScalarFunctionOutputSchema,
);

export const ScalarFunctionOutputSchema = z
  .union([ValidScalarFunctionOutputSchema, ErrorFunctionOutputSchema])
  .describe(
    "The output of a scalar function execution / function execution task.",
  )
  .meta({ title: "ScalarFunctionOutput" });
export type ScalarFunctionOutput = z.infer<typeof ScalarFunctionOutputSchema>;
export const ScalarFunctionOutputJsonSchema: JSONSchema = convert(
  ScalarFunctionOutputSchema,
);

export const MapScalarFunctionOutputSchema = z
  .array(ScalarFunctionOutputSchema)
  .describe(
    "The output of a mapped scalar function execution task. An array of scalar function outputs.",
  )
  .meta({ title: "MapScalarFunctionOutput" });
export type MapScalarFunctionOutput = z.infer<
  typeof MapScalarFunctionOutputSchema
>;
export const MapScalarFunctionOutputJsonSchema: JSONSchema = convert(
  MapScalarFunctionOutputSchema,
);

export const ValidVectorFunctionOutputSchema = z
  .array(z.number())
  .describe(
    "A valid output of a vector function execution / function execution task. A vector of numbers, summing to 1.",
  )
  .meta({ title: "ValidVectorFunctionOutput" });
export type ValidVectorFunctionOutput = z.infer<
  typeof ValidVectorFunctionOutputSchema
>;
export const ValidVectorFunctionOutputJsonSchema: JSONSchema = convert(
  ValidVectorFunctionOutputSchema,
);

export const VectorFunctionOutputSchema = z
  .union([ValidVectorFunctionOutputSchema, ErrorFunctionOutputSchema])
  .describe(
    "The output of a vector function execution / function execution task.",
  )
  .meta({ title: "VectorFunctionOutput" });
export type VectorFunctionOutput = z.infer<typeof VectorFunctionOutputSchema>;
export const VectorFunctionOutputJsonSchema: JSONSchema = convert(
  VectorFunctionOutputSchema,
);

export const MapVectorFunctionOutputSchema = z
  .array(VectorFunctionOutputSchema)
  .describe(
    "The output of a mapped vector function execution task. An array of vector function outputs.",
  )
  .meta({ title: "MapVectorFunctionOutput" });
export type MapVectorFunctionOutput = z.infer<
  typeof MapVectorFunctionOutputSchema
>;
export const MapVectorFunctionOutputJsonSchema: JSONSchema = convert(
  MapVectorFunctionOutputSchema,
);

export const ValidFunctionOutputSchema = z
  .union([ValidScalarFunctionOutputSchema, ValidVectorFunctionOutputSchema])
  .describe(
    "The valid output of a function execution / function execution task.",
  )
  .meta({ title: "ValidFunctionOutput" });
export type ValidFunctionOutput = z.infer<typeof ValidFunctionOutputSchema>;
export const ValidFunctionOutputJsonSchema: JSONSchema = convert(
  ValidFunctionOutputSchema,
);

export const FunctionOutputSchema = z
  .union([ValidFunctionOutputSchema, ErrorFunctionOutputSchema])
  .describe("The output of a function execution / function execution task.");
export type FunctionOutput = z.infer<typeof FunctionOutputSchema>;
export const FunctionOutputJsonSchema: JSONSchema =
  convert(FunctionOutputSchema);

export const MapFunctionOutputSchema = z
  .array(FunctionOutputSchema)
  .describe(
    "The output of a mapped function execution task. An array of function outputs.",
  )
  .meta({ title: "MapFunctionOutput" });
export type MapFunctionOutput = z.infer<typeof MapFunctionOutputSchema>;
export const MapFunctionOutputJsonSchema: JSONSchema = convert(
  MapFunctionOutputSchema,
);

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
  .describe("The output of a task.")
  .meta({ title: "TaskOutput" });
export type TaskOutput = z.infer<typeof TaskOutputSchema>;
export const TaskOutputJsonSchema: JSONSchema = convert(TaskOutputSchema);

export const TaskOutputsSchema = z
  .array(TaskOutputSchema)
  .describe("The outputs of all tasks in a function.");
export type TaskOutputs = z.infer<typeof TaskOutputsSchema>;
export const TaskOutputsJsonSchema: JSONSchema = convert(TaskOutputsSchema);
