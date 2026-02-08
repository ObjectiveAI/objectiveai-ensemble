import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { ReadEssay, WriteEssay } from "../../tools/claude/essay";
import { ReadSpec } from "../../tools/claude/spec";
import { ReadName } from "../../tools/claude/name";
import {
  ListExampleFunctions,
  ReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ReadFunctionSchema } from "../../tools/claude/function";

function essayIsNonEmpty(): boolean {
  return (
    existsSync("ESSAY.md") &&
    readFileSync("ESSAY.md", "utf-8").trim().length > 0
  );
}

export async function essayMcp(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  if (essayIsNonEmpty()) return sessionId;

  const tools = [
    ReadSpec,
    ReadName,
    ReadEssay,
    WriteEssay,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,
  ];
  const mcpServer = createSdkMcpServer({ name: "essay", tools });

  const prompt =
    "Read SPEC.md, name.txt, and example functions to understand the context, then create ESSAY.md describing the ObjectiveAI Function you are building." +
    " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
    " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
    " This essay will guide the development of the function and underpins its philosophy.";

  const stream = query({
    prompt,
    options: {
      tools: [],
      mcpServers: { essay: mcpServer },
      allowedTools: ["mcp__essay__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId,
    },
  });

  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  let retry = 1;
  while (!essayIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    }
    const stream = query({
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
    });

    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    retry += 1;
  }

  return sessionId;
}
