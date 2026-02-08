import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { listAgentFunctions, readAgentFunction } from "../agentFunctions";
import z from "zod";

export const ListAgentFunctions = tool(
  "ListAgentFunctions",
  "List all agent functions with their owner, repository, and commit",
  {},
  async () => resultFromResult(listAgentFunctions()),
);

export const ReadAgentFunction = tool(
  "ReadAgentFunction",
  "Read an agent function by name",
  { name: z.string() },
  async ({ name }) => resultFromResult(readAgentFunction(name)),
);
