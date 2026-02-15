import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { listAgentFunctions, readAgentFunction } from "../agentFunctions";
import z from "zod";
import { ToolState } from "./toolState";

export function makeListAgentFunctions(state: ToolState) {
  return tool(
    "ListAgentFunctions",
    "List all agent functions with their owner, repository, and commit",
    {},
    async () => resultFromResult(listAgentFunctions()),
  );
}

export function makeReadAgentFunction(state: ToolState) {
  return tool(
    "ReadAgentFunction",
    "Read an agent function by name",
    { name: z.string() },
    async ({ name }) => resultFromResult(readAgentFunction(name)),
  );
}
