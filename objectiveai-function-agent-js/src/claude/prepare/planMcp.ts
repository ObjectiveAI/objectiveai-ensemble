import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { makeWritePlan } from "../../tools/claude/plan";
import { makeReadSpec } from "../../tools/claude/spec";
import { makeReadName } from "../../tools/claude/name";
import { makeReadEssay } from "../../tools/claude/essay";
import { makeReadEssayTasks } from "../../tools/claude/essayTasks";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import {
  makeCheckFunction,
  makeReadFunction,
  makeReadFunctionSchema,
} from "../../tools/claude/function";
import { ToolState, formatReadList } from "../../tools/claude/toolState";
import {
  makeReadInputParamSchema,
  makeReadMapParamSchema,
  makeReadOutputParamSchema,
} from "../../tools/claude/expressionParams";
import {
  makeReadTasks,
  makeReadTasksSchema,
  makeReadMessagesExpressionSchema,
  makeReadToolsExpressionSchema,
  makeReadResponsesExpressionSchema,
} from "../../tools/claude/tasks";
import {
  makeReadJsonValueSchema,
  makeReadJsonValueExpressionSchema,
} from "../../tools/claude/jsonValue";
import {
  makeReadInputValueSchema,
  makeReadInputValueExpressionSchema,
} from "../../tools/claude/inputValue";
import {
  makeReadDeveloperMessageSchema,
  makeReadSystemMessageSchema,
  makeReadUserMessageSchema,
  makeReadToolMessageSchema,
  makeReadAssistantMessageSchema,
  makeReadDeveloperMessageExpressionSchema,
  makeReadSystemMessageExpressionSchema,
  makeReadUserMessageExpressionSchema,
  makeReadToolMessageExpressionSchema,
  makeReadAssistantMessageExpressionSchema,
} from "../../tools/claude/messages";
import {
  makeReadSimpleContentSchema,
  makeReadRichContentSchema,
  makeReadSimpleContentExpressionSchema,
  makeReadRichContentExpressionSchema,
} from "../../tools/claude/content";
import {
  makeReadScalarFunctionTaskSchema,
  makeReadVectorFunctionTaskSchema,
  makeReadVectorCompletionTaskSchema,
  makeReadCompiledScalarFunctionTaskSchema,
  makeReadCompiledVectorFunctionTaskSchema,
  makeReadCompiledVectorCompletionTaskSchema,
} from "../../tools/claude/taskTypes";
import {
  makeReadExampleInputs,
  makeReadExampleInputsSchema,
  makeCheckExampleInputs,
} from "../../tools/claude/inputs";
import { makeReadReadme } from "../../tools/claude/readme";
import {
  makeRunNetworkTests,
  makeReadDefaultNetworkTest,
  makeReadSwissSystemNetworkTest,
} from "../../tools/claude/networkTests";

export async function planMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
  instructions?: string,
): Promise<string | undefined> {
  const tools = [
    makeReadSpec(state),
    makeReadName(state),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeWritePlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),

    // Function
    makeReadFunction(state),
    makeCheckFunction(state),
    makeReadMessagesExpressionSchema(state),
    makeReadToolsExpressionSchema(state),
    makeReadResponsesExpressionSchema(state),

    // Expression params
    makeReadInputParamSchema(state),
    makeReadMapParamSchema(state),
    makeReadOutputParamSchema(state),

    // Recursive type schemas (referenced by $ref in other schemas)
    makeReadJsonValueSchema(state),
    makeReadJsonValueExpressionSchema(state),
    makeReadInputValueSchema(state),
    makeReadInputValueExpressionSchema(state),

    // Message role schemas (expression variants, referenced by $ref in ReadMessagesExpressionSchema)
    makeReadDeveloperMessageExpressionSchema(state),
    makeReadSystemMessageExpressionSchema(state),
    makeReadUserMessageExpressionSchema(state),
    makeReadToolMessageExpressionSchema(state),
    makeReadAssistantMessageExpressionSchema(state),

    // Message role schemas (compiled variants, referenced by $ref in ReadCompiledVectorCompletionTaskSchema)
    makeReadDeveloperMessageSchema(state),
    makeReadSystemMessageSchema(state),
    makeReadUserMessageSchema(state),
    makeReadToolMessageSchema(state),
    makeReadAssistantMessageSchema(state),

    // Content schemas (expression variants, referenced by $ref in expression message schemas)
    makeReadSimpleContentExpressionSchema(state),
    makeReadRichContentExpressionSchema(state),

    // Content schemas (compiled variants, referenced by $ref in compiled message schemas)
    makeReadSimpleContentSchema(state),
    makeReadRichContentSchema(state),

    // Task type schemas (referenced by $ref in ReadTasksSchema)
    makeReadScalarFunctionTaskSchema(state),
    makeReadVectorFunctionTaskSchema(state),
    makeReadVectorCompletionTaskSchema(state),

    // Compiled task type schemas (referenced by $ref in ReadExampleInputsSchema)
    makeReadCompiledScalarFunctionTaskSchema(state),
    makeReadCompiledVectorFunctionTaskSchema(state),
    makeReadCompiledVectorCompletionTaskSchema(state),

    // Example inputs
    makeReadExampleInputs(state),
    makeReadExampleInputsSchema(state),
    makeCheckExampleInputs(state),

    // README
    makeReadReadme(state),

    // Network tests
    makeRunNetworkTests(state),
    makeReadDefaultNetworkTest(state),
    makeReadSwissSystemNetworkTest(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "plan", tools });

  const reads: string[] = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  reads.push("the function type");
  reads.push("example functions");

  const readPrefix =
    reads.length > 0
      ? `Read ${formatReadList(reads)} to understand the context. Then write`
      : "Write";

  let prompt =
    `${readPrefix} your implementation plan using the WritePlan tool. Include:` +
    `\n- The input schema structure and field descriptions` +
    `\n- Whether any input maps are needed for mapped task execution` +
    `\n- What the function definition will look like` +
    `\n- What expressions need to be written` +
    `\n- What test inputs will cover edge cases and diverse scenarios`;

  if (instructions) {
    prompt += `\n\n## Extra Instructions\n\n${instructions}`;
  }

  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { plan: mcpServer },
        allowedTools: ["mcp__plan__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    }),
    log,
    sessionId,
  );

  return sessionId;
}
