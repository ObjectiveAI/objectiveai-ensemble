import z from "zod";
import {
  FunctionExecutionChunk,
  FunctionExecutionChunkSchema,
} from "./function_execution_chunk";
import {
  TaskIndexSchema,
  TaskTaskIndexSchema,
  TaskTaskPathSchema,
} from "../task";
import { TaskChunkSchema } from "./task_chunk";

export interface FunctionExecutionTaskChunk extends FunctionExecutionChunk {
  index: number;
  task_index: number;
  task_path: number[];
}
export const FunctionExecutionTaskChunkSchema: z.ZodType<FunctionExecutionTaskChunk> =
  z
    .lazy(() =>
      FunctionExecutionChunkSchema.extend({
        index: TaskIndexSchema,
        task_index: TaskTaskIndexSchema,
        task_path: TaskTaskPathSchema,
        tasks: z
          .array(TaskChunkSchema)
          .meta({
            title: "TaskChunkArray",
            recursive: true,
          })
          .describe("The tasks executed as part of the function execution."),
      })
    )
    .describe("A chunk of a function execution task.");

export namespace FunctionExecutionTaskChunk {
  export function merged(
    a: FunctionExecutionTaskChunk,
    b: FunctionExecutionTaskChunk
  ): [FunctionExecutionTaskChunk, boolean] {
    const index = a.index;
    const task_index = a.task_index;
    const task_path = a.task_path;
    const [base, baseChanged] = FunctionExecutionChunk.merged(a, b);
    if (baseChanged) {
      return [
        {
          index,
          task_index,
          task_path,
          ...base,
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
