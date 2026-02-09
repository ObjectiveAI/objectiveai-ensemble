import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { spawnFunctionAgents } from "../spawnFunctionAgents";
import { SpawnFunctionAgentsParamsSchema } from "../../spawnFunctionAgentsParams";
import z from "zod";

export function makeSpawnFunctionAgents(apiBase?: string, apiKey?: string) {
  let hasSpawned = false;
  let respawnRejected = false;

  return tool(
    "SpawnFunctionAgents",
    "Spawn child function agents in parallel",
    {
      params: SpawnFunctionAgentsParamsSchema,
      dangerouslyRespawn: z.boolean().optional(),
    },
    async ({ params, dangerouslyRespawn }) => {
      if (hasSpawned) {
        if (dangerouslyRespawn) {
          if (!respawnRejected) {
            return resultFromResult({
              ok: false,
              value: undefined,
              error:
                "dangerouslyRespawn can only be used after a previous SpawnFunctionAgents call was rejected for respawning.",
            });
          }
          respawnRejected = false;
          return resultFromResult(await spawnFunctionAgents(params, apiBase, apiKey));
        }

        respawnRejected = true;
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

      hasSpawned = true;
      return resultFromResult(await spawnFunctionAgents(params, apiBase, apiKey));
    },
  );
}
