import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readEssayTasks, writeEssayTasks } from "../markdown";

export const ReadEssayTasks = tool(
  "ReadEssayTasks",
  "Read ESSAY_TASKS.md",
  {},
  async () => resultFromResult(readEssayTasks()),
);

export const WriteEssayTasks = tool(
  "WriteEssayTasks",
  "Write ESSAY_TASKS.md",
  { content: z.string() },
  async ({ content }) => resultFromResult(writeEssayTasks(content)),
);
