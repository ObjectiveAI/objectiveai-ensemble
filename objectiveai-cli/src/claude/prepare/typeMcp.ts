import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";
import { consumeStream, wrapToolsWithLogging } from "../../logging";
import { editType, isDefaultType } from "../../tools/function/type";
import { makeReadSpec } from "../../tools/claude/spec";
import {
  makeReadType,
  makeReadTypeSchema,
  makeEditType,
  makeCheckType,
} from "../../tools/claude/type";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ToolState, formatReadList } from "../../tools/claude/toolState";
import { writeSession } from "../../tools/session";

export async function typeMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
  type?: "scalar.function" | "vector.function",
  model?: string,
): Promise<string | undefined> {
  if (!isDefaultType()) return sessionId;

  if (type) {
    editType(type);
    return sessionId;
  }

  const tools = [
    makeReadSpec(state),
    makeReadType(state),
    makeReadTypeSchema(state),
    makeEditType(state),
    makeCheckType(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "type", tools: wrapToolsWithLogging(tools, log) });

  const reads: string[] = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  if (!state.hasReadExampleFunctions) reads.push("example functions");

  const readPrefix = reads.length > 0
    ? `Read ${formatReadList(reads)} to understand the context, then choose`
    : "Choose";

  sessionId = await consumeStream(
    query({
      prompt:
        "Do not re-read anything you have already read or written in your conversation history.\n\n" +
        `${readPrefix} the function type based on the SPEC:\n` +
        "- Use `scalar.function` if the input is a single item and the function **scores** it (output: single number 0-1)\n" +
        "- Use `vector.function` if the input is multiple items and the function **ranks** them (output: array of scores summing to ~1)\n\n" +
        "Use EditType to set the type.",
      options: {
        tools: [],
        mcpServers: { type: mcpServer },
        allowedTools: ["mcp__type__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
        model,
      },
    }),
    log,
    sessionId,
  );

  let retry = 1;
  while (isDefaultType()) {
    if (retry > 10) {
      throw new Error("type is not set after type phase");
    }
    sessionId = await consumeStream(
      query({
        prompt:
          "type is not set after your type phase.\n" +
          "Use EditType to set the type to either `scalar.function` or `vector.function`.",
        options: {
          tools: [],
          mcpServers: { type: mcpServer },
          allowedTools: ["mcp__type__*"],
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

  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
