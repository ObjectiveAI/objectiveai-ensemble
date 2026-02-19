import {
  FallbackModelsSchema,
  ModelSchema,
} from "src/chat/completions/request/model";
import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const ReasoningSchema = z
  .object({
    model: ModelSchema,
    models: FallbackModelsSchema.optional().nullable(),
  })
  .describe(
    "If provided, a reasoning summary for the Function Execution will be generated. This reasoning summary attempts to detail why the final Output is what it is, based on AI assertions made during execution.",
  )
  .meta({ title: "FunctionExecutionReasoning" });
export type Reasoning = z.infer<typeof ReasoningSchema>;
export const ReasoningJsonSchema: JSONSchema = convert(ReasoningSchema);
