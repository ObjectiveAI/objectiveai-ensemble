import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, errorResult } from "./util";
import z from "zod";
import { readReadme, writeReadme } from "../markdown";
import { ToolState, mustRead } from "./toolState";

export function makeReadReadme(state: ToolState) {
  return tool(
    "ReadReadme",
    "Read README.md",
    {},
    async () => {
      state.hasReadReadme = true;
      return resultFromResult(readReadme());
    },
  );
}

export function makeWriteReadme(state: ToolState) {
  return tool(
    "WriteReadme",
    "Write README.md",
    { content: z.string() },
    async ({ content }) => {
      const err = mustRead(state.hasReadReadme, "README.md");
      if (err) return errorResult(err);
      return resultFromResult(writeReadme(content));
    },
  );
}
