import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { writeSpec } from "../../tools/markdown";
import { ReadSpec, WriteSpec } from "../../tools/claude/spec";
import {
  ListExampleFunctions,
  ReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ReadFunctionSchema } from "../../tools/claude/function";

function specIsNonEmpty(): boolean {
  return (
    existsSync("SPEC.md") && readFileSync("SPEC.md", "utf-8").trim().length > 0
  );
}

export async function specMcp(
  log: LogFn,
  sessionId?: string,
  spec?: string,
): Promise<string | undefined> {
  if (spec) {
    writeSpec(spec);
    return sessionId;
  }
  if (specIsNonEmpty()) return sessionId;

  const tools = [
    ReadSpec,
    WriteSpec,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,
  ];
  const mcpServer = createSdkMcpServer({ name: "spec", tools });

  const prompt =
    "Read example functions to understand what ObjectiveAI Functions look like, then create SPEC.md specifying the ObjectiveAI Function to be built." +
    " Think deeply about what function to invent:\n" +
    "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
    "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
    "Be creative and describe a function with plain language.";

  const stream = query({
    prompt,
    options: {
      tools: [],
      mcpServers: { spec: mcpServer },
      allowedTools: ["mcp__spec__*"],
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
  while (!specIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    }
    const stream = query({
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
