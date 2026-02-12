import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { textResult, errorResult } from "./util";

export function makeWaitFunctionAgents(state: ToolState) {
  return tool(
    "WaitFunctionAgents",
    "Wait for running function agents to finish",
    {},
    async () => {
      if (!state.pendingAgentResults) {
        return errorResult("No agents are currently running.");
      }

      const outcome = await Promise.race([
        state.pendingAgentResults.then((r) => ({ type: "done" as const, result: r })),
        state.messageQueue.waitForMessage().then(() => ({ type: "message" as const })),
      ]);

      if (outcome.type === "done") {
        state.pendingAgentResults = null;
        return outcome.result;
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
