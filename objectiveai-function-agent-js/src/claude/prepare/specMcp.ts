import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { writeSpec } from "../../tools/markdown";
import { makeWriteSpec } from "../../tools/claude/spec";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { makeReadFunctionSchema } from "../../tools/claude/function";
import { ToolState } from "../../tools/claude/toolState";

function specIsNonEmpty(): boolean {
  return (
    existsSync("SPEC.md") && readFileSync("SPEC.md", "utf-8").trim().length > 0
  );
}

export async function specMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
  spec?: string,
): Promise<string | undefined> {
  if (specIsNonEmpty()) return sessionId;

  if (spec) {
    writeSpec(spec);
    return sessionId;
  }

  const tools = [
    makeWriteSpec(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "spec", tools });

  const prompt =
    "Read example functions to understand what ObjectiveAI Functions look like, then create SPEC.md specifying the ObjectiveAI Function to be built." +
    " Think deeply about what function to invent:\n" +
    "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
    "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
    "Be creative and describe a function with plain language.";

  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { spec: mcpServer },
        allowedTools: ["mcp__spec__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    }),
    log,
    sessionId,
  );

  let retry = 1;
  while (!specIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    }
    sessionId = await consumeStream(
      query({
        prompt:
          "SPEC.md is empty after your spec phase." +
          " Create SPEC.md specifying the ObjectiveAI Function to be built." +
          " Think deeply about what function to invent:\n" +
          "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
          "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
          "Be creative and describe a function with plain language.",
        options: {
          tools: [],
          mcpServers: { spec: mcpServer },
          allowedTools: ["mcp__spec__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      }),
      log,
      sessionId,
    );
    retry += 1;
  }

  return sessionId;
}
