import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { readName, writeName } from "../name";

export const ReadName = tool("ReadName", "Read name.txt", {}, async () =>
  resultFromResult(readName()),
);

export const WriteName = tool(
  "WriteName",
  "Write name.txt",
  { content: z.string() },
  async ({ content }) => resultFromResult(writeName(content)),
);
