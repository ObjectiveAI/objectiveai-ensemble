import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState } from "./toolState";
import {
  readDefaultNetworkTest,
  readSwissSystemNetworkTest,
  runNetworkTests,
} from "../test";
import { resultFromResult } from "./util";
import z from "zod";

export function makeRunNetworkTests(state: ToolState) {
  return tool(
    "RunNetworkTests",
    "Execute the function once for each example input and write results to network_tests/",
    {},
    async () => resultFromResult(await runNetworkTests(state.runNetworkTestsApiBase, state.runNetworkTestsApiKey)),
  );
}

export function makeReadDefaultNetworkTest(state: ToolState) {
  return tool(
    "ReadDefaultNetworkTest",
    "Read a default strategy network test result by index",
    { index: z.number().int().nonnegative() },
    async ({ index }) => resultFromResult(readDefaultNetworkTest(index)),
  );
}

export function makeReadSwissSystemNetworkTest(state: ToolState) {
  return tool(
    "ReadSwissSystemNetworkTest",
    "Read a swiss_system strategy network test result by index",
    { index: z.number().int().nonnegative() },
    async ({ index }) => resultFromResult(readSwissSystemNetworkTest(index)),
  );
}
