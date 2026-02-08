import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { spawnFunctionAgents } from "../spawnFunctionAgents";
import { SpawnFunctionAgentsParamsSchema } from "../../spawnFunctionAgentsParams";

export const SpawnFunctionAgents = tool(
  "SpawnFunctionAgents",
  "Spawn child function agents in parallel",
  { params: SpawnFunctionAgentsParamsSchema },
  async ({ params }) => resultFromResult(await spawnFunctionAgents(params)),
);
