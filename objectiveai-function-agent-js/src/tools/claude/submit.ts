import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { submit } from "../submit";
import z from "zod";

export function makeSubmit(apiBase?: string) {
  return tool(
    "Submit",
    "Check function, check example inputs, run network tests, commit and push to GitHub (if all successful)",
    { message: z.string().describe("Commit message") },
    async ({ message }) => resultFromResult(await submit(message, apiBase)),
  );
}
