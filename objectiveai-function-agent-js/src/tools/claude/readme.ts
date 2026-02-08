import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readReadme, writeReadme } from "../markdown";

export const ReadReadme = tool(
  "ReadReadme",
  "Read README.md",
  {},
  async () => resultFromResult(readReadme()),
);

export const WriteReadme = tool(
  "WriteReadme",
  "Write README.md",
  { content: z.string() },
  async ({ content }) => resultFromResult(writeReadme(content)),
);
