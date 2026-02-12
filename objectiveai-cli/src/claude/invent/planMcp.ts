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
  if (!state.hasReadExampleFunctions) reads.push("example functions");

  const readPrefix =
    reads.length > 0
      ? `Read ${formatReadList(reads)} to understand the context. Then write`
      : "Write";

  const widthDesc =
    state.minWidth === state.maxWidth
      ? `exactly ${state.minWidth}`
      : `between ${state.minWidth} and ${state.maxWidth}`;

  const useFunctionTasks = depth > 0;

  const taskStructure = useFunctionTasks
    ? `\n\n### Task Structure` +
      `\nThis function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). Plan ${widthDesc} sub-functions, each responsible for a distinct evaluation task from ESSAY_TASKS.md.` +
      `\n- Each sub-function will be spawned as a child agent` +
      `\n- The parent function's input schema must support deriving each sub-function's input` +
      `\n- Plan whether any input_maps are needed for mapped task execution` +
      `\n- For each sub-function, describe: what it evaluates, its input schema, whether it's scalar or vector`
    : `\n\n### Task Structure` +
      `\nThis function must use **vector completion tasks** (type: \`vector.completion\`). Plan ${widthDesc} inline vector completion tasks.` +
      `\n- Use \`map\` if a task needs to iterate over input items` +
      `\n- Each task's prompt and responses define what gets evaluated` +
      `\n- Responses should be phrased as potential assistant messages (e.g. if ranking dating profiles, ask "what is a good dating profile" and make each response a dating profile)` +
      `\n- If a task ranks items from an input array, the array items go into \`responses\`, not \`messages\``;

  const contentFormat = useFunctionTasks
    ? ""
    : `\n\n### Message and Response Content Format` +
      `\n- **Messages**: Always use array-of-parts format for message \`content\`, never plain strings` +
      `\n  - Correct: \`{"role": "user", "content": [{"type": "text", "text": "..."}]}\`` +
      `\n  - Wrong: \`{"role": "user", "content": "..."}\`` +
      `\n- **Responses**: Always use array-of-parts format for each response, never plain strings` +
      `\n  - Correct: \`[[{"type": "text", "text": "good"}], [{"type": "text", "text": "bad"}]]\`` +
      `\n  - Wrong: \`["good", "bad"]\`` +
      `\n- **Never use \`str()\` on multimodal content** — pass rich content directly (or via expressions)`;

  let prompt =
    `${readPrefix} your implementation plan using the WritePlan tool. Include:` +
    `\n- The input schema structure and field descriptions` +
    `\n- Whether any input maps are needed for mapped task execution` +
    `\n- What the function definition will look like` +
    `\n- What expressions need to be written` +
    `\n- What test inputs will cover edge cases and diverse scenarios` +
    taskStructure +
    `\n\n### Expression Language` +
    `\n- **Prefer Starlark** (\`{"$starlark": "..."}\`) for most expressions — it's Python-like and more readable` +
    `\n- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions` +
    `\n- Starlark example: \`{"$starlark": "input['items'][0]"}\`` +
    `\n- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)` +
    `\n\n### Expression Context` +
    `\nExpressions receive a single object with these fields:` +
    `\n- \`input\` — Always present, the function input` +
    `\n- \`map\` — Present in mapped tasks, the current map element` +
    `\n- \`output\` — Present in task output expressions, the raw task result` +
    contentFormat +
    `\n\n### Example Inputs` +
    `\nPlan for diverse test inputs (minimum 10, maximum 100):` +
    `\n- **Diversity in structure**: edge cases, empty arrays, single items, boundary values, missing optional fields` +
    `\n- **Diversity in intended output**: cover the full range of expected scores (low, medium, high)` +
    `\n- **Multimodal content**: if using image/video/audio/file types, use placeholder URLs for testing` +
    `\n\n### Important` +
    `\n- **SPEC.md is the universal source of truth** — never contradict it`;

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

  state.anyStepRan = true;
  if (sessionId) writeSession(sessionId);
  return sessionId;
}
