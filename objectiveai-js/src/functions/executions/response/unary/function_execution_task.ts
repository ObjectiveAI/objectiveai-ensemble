import z from "zod";
import {
  TaskIndexSchema,
  TaskTaskIndexSchema,
  TaskTaskPathSchema,
} from "../task";
import { TaskSchema } from "./task";
import {
  FunctionExecution,
  FunctionExecutionSchema,
} from "./function_execution";

export interface FunctionExecutionTask extends FunctionExecution {
  index: number;
  task_index: number;
  task_path: number[];
}
export const FunctionExecutionTaskSchema: z.ZodType<FunctionExecutionTask> = z
  .lazy(() =>
    FunctionExecutionSchema.extend({
      index: TaskIndexSchema,
      task_index: TaskTaskIndexSchema,
      task_path: TaskTaskPathSchema,
      tasks: z
        .array(TaskSchema)
        .meta({
          title: "TaskArray",
          recursive: true,
        })
        .describe("The tasks executed as part of the function execution."),
    })
  )
  .describe("A function execution task.");
