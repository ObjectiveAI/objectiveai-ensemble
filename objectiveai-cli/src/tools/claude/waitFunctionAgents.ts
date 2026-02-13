import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { textResult, errorResult } from "./util";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function mergeResults(results: CallToolResult[]): CallToolResult {
  const content = results.flatMap((r) => r.content);
  const isError = results.some((r) => r.isError);
  return { content, ...(isError && { isError }) };
}

export function makeWaitFunctionAgents(state: ToolState) {
  return tool(
    "WaitFunctionAgents",
    "Wait for running function agents to finish",
    {},
    async () => {
      if (state.pendingAgentResults.length === 0) {
        return errorResult("No agents are currently running.");
      }

      const outcome = await Promise.race([
        Promise.all(state.pendingAgentResults).then((r) => ({
          type: "done" as const,
          results: r,
        })),
        state.messageQueue
          .waitForMessage()
          .then(() => ({ type: "message" as const })),
      ]);

      if (outcome.type === "done") {
        state.pendingAgentResults = [];
        return mergeResults(outcome.results);
      }

      // Woke up from user message — agents still running
      const messages = state.messageQueue.drain();
      return textResult(
        "Function agents are still running. Call WaitFunctionAgents again to continue waiting.\n\n" +
          messages.map((m) => "[USER MESSAGE]: " + m).join("\n"),
      );
    },
  );
}
