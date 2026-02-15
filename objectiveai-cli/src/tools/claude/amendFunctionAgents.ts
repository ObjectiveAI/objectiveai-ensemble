import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { textResult, errorResult } from "./util";
import { amendFunctionAgents } from "../amendFunctionAgents";
import { AmendFunctionAgentsParamsSchema } from "../../amendFunctionAgentsParams";
import { validateInputSchema } from "../function/inputSchema";

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
      // Validate overwriteInputSchema if provided
      for (const param of params) {
        if (param.overwriteInputSchema) {
          const schemaResult = validateInputSchema({ input_schema: param.overwriteInputSchema });
          if (!schemaResult.ok) {
            return errorResult(`Invalid overwriteInputSchema for "${param.name}": ${schemaResult.error}`);
          }
        }
      }

      state.pendingAgentResults.push(
        amendFunctionAgents(params, opts()).then((r) => {
          if (!r.ok) return errorResult(r.error!);
          const text = JSON.stringify(r.value, null, 2);
          const hasErrors = r.value!.some((s) => "error" in s);
          if (hasErrors) return errorResult(text);
          return textResult(text);
        }),
      );

      return textResult(
        "Agents spawned. Call WaitFunctionAgents to wait for results.",
      );
    },
  );
}
