import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { resultFromResult } from "./util";
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
  });

  return tool(
    "AmendFunctionAgents",
    "Amend existing child function agents in parallel. Each agent's spec is appended as an amendment to its SPEC.md.",
    { params: AmendFunctionAgentsParamsSchema },
    async ({ params }) => {
      return resultFromResult(await amendFunctionAgents(params, opts()));
    },
  );
}
