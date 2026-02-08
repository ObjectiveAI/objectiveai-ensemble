import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  appendTask,
  checkTasks,
  delTask,
  editTask,
  readTasks,
  readTasksSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadTasks = tool(
  "ReadTasks",
  "Read the Function's `tasks` field",
  {},
  async () => resultFromResult(readTasks()),
);

export const ReadTasksSchema = tool(
  "ReadTasksSchema",
  "Read the schema for Function `tasks` field",
  {},
  async () => textResult(formatZodSchema(readTasksSchema())),
);

export const AppendTask = tool(
  "AppendTask",
  "Append a task to the Function's `tasks` array",
  { value: z.record(z.string(), z.unknown()) },
  async ({ value }) => resultFromResult(appendTask(value)),
);

export const EditTask = tool(
  "EditTask",
  "Replace a task at a specific index in the Function's `tasks` array",
  {
    index: z.number().int().nonnegative(),
    value: z.record(z.string(), z.unknown()),
  },
  async ({ index, value }) => resultFromResult(editTask(index, value)),
);

export const DelTask = tool(
  "DelTask",
  "Delete a task at a specific index from the Function's `tasks` array",
  { index: z.int().nonnegative() },
  async ({ index }) => resultFromResult(delTask(index)),
);

export const CheckTasks = tool(
  "CheckTasks",
  "Validate the Function's `tasks` field",
  {},
  async () => resultFromResult(checkTasks()),
);
