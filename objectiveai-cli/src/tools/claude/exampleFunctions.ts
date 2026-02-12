import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { listExampleFunctions, readExampleFunction } from "../exampleFunctions";
import z from "zod";
import { ToolState } from "./toolState";

export function makeListExampleFunctions(state: ToolState) {
  return tool(
    "ListExampleFunctions",
    "List root example functions",
    {},
    async () => {
      state.hasReadExampleFunctions = true;
      return resultFromResult(listExampleFunctions());
    },
  );
}

export function makeReadExampleFunction(state: ToolState) {
  return tool(
    "ReadExampleFunction",
    "Read an example function by owner, repository, and commit",
    {
      owner: z.string(),
      repository: z.string(),
      commit: z.string(),
    },
    async ({ owner, repository, commit }) => {
      state.hasReadExampleFunctions = true;
      return resultFromResult(readExampleFunction(owner, repository, commit));
    },
  );
}
