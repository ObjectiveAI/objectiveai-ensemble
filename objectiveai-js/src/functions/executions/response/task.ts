import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const TaskIndexSchema = z
  .uint32()
  .describe("The index of the task in the sequence of tasks.");
export type TaskIndex = z.infer<typeof TaskIndexSchema>;
export const TaskIndexJsonSchema: JSONSchema = convert(TaskIndexSchema);

export const TaskTaskIndexSchema = z
  .uint32()
  .describe(
    "The index of the task amongst all mapped and non-skipped compiled tasks. Used internally."
  );
export type TaskTaskIndex = z.infer<typeof TaskTaskIndexSchema>;
export const TaskTaskIndexJsonSchema: JSONSchema = convert(TaskTaskIndexSchema);

export const TaskTaskPathSchema = z
  .array(z.uint32())
  .describe(
    "The path of this task which may be used to navigate which nested task this is amongst the root functions tasks and sub-tasks."
  );
export type TaskTaskPath = z.infer<typeof TaskTaskPathSchema>;
export const TaskTaskPathJsonSchema: JSONSchema = convert(TaskTaskPathSchema);

export const TaskSwissRoundSchema = z
  .number()
  .int()
  .positive()
  .describe("The Swiss system round number (1-indexed).");
export type TaskSwissRound = z.infer<typeof TaskSwissRoundSchema>;
export const TaskSwissRoundJsonSchema: JSONSchema = convert(TaskSwissRoundSchema);

export const TaskSwissPoolIndexSchema = z
  .number()
  .int()
  .nonnegative()
  .describe("The index of this task within its Swiss system pool.");
export type TaskSwissPoolIndex = z.infer<typeof TaskSwissPoolIndexSchema>;
export const TaskSwissPoolIndexJsonSchema: JSONSchema = convert(TaskSwissPoolIndexSchema);
