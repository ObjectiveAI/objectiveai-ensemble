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
import { writeSession } from "../../tools/session";
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
  depth: number,
  amendment: string,
  sessionId?: string,
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
    makeReadTasks(state),
    makeReadTasksSchema(state),
    makeReadMessagesExpressionSchema(state),
    makeReadToolsExpressionSchema(state),
    makeReadResponsesExpressionSchema(state),

    // Expression params
    makeReadInputParamSchema(state),
    makeReadMapParamSchema(state),
    makeReadOutputParamSchema(state),

    // Recursive type schemas
    makeReadJsonValueSchema(state),
    makeReadJsonValueExpressionSchema(state),
    makeReadInputValueSchema(state),
    makeReadInputValueExpressionSchema(state),

    // Message role schemas (expression variants)
    makeReadDeveloperMessageExpressionSchema(state),
    makeReadSystemMessageExpressionSchema(state),
    makeReadUserMessageExpressionSchema(state),
    makeReadToolMessageExpressionSchema(state),
    makeReadAssistantMessageExpressionSchema(state),

    // Message role schemas (compiled variants)
    makeReadDeveloperMessageSchema(state),
    makeReadSystemMessageSchema(state),
    makeReadUserMessageSchema(state),
    makeReadToolMessageSchema(state),
    makeReadAssistantMessageSchema(state),

    // Content schemas (expression variants)
    makeReadSimpleContentExpressionSchema(state),
    makeReadRichContentExpressionSchema(state),

    // Content schemas (compiled variants)
    makeReadSimpleContentSchema(state),
    makeReadRichContentSchema(state),

    // Task type schemas
    makeReadScalarFunctionTaskSchema(state),
    makeReadVectorFunctionTaskSchema(state),
    makeReadVectorCompletionTaskSchema(state),

    // Compiled task type schemas
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
  const mcpServer = createSdkMcpServer({ name: "amend-plan", tools });

  const reads: string[] = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  reads.push("the current function definition");
  reads.push("the current example inputs");
  if (!state.hasReadExampleFunctions) reads.push("example functions");

  const readPrefix =
    reads.length > 0
      ? `Read ${formatReadList(reads)} to understand the current state. Then write`
      : "Write";

  const useFunctionTasks = depth > 0;

  const taskStructure = useFunctionTasks
    ? `\n\n### Task Structure` +
      `\nThis function uses **function tasks** (type: \`scalar.function\` or \`vector.function\`). Plan what changes are needed to the existing sub-functions and whether any new sub-functions need to be spawned or existing ones amended.` +
      `\n- Use AmendFunctionAgents to amend existing sub-functions` +
      `\n- Use SpawnFunctionAgents to create new sub-functions if needed`
    : `\n\n### Task Structure` +
      `\nThis function uses **vector completion tasks** (type: \`vector.completion\`). Plan what changes are needed to the existing tasks.` +
      `\n- Modify existing tasks as needed` +
      `\n- Add or remove tasks if the amendment requires it` +
      `\n- Responses should be phrased as potential assistant messages (e.g. if ranking dating profiles, ask "what is a good dating profile" and make each response a dating profile)` +
      `\n- If a task ranks items from an input array, the array items go into \`responses\`, not \`messages\``;

  const prompt =
    `You are amending an existing ObjectiveAI Function. The following amendment describes what needs to change:` +
    `\n\n## Amendment\n\n${amendment}` +
    `\n\n${readPrefix} your amendment plan using the WritePlan tool. Include:` +
    `\n- What the amendment changes about the function` +
    `\n- Which parts of the existing function definition need to be modified` +
    `\n- What example inputs need to be added, modified, or removed` +
    `\n- Whether any expressions need to change` +
    taskStructure +
    `\n\n### Important` +
    `\n- **SPEC.md (including amendments) is the universal source of truth** — the amended function must satisfy both the original spec and all amendments` +
    `\n- **Only implement this amendment** — previous amendments have already been applied` +
    `\n- **Preserve existing functionality** unless the amendment explicitly changes it` +
    `\n- **Minimize changes** — only modify what the amendment requires`;

  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { "amend-plan": mcpServer },
        allowedTools: ["mcp__amend-plan__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    }),
    log,
    sessionId,
  );

  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
