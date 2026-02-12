import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { textResult, resultFromResult } from "./util";
import { spawnFunctionAgents, getGitHubOwner, repoExists } from "../spawnFunctionAgents";
import { SpawnFunctionAgentsParamsSchema } from "../../spawnFunctionAgentsParams";

export function makeSpawnFunctionAgents(state: ToolState) {
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
    "SpawnFunctionAgents",
    "Spawn child function agents in parallel",
    { params: SpawnFunctionAgentsParamsSchema },
    async ({ params }) => {
      if (state.pendingAgentResults) {
        return resultFromResult({
          ok: false,
          value: undefined,
          error: "Agents are already running. Call WaitFunctionAgents to wait for results.",
        });
      }

      if (state.spawnFunctionAgentsHasSpawned) {
        // Only allow respawning agents whose repos don't exist on GitHub (i.e. they failed)
        const owner = getGitHubOwner(state.ghToken);
        const alreadyOnGitHub: string[] = [];

        if (owner) {
          for (const param of params) {
            if (repoExists(owner, param.name, state.ghToken)) {
              alreadyOnGitHub.push(param.name);
            }
          }
        }

        if (alreadyOnGitHub.length > 0) {
          return resultFromResult({
            ok: false,
            value: undefined,
            error:
              `Cannot respawn agents that already succeeded: ${alreadyOnGitHub.join(", ")}. ` +
              "Only include agents that failed (no repository on GitHub).",
          });
        }
      }

      state.spawnFunctionAgentsHasSpawned = true;
      state.pendingAgentResults = spawnFunctionAgents(params, opts()).then((r) =>
        resultFromResult(r),
      );

      return textResult(
        "Agents spawned. Call WaitFunctionAgents to wait for results.",
      );
    },
  );
}
