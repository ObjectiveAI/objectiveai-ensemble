import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import {
  editInputSchema,
  isDefaultInputSchema,
} from "../../tools/function/inputSchema";
import { makeReadSpec } from "../../tools/claude/spec";
import {
  makeReadType,
  makeReadTypeSchema,
} from "../../tools/claude/type";
import {
  makeReadInputSchema,
  makeReadInputSchemaSchema,
  makeEditInputSchema,
  makeCheckInputSchema,
} from "../../tools/claude/inputSchema";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ToolState, formatReadList } from "../../tools/claude/toolState";
import { writeSession } from "../../tools/session";

export async function inputSchemaMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
  inputSchema?: string,
  model?: string,
): Promise<string | undefined> {
  if (!isDefaultInputSchema()) return sessionId;

  if (inputSchema) {
    const parsed = JSON.parse(inputSchema);
    const result = editInputSchema(parsed);
    if (!result.ok) {
      throw new Error(`Failed to set input_schema: ${result.error}`);
    }
    return sessionId;
  }

  const tools = [
    makeReadSpec(state),
    makeReadType(state),
    makeReadTypeSchema(state),
    makeReadInputSchema(state),
    makeReadInputSchemaSchema(state),
    makeEditInputSchema(state),
    makeCheckInputSchema(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "input-schema", tools });

  const reads: string[] = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  if (!state.hasReadExampleFunctions) reads.push("example functions");

  const readPrefix = reads.length > 0
    ? `Read ${formatReadList(reads)} to understand the context, then define`
    : "Define";

  sessionId = await consumeStream(
    query({
      prompt:
        `${readPrefix} the input_schema for this function.\n\n` +
        "The input_schema is a JSON Schema object that describes the shape of the function's input.\n" +
        "- For **scalar** functions: the input describes a single item to score\n" +
        "- For **vector** functions: the input must be an array or an object with at least one array property (the items to rank)\n\n" +
        "Read the type first, then use EditInputSchema to set the input_schema.",
      options: {
        tools: [],
        mcpServers: { "input-schema": mcpServer },
        allowedTools: ["mcp__input-schema__*"],
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
  while (isDefaultInputSchema()) {
    if (retry > 10) {
      throw new Error("input_schema is not set after input schema phase");
    }
    sessionId = await consumeStream(
      query({
        prompt:
          "input_schema is not set after your input schema phase.\n" +
          "Use EditInputSchema to set the input_schema.",
        options: {
          tools: [],
          mcpServers: { "input-schema": mcpServer },
          allowedTools: ["mcp__input-schema__*"],
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
