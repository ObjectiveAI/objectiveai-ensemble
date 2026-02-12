import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import { resultFromResult } from "./util";
import { spawnFunctionAgents } from "../spawnFunctionAgents";
import { SpawnFunctionAgentsParamsSchema } from "../../spawnFunctionAgentsParams";
import z from "zod";

export function makeSpawnFunctionAgents(state: ToolState) {
  return tool(
    "SpawnFunctionAgents",
    "Spawn child function agents in parallel",
    {
      params: SpawnFunctionAgentsParamsSchema,
      dangerouslyRespawn: z.boolean().optional(),
    },
    async ({ params, dangerouslyRespawn }) => {
      if (state.spawnFunctionAgentsHasSpawned) {
        if (dangerouslyRespawn) {
          if (!state.spawnFunctionAgentsRespawnRejected) {
            return resultFromResult({
              ok: false,
              value: undefined,
              error:
                "dangerouslyRespawn can only be used after a previous SpawnFunctionAgents call was rejected for respawning.",
            });
          }
          state.spawnFunctionAgentsRespawnRejected = false;
          return resultFromResult(await spawnFunctionAgents(params, {
            apiBase: state.submitApiBase,
            apiKey: state.submitApiKey,
            gitUserName: state.gitUserName,
            gitUserEmail: state.gitUserEmail,
            ghToken: state.ghToken,
            minWidth: state.minWidth,
            maxWidth: state.maxWidth,
          }));
        }

        state.spawnFunctionAgentsRespawnRejected = true;
        return resultFromResult({
          ok: false,
          value: undefined,
          error:
            "SpawnFunctionAgents has already been called. Before respawning, you must: " +
            "(1) use ListAgentFunctions and read each agent function's function.json, " +
            "(2) try every possible fix (editing tasks, input schemas, expressions, example inputs) to make the existing agent outputs work, " +
            "(3) only respawn as an absolute last resort after exhausting all alternatives. " +
            "If you have truly tried everything, call SpawnFunctionAgents again with `dangerouslyRespawn: true`.",
        });
      }

      state.spawnFunctionAgentsHasSpawned = true;
      return resultFromResult(await spawnFunctionAgents(params, {
            apiBase: state.submitApiBase,
            apiKey: state.submitApiKey,
            gitUserName: state.gitUserName,
            gitUserEmail: state.gitUserEmail,
            ghToken: state.ghToken,
            minWidth: state.minWidth,
            maxWidth: state.maxWidth,
          }));
    },
  );
}
