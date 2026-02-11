import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { writeName } from "../../tools/name";
import { makeReadName, makeWriteName } from "../../tools/claude/name";
import { makeReadSpec } from "../../tools/claude/spec";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { makeReadFunctionSchema } from "../../tools/claude/function";
import { ToolState } from "../../tools/claude/toolState";

function nameIsNonEmpty(): boolean {
  return (
    existsSync("name.txt") &&
    readFileSync("name.txt", "utf-8").trim().length > 0
  );
}

export async function nameMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
  name?: string,
): Promise<string | undefined> {
  if (nameIsNonEmpty()) return sessionId;

  if (name) {
    writeName(name, state.ghToken);
    return sessionId;
  }

  const tools = [
    makeReadSpec(state),
    makeReadName(state),
    makeWriteName(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "name", tools });

  sessionId = await consumeStream(
    query({
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
    }),
    log,
    sessionId,
  );

  let retry = 1;
  while (!nameIsNonEmpty()) {
    if (retry > 10) {
      throw new Error("name.txt is empty after name phase");
    }
    sessionId = await consumeStream(
      query({
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
      }),
      log,
      sessionId,
    );
    retry += 1;
  }

  return sessionId;
}
