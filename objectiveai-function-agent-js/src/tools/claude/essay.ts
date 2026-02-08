import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readEssay, writeEssay } from "../markdown";

export const ReadEssay = tool("ReadEssay", "Read ESSAY.md", {}, async () =>
  resultFromResult(readEssay()),
);

export const WriteEssay = tool(
  "WriteEssay",
  "Write ESSAY.md",
  { content: z.string() },
  async ({ content }) => resultFromResult(writeEssay(content)),
);
