import { ObjectiveAIErrorSchema } from "src/error";
import {
  TaskIndexSchema,
  TaskTaskIndexSchema,
  TaskTaskPathSchema,
} from "../task";
import {
  VectorCompletionChunk,
  VectorCompletionChunkSchema,
} from "src/vector/completions/response/streaming/vector_completion_chunk";
import z from "zod";
import { merge } from "src/merge";

export const VectorCompletionTaskChunkSchema =
  VectorCompletionChunkSchema.extend({
    index: TaskIndexSchema,
    task_index: TaskTaskIndexSchema,
    task_path: TaskTaskPathSchema,
    error: ObjectiveAIErrorSchema.optional().describe(
      "When present, indicates that an error occurred during the vector completion task."
    ),
  }).describe("A chunk of a vector completion task.");
export type VectorCompletionTaskChunk = z.infer<
  typeof VectorCompletionTaskChunkSchema
>;

export namespace VectorCompletionTaskChunk {
  export function merged(
    a: VectorCompletionTaskChunk,
    b: VectorCompletionTaskChunk
  ): [VectorCompletionTaskChunk, boolean] {
    const index = a.index;
    const task_index = a.task_index;
    const task_path = a.task_path;
    const [base, baseChanged] = VectorCompletionChunk.merged(a, b);
    const [error, errorChanged] = merge(a.error, b.error);
    if (baseChanged || errorChanged) {
      return [
        {
          index,
          task_index,
          task_path,
          ...base,
          ...(error !== undefined ? { error } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
