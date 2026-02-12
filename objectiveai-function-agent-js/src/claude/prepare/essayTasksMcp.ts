import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { makeWriteEssayTasks } from "../../tools/claude/essayTasks";
import { makeReadSpec } from "../../tools/claude/spec";
import { makeReadName } from "../../tools/claude/name";
import { makeReadEssay } from "../../tools/claude/essay";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { makeReadFunctionSchema } from "../../tools/claude/function";
import { ToolState } from "../../tools/claude/toolState";

function essayTasksIsNonEmpty(): boolean {
  return (
    existsSync("ESSAY_TASKS.md") &&
    readFileSync("ESSAY_TASKS.md", "utf-8").trim().length > 0
  );
}

export async function essayTasksMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  if (essayTasksIsNonEmpty()) return sessionId;

  const tools = [
    makeReadSpec(state),
    makeReadName(state),
    makeReadEssay(state),
    makeWriteEssayTasks(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "essayTasks", tools });

  const widthDesc =
    state.minWidth === state.maxWidth
      ? `exactly ${state.minWidth}`
      : `between ${state.minWidth} and ${state.maxWidth}`;

  const prompt =
    "Read SPEC.md, name.txt, ESSAY.md, and example functions to understand the context, then create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
    " Each task is a plain language description of a task which will go into the function's `tasks` array." +
    ` There must be ${widthDesc} tasks.`;

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
          " Each task is a plain language description of a task which will go into the function's `tasks` array." +
          ` There must be ${widthDesc} tasks.`,
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
