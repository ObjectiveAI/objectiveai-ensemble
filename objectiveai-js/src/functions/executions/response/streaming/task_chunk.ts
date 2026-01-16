import z from "zod";
import {
  FunctionExecutionTaskChunk,
  FunctionExecutionTaskChunkSchema,
} from "./function_execution_task_chunk";
import {
  VectorCompletionTaskChunk,
  VectorCompletionTaskChunkSchema,
} from "./vector_completion_task_chunk";

export const TaskChunkSchema = z
  .union([FunctionExecutionTaskChunkSchema, VectorCompletionTaskChunkSchema])
  .describe("A chunk of a task execution.");
export type TaskChunk = z.infer<typeof TaskChunkSchema>;

export namespace TaskChunk {
  export function merged(a: TaskChunk, b: TaskChunk): [TaskChunk, boolean] {
    if ("scores" in a) {
      return VectorCompletionTaskChunk.merged(
        a,
        b as VectorCompletionTaskChunk
      );
    } else {
      return FunctionExecutionTaskChunk.merged(
        a,
        b as FunctionExecutionTaskChunk
      );
    }
  }

  export function mergedList(
    a: TaskChunk[],
    b: TaskChunk[]
  ): [TaskChunk[], boolean] {
    let merged: TaskChunk[] | undefined = undefined;
    for (const chunk of b) {
      const existingIndex = a.findIndex(({ index }) => index === chunk.index);
      if (existingIndex === -1) {
        if (merged === undefined) {
          merged = [...a, chunk];
        } else {
          merged.push(chunk);
        }
      } else {
        const [mergedChunk, chunkChanged] = TaskChunk.merged(
          a[existingIndex],
          chunk
        );
        if (chunkChanged) {
          if (merged === undefined) {
            merged = [...a];
          }
          merged[existingIndex] = mergedChunk;
        }
      }
    }
    return merged ? [merged, true] : [a, false];
  }
}
