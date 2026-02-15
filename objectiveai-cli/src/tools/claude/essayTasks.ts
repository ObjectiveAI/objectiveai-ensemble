import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readEssayTasks, writeEssayTasks } from "../markdown";
import { ToolState } from "./toolState";

export function makeReadEssayTasks(state: ToolState) {
  return tool(
    "ReadEssayTasks",
    "Read ESSAY_TASKS.md",
    {},
    async () => {
      state.hasReadOrWrittenEssayTasks = true;
      return resultFromResult(readEssayTasks());
    },
  );
}

export function makeWriteEssayTasks(state: ToolState) {
  return tool(
    "WriteEssayTasks",
    "Write ESSAY_TASKS.md",
    { content: z.string() },
    async ({ content }) => {
      state.hasReadOrWrittenEssayTasks = true;
      return resultFromResult(writeEssayTasks(content));
    },
  );
}
