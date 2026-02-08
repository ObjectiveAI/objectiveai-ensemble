import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult } from "./util";
import { listExampleFunctions, readExampleFunction } from "../exampleFunctions";
import z from "zod";

export const ListExampleFunctions = tool(
  "ListExampleFunctions",
  "List root example functions",
  {},
  async () => resultFromResult(listExampleFunctions()),
);

export const ReadExampleFunction = tool(
  "ReadExampleFunction",
  "Read an example function by owner, repository, and commit",
  {
    owner: z.string(),
    repository: z.string(),
    commit: z.string(),
  },
  async ({ owner, repository, commit }) =>
    resultFromResult(readExampleFunction(owner, repository, commit)),
);
