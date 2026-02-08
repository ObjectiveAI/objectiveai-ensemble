import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readSpec, writeSpec } from "../markdown";

export const ReadSpec = tool("ReadSpec", "Read SPEC.md", {}, async () =>
  resultFromResult(readSpec()),
);

export const WriteSpec = tool(
  "WriteSpec",
  "Write SPEC.md",
  { content: z.string() },
  async ({ content }) => resultFromResult(writeSpec(content)),
);
