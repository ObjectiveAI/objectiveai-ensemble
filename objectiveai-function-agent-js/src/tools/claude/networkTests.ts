import { tool } from "@anthropic-ai/claude-agent-sdk";
import {
  readDefaultNetworkTest,
  readSwissSystemNetworkTest,
  runNetworkTests,
} from "../test";
import { resultFromResult } from "./util";
import z from "zod";

export function makeRunNetworkTests(apiBase?: string) {
  return tool(
    "RunNetworkTests",
    "Execute the function once for each example input and write results to networkTests/",
    {},
    async () => resultFromResult(await runNetworkTests(apiBase)),
  );
}

export const ReadDefaultNetworkTest = tool(
  "ReadDefaultNetworkTest",
  "Read a default strategy network test result by index",
  { index: z.number().int().nonnegative() },
  async ({ index }) => resultFromResult(readDefaultNetworkTest(index)),
);

export const ReadSwissSystemNetworkTest = tool(
  "ReadSwissSystemNetworkTest",
  "Read a swiss_system strategy network test result by index",
  { index: z.number().int().nonnegative() },
  async ({ index }) => resultFromResult(readSwissSystemNetworkTest(index)),
);
