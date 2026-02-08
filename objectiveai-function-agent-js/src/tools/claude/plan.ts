import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { getLatestPlanIndex, readPlan, writePlan } from "../markdown";

export function makeReadPlan(index: number) {
  return tool(
    "ReadPlan",
    "Read the plan",
    {},
    async () => resultFromResult(readPlan(index)),
  );
}

export function makeWritePlan(index: number) {
  return tool(
    "WritePlan",
    "Write the plan",
    { content: z.string() },
    async ({ content }) => resultFromResult(writePlan(index, content)),
  );
}

export const GetLatestPlanIndex = tool(
  "GetLatestPlanIndex",
  "Get the highest existing plan index",
  {},
  async () => resultFromResult(getLatestPlanIndex()),
);
