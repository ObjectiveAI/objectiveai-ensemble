import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readSpec, writeSpec } from "../markdown";
import { ToolState } from "./toolState";

export function makeReadSpec(state: ToolState) {
  return tool("ReadSpec", "Read SPEC.md", {}, async () => {
    state.hasReadOrWrittenSpec = true;
    return resultFromResult(readSpec());
  });
}

export function makeWriteSpec(state: ToolState) {
  return tool(
    "WriteSpec",
    "Write SPEC.md",
    { content: z.string() },
    async ({ content }) => {
      state.hasReadOrWrittenSpec = true;
      return resultFromResult(writeSpec(content));
    },
  );
}
