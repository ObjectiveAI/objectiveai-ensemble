import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readName, writeName } from "../name";
import { ToolState } from "./toolState";

export function makeReadName(state: ToolState) {
  return tool("ReadName", "Read name.txt", {}, async () =>
    resultFromResult(readName()),
  );
}

export function makeWriteName(state: ToolState) {
  return tool(
    "WriteName",
    "Write name.txt",
    { content: z.string() },
    async ({ content }) => resultFromResult(writeName(content, state.ghToken)),
  );
}
