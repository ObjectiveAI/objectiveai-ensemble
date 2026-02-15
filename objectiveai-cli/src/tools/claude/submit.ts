import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { resultFromResult } from "./util";
import { submit } from "../submit";
import z from "zod";

export function makeSubmit(state: ToolState) {
  return tool(
    "Submit",
    "Check function, check example inputs, run network tests, commit and push to GitHub (if all successful)",
    { message: z.string().describe("Commit message") },
    async ({ message }) => resultFromResult(await submit(message, state.submitApiBase, state.submitApiKey, {
      userName: state.gitUserName,
      userEmail: state.gitUserEmail,
      ghToken: state.ghToken,
    })),
  );
}
