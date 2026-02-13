import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { textResult, resultFromResult } from "./util";
import { amendFunctionAgents } from "../amendFunctionAgents";
import { AmendFunctionAgentsParamsSchema } from "../../amendFunctionAgentsParams";

export function makeAmendFunctionAgents(state: ToolState) {
  const opts = () => ({
    apiBase: state.submitApiBase,
    apiKey: state.submitApiKey,
    gitUserName: state.gitUserName,
    gitUserEmail: state.gitUserEmail,
    ghToken: state.ghToken,
    minWidth: state.minWidth,
    maxWidth: state.maxWidth,
    onChildEvent: state.onChildEvent,
    activeChildren: state.activeChildren,
  });

  return tool(
    "AmendFunctionAgents",
    "Amend existing child function agents in parallel",
    { params: AmendFunctionAgentsParamsSchema },
    async ({ params }) => {
      state.pendingAgentResults.push(
        amendFunctionAgents(params, opts()).then((r) => resultFromResult(r)),
      );

      return textResult(
        "Agents spawned. Call WaitFunctionAgents to wait for results.",
      );
    },
  );
}
