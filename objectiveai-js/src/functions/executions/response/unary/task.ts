import z from "zod";
import { VectorCompletionTaskSchema } from "./vector_completion_task";
import { FunctionExecutionTaskSchema } from "./function_execution_task";

export const TaskSchema = z
  .union([FunctionExecutionTaskSchema, VectorCompletionTaskSchema])
  .describe("A task execution.");
export type Task = z.infer<typeof TaskSchema>;
