import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { makeWriteEssay } from "../../tools/claude/essay";
import { makeReadSpec } from "../../tools/claude/spec";
import { makeReadName } from "../../tools/claude/name";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { makeReadFunctionSchema } from "../../tools/claude/function";
import { ToolState } from "../../tools/claude/toolState";

function essayIsNonEmpty(): boolean {
  return (
    existsSync("ESSAY.md") &&
    readFileSync("ESSAY.md", "utf-8").trim().length > 0
  );
}

export async function essayMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  if (essayIsNonEmpty()) return sessionId;

  const tools = [
    makeReadSpec(state),
    makeReadName(state),
    makeWriteEssay(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "essay", tools });

  const prompt =
    "Create ESSAY.md describing the ObjectiveAI Function you are building." +
    " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
    " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
    " This essay will guide the development of the function and underpins its philosophy.";

  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { essay: mcpServer },
        allowedTools: ["mcp__essay__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    }),
    log,
    sessionId,
  );

  let retry = 1;
  while (!essayIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    }
    sessionId = await consumeStream(
      query({
        prompt:
          "ESSAY.md is empty after your essay phase." +
          " Create ESSAY.md describing the ObjectiveAI Function you are building." +
          " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
          " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
          " This essay will guide the development of the function and underpins its philosophy.",
        options: {
          tools: [],
          mcpServers: { essay: mcpServer },
          allowedTools: ["mcp__essay__*"],
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
