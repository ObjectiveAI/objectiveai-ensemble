import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { writeName } from "../../tools/name";
import { ReadName, WriteName } from "../../tools/claude/name";
import { ReadSpec } from "../../tools/claude/spec";
import {
  ListExampleFunctions,
  ReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ReadFunctionSchema } from "../../tools/claude/function";

function nameIsNonEmpty(): boolean {
  return (
    existsSync("name.txt") &&
    readFileSync("name.txt", "utf-8").trim().length > 0
  );
}

export async function nameMcp(
  log: LogFn,
  sessionId?: string,
  name?: string,
): Promise<string | undefined> {
  if (name) {
    writeName(name);
    return sessionId;
  }
  if (nameIsNonEmpty()) return sessionId;

  const tools = [
    ReadSpec,
    ReadName,
    WriteName,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,
  ];
  const mcpServer = createSdkMcpServer({ name: "name", tools });

  const stream = query({
    prompt:
      "Read SPEC.md and example functions to understand the context, then create name.txt with the function name.\n" +
      '**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n' +
      "- Use all lowercase\n" +
      "- Use dashes (`-`) to separate words if there's more than one",
    options: {
      tools: [],
      mcpServers: { name: mcpServer },
      allowedTools: ["mcp__name__*"],
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
  while (!nameIsNonEmpty()) {
    if (retry > 10) {
      throw new Error("name.txt is empty after name phase");
    }
    const stream = query({
      prompt:
        "name.txt is empty after your name phase." +
        " Create name.txt with the function name.\n" +
        '**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n' +
        "- Use all lowercase\n" +
        "- Use dashes (`-`) to separate words if there's more than one",
      options: {
        tools: [],
        mcpServers: { name: mcpServer },
        allowedTools: ["mcp__name__*"],
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
