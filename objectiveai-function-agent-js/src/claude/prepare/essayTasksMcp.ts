import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { ReadEssayTasks, WriteEssayTasks } from "../../tools/claude/essayTasks";
import { ReadSpec } from "../../tools/claude/spec";
import { ReadName } from "../../tools/claude/name";
import { ReadEssay } from "../../tools/claude/essay";
import {
  ListExampleFunctions,
  ReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ReadFunctionSchema } from "../../tools/claude/function";

function essayTasksIsNonEmpty(): boolean {
  return (
    existsSync("ESSAY_TASKS.md") &&
    readFileSync("ESSAY_TASKS.md", "utf-8").trim().length > 0
  );
}

export async function essayTasksMcp(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  if (essayTasksIsNonEmpty()) return sessionId;

  const tools = [
    ReadSpec,
    ReadName,
    ReadEssay,
    ReadEssayTasks,
    WriteEssayTasks,
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,
  ];
  const mcpServer = createSdkMcpServer({ name: "essayTasks", tools });

  const prompt =
    "Read SPEC.md, name.txt, ESSAY.md, and example functions to understand the context, then create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
    " Each task is a plain language description of a task which will go into the function's `tasks` array.";

  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { essayTasks: mcpServer },
        allowedTools: ["mcp__essayTasks__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    }),
    log,
    sessionId,
  );

  let retry = 1;
  while (!essayTasksIsNonEmpty()) {
    if (retry > 3) {
      throw new Error("ESSAY_TASKS.md is empty after essayTasks phase");
    }
    sessionId = await consumeStream(
      query({
        prompt:
          "ESSAY_TASKS.md is empty after your essayTasks phase." +
          " Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
          " Each task is a plain language description of a task which will go into the function's `tasks` array.",
        options: {
          tools: [],
          mcpServers: { essayTasks: mcpServer },
          allowedTools: ["mcp__essayTasks__*"],
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
