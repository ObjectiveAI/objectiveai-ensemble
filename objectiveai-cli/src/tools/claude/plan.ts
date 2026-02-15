import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import z from "zod";
import { getLatestPlanIndex, readPlan, writePlan } from "../markdown";
import { ToolState } from "./toolState";

export function makeReadPlan(state: ToolState) {
  return tool(
    "ReadPlan",
    "Read the plan",
    {},
    async () => {
      state.hasReadOrWrittenPlan = true;
      return resultFromResult(readPlan(state.readPlanIndex));
    },
  );
}

export function makeWritePlan(state: ToolState) {
  return tool(
    "WritePlan",
    "Write the plan",
    { content: z.string() },
    async ({ content }) => {
      state.hasReadOrWrittenPlan = true;
      return resultFromResult(writePlan(state.writePlanIndex, content));
    },
  );
}

export function makeGetLatestPlanIndex(state: ToolState) {
  return tool(
    "GetLatestPlanIndex",
    "Get the highest existing plan index",
    {},
    async () => resultFromResult(getLatestPlanIndex()),
  );
}
