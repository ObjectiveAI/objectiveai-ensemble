import { VectorCompletionSchema } from "src/vector/completions/response/unary/vector_completion";
import {
  TaskIndexSchema,
  TaskTaskIndexSchema,
  TaskTaskPathSchema,
} from "../task";
import { ObjectiveAIErrorSchema } from "src/error";
import z from "zod";

export const VectorCompletionTaskSchema = VectorCompletionSchema.extend({
  index: TaskIndexSchema,
  task_index: TaskTaskIndexSchema,
  task_path: TaskTaskPathSchema,
  error: ObjectiveAIErrorSchema.nullable().describe(
    "When non-null, indicates that an error occurred during the vector completion task."
  ),
}).describe("A vector completion task.");
export type VectorCompletionTask = z.infer<typeof VectorCompletionTaskSchema>;
