import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { textResult, resultFromResult, errorResult } from "./util";
import { spawnFunctionAgents, getGitHubOwner, repoExists } from "../spawnFunctionAgents";
import { SpawnFunctionAgentsParamsSchema } from "../../spawnFunctionAgentsParams";
import { validateInputSchema, isValidVectorInputSchema } from "../function/inputSchema";

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
      // Validate each param's inputSchema
      for (const param of params) {
        const schemaResult = validateInputSchema({ input_schema: param.inputSchema });
        if (!schemaResult.ok) {
          return errorResult(`Invalid inputSchema for "${param.name}": ${schemaResult.error}`);
        }
        if (param.type === "vector.function" && !isValidVectorInputSchema(schemaResult.value)) {
          return errorResult(
            `Invalid inputSchema for "${param.name}": vector functions require an input schema that is an array or an object with at least one array property.`,
          );
        }
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
      state.pendingAgentResults.push(
        spawnFunctionAgents(params, opts()).then((r) => resultFromResult(r)),
      );

      return textResult(
        "Agents spawned. Call WaitFunctionAgents to wait for results.",
      );
    },
  );
}
