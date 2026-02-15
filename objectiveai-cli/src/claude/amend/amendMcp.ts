import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { AgentOptions, LogFn } from "../../agentOptions";
import { submit } from "../../tools/submit";
import { consumeStream, wrapToolsWithLogging } from "../../logging";
import { registerSchemaRefs } from "../../tools/schemaRefs";
import { ToolState, formatReadList } from "../../tools/claude/toolState";

// Tools - read-only context
import { makeReadSpec } from "../../tools/claude/spec";
import { makeReadName } from "../../tools/claude/name";
import { makeReadEssay } from "../../tools/claude/essay";
import { makeReadEssayTasks } from "../../tools/claude/essayTasks";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";

// Tools - expression params
import {
  makeReadInputParamSchema,
  makeReadMapParamSchema,
  makeReadOutputParamSchema,
} from "../../tools/claude/expressionParams";

// Tools - function field CRUD
import {
  makeReadFunction,
  makeReadFunctionSchema,
  makeCheckFunction,
} from "../../tools/claude/function";
import {
  makeReadType,
  makeReadTypeSchema,
  makeCheckType,
} from "../../tools/claude/type";
import {
  makeReadDescription,
  makeReadDescriptionSchema,
  makeEditDescription,
  makeCheckDescription,
} from "../../tools/claude/description";
import {
  makeReadInputSchema,
  makeReadInputSchemaSchema,
  makeEditInputSchema,
  makeCheckInputSchema,
} from "../../tools/claude/inputSchema";
import {
  makeReadInputMaps,
  makeReadInputMapsSchema,
  makeEditInputMap,
  makeAppendInputMap,
  makeDelInputMap,
  makeDelInputMaps,
  makeCheckInputMaps,
} from "../../tools/claude/inputMaps";
import {
  makeReadOutputLength,
  makeReadOutputLengthSchema,
  makeEditOutputLength,
  makeCheckOutputLength,
  makeDelOutputLength,
} from "../../tools/claude/outputLength";
import {
  makeReadInputSplit,
  makeReadInputSplitSchema,
  makeEditInputSplit,
  makeCheckInputSplit,
  makeDelInputSplit,
} from "../../tools/claude/inputSplit";
import {
  makeReadInputMerge,
  makeReadInputMergeSchema,
  makeEditInputMerge,
  makeCheckInputMerge,
  makeDelInputMerge,
} from "../../tools/claude/inputMerge";
import {
  makeReadTasks,
  makeReadTasksSchema,
  makeAppendTask,
  makeEditTask,
  makeDelTask,
  makeDelTasks,
  makeCheckTasks,
  makeReadMessagesExpressionSchema,
  makeReadToolsExpressionSchema,
  makeReadResponsesExpressionSchema,
} from "../../tools/claude/tasks";

// Tools - example inputs
import {
  makeReadExampleInput,
  makeReadExampleInputs,
  makeReadExampleInputsSchema,
  makeAppendExampleInput,
  makeEditExampleInput,
  makeDelExampleInput,
  makeDelExampleInputs,
  makeCheckExampleInputs,
} from "../../tools/claude/inputs";

// Tools - plan
import { makeReadPlan } from "../../tools/claude/plan";

// Tools - network tests
import {
  makeRunNetworkTests,
  makeReadDefaultNetworkTest,
  makeReadSwissSystemNetworkTest,
} from "../../tools/claude/networkTests";

// Tools - recursive type schemas
import {
  makeReadJsonValueSchema,
  makeReadJsonValueExpressionSchema,
} from "../../tools/claude/jsonValue";
import {
  makeReadInputValueSchema,
  makeReadInputValueExpressionSchema,
} from "../../tools/claude/inputValue";

// Tools - message role schemas
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

// Tools - content schemas
import {
  makeReadSimpleContentSchema,
  makeReadRichContentSchema,
  makeReadSimpleContentExpressionSchema,
  makeReadRichContentExpressionSchema,
} from "../../tools/claude/content";

// Tools - task type schemas
import {
  makeReadScalarFunctionTaskSchema,
  makeReadVectorFunctionTaskSchema,
  makeReadVectorCompletionTaskSchema,
  makeReadCompiledScalarFunctionTaskSchema,
  makeReadCompiledVectorFunctionTaskSchema,
  makeReadCompiledVectorCompletionTaskSchema,
} from "../../tools/claude/taskTypes";

// Tools - readme
import { makeReadReadme, makeWriteReadme } from "../../tools/claude/readme";

// Tools - submit
import { makeSubmit } from "../../tools/claude/submit";

// Function-layer reads for conditional tool inclusion
import { readType } from "../../tools/function/type";
import { isDefaultInputMaps } from "../../tools/function/inputMaps";
import { isDefaultInputSplit } from "../../tools/function/inputSplit";
import { isDefaultInputMerge } from "../../tools/function/inputMerge";
import { isDefaultOutputLength } from "../../tools/function/outputLength";

// Plan
import { planMcp as amendPlanMcp } from "./planMcp";

// Tools - agent functions (for function tasks variant)
import { makeSpawnFunctionAgents } from "../../tools/claude/spawnFunctionAgents";
import { makeAmendFunctionAgents } from "../../tools/claude/amendFunctionAgents";
import { makeWaitFunctionAgents } from "../../tools/claude/waitFunctionAgents";
import {
  makeListAgentFunctions,
  makeReadAgentFunction,
} from "../../tools/claude/agentFunctions";

// Common tools shared by both variants
function getCommonTools(state: ToolState, useFunctionTasks: boolean, mutableInputSchema: boolean) {
  registerSchemaRefs();

  // Conditionally hide tools that aren't relevant for the current function type
  const fnType = readType();
  const isScalar = fnType.ok && fnType.value === "scalar.function";
  const isVector = fnType.ok && fnType.value === "vector.function";
  const includeInputMaps = !isDefaultInputMaps() || (isVector && useFunctionTasks);
  const includeInputSplit = !isScalar || !isDefaultInputSplit();
  const includeInputMerge = !isScalar || !isDefaultInputMerge();
  const includeOutputLength = !isScalar || !isDefaultOutputLength();

  return [
    // Core Context
    makeReadSpec(state),
    makeReadName(state),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeReadPlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),

    // Function
    makeReadFunction(state),
    makeCheckFunction(state),
    makeReadType(state),
    makeReadTypeSchema(state),
    makeCheckType(state),
    makeReadDescription(state),
    makeReadDescriptionSchema(state),
    makeEditDescription(state),
    makeCheckDescription(state),
    makeReadInputSchema(state),
    makeReadInputSchemaSchema(state),
    ...(mutableInputSchema ? [makeEditInputSchema(state)] : []),
    makeCheckInputSchema(state),
    ...(includeInputMaps ? [
      makeReadInputMaps(state),
      makeReadInputMapsSchema(state),
      makeEditInputMap(state),
      makeAppendInputMap(state),
      makeDelInputMap(state),
      makeDelInputMaps(state),
      makeCheckInputMaps(state),
    ] : []),
    ...(includeOutputLength ? [
      makeReadOutputLength(state),
      makeReadOutputLengthSchema(state),
      makeEditOutputLength(state),
      makeDelOutputLength(state),
      makeCheckOutputLength(state),
    ] : []),
    ...(includeInputSplit ? [
      makeReadInputSplit(state),
      makeReadInputSplitSchema(state),
      makeEditInputSplit(state),
      makeDelInputSplit(state),
      makeCheckInputSplit(state),
    ] : []),
    ...(includeInputMerge ? [
      makeReadInputMerge(state),
      makeReadInputMergeSchema(state),
      makeEditInputMerge(state),
      makeDelInputMerge(state),
      makeCheckInputMerge(state),
    ] : []),
    makeReadTasks(state),
    makeReadTasksSchema(state),
    makeAppendTask(state),
    makeEditTask(state),
    makeDelTask(state),
    makeDelTasks(state),
    makeCheckTasks(state),
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
    makeReadExampleInput(state),
    makeReadExampleInputs(state),
    makeReadExampleInputsSchema(state),
    makeAppendExampleInput(state),
    makeEditExampleInput(state),
    makeDelExampleInput(state),
    makeDelExampleInputs(state),
    makeCheckExampleInputs(state),

    // README
    makeReadReadme(state),
    makeWriteReadme(state),

    // Network tests
    makeRunNetworkTests(state),
    makeReadDefaultNetworkTest(state),
    makeReadSwissSystemNetworkTest(state),

    // Submit
    makeSubmit(state),
  ];
}

// Additional tools for function tasks variant
function getFunctionTasksTools(state: ToolState) {
  return [
    makeSpawnFunctionAgents(state),
    makeAmendFunctionAgents(state),
    makeWaitFunctionAgents(state),
    makeListAgentFunctions(state),
    makeReadAgentFunction(state),
  ];
}

function buildReadLine(state: ToolState): string {
  const reads: string[] = [];
  if (!state.hasReadOrWrittenSpec) reads.push("SPEC.md (including amendments)");
  reads.push("name.txt");
  if (!state.hasReadOrWrittenEssay) reads.push("ESSAY.md");
  if (!state.hasReadOrWrittenEssayTasks) reads.push("ESSAY_TASKS.md");
  if (!state.hasReadExampleFunctions) reads.push("example functions");
  reads.push("the current function definition");
  reads.push("the current example inputs");
  if (reads.length === 0) return "";
  return `\nRead ${formatReadList(reads)} to understand the current state.\n`;
}

function buildAmendFunctionTasksPrompt(state: ToolState, amendment: string): string {
  const readLine = buildReadLine(state);
  return `Do not re-read anything you have already read or written in your conversation history.

You are amending an existing ObjectiveAI Function. Your goal is to implement the following amendment, ensure all tests pass, and submit the result.

## Amendment

${amendment}
${readLine}

## Phase 1: Understand the Amendment

Read the current function definition, tasks, and example inputs to understand the existing implementation. Only implement the amendment above — previous amendments have already been applied.

## Phase 2: Apply Changes

### Modifying the Function Definition
- Use the Edit* tools to modify function fields as needed
- Read the *Schema tools to understand what types are expected
- Only change what the amendment requires — preserve existing functionality

### Modifying Sub-Functions
- Use **AmendFunctionAgents** to amend existing sub-functions that need changes
- Use **SpawnFunctionAgents** to create new sub-functions if the amendment requires them
- Use ListAgentFunctions and ReadAgentFunction to inspect existing sub-functions

### Updating Example Inputs
- Modify, add, or remove example inputs to match the amended function behavior
- Ensure example inputs still cover edge cases and diverse scenarios

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 3: Verify Compliance

Before finalizing, verify that everything adheres to SPEC.md (including amendments):
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs satisfy both the original spec and all amendments
- **SPEC.md (including amendments) is the universal source of truth**

## Phase 4: Finalize

Once all tests pass and compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md (including amendments) is the universal source of truth** — never contradict it
- **Only implement this amendment** — previous amendments have already been applied
- **Preserve existing functionality** unless the amendment explicitly changes it
- **No API key is needed for tests** — tests run against a local server
`;
}

function buildAmendVectorTasksPrompt(state: ToolState, amendment: string): string {
  const readLine = buildReadLine(state);
  return `Do not re-read anything you have already read or written in your conversation history.

You are amending an existing ObjectiveAI Function. Your goal is to implement the following amendment, ensure all tests pass, and submit the result.

## Amendment

${amendment}
${readLine}

## Phase 1: Understand the Amendment

Read the current function definition, tasks, and example inputs to understand the existing implementation. Only implement the amendment above — previous amendments have already been applied.

## Phase 2: Apply Changes

### Modifying the Function Definition
- Use the Edit* tools to modify function fields as needed
- Read the *Schema tools to understand what types are expected
- Only change what the amendment requires — preserve existing functionality

### Modifying Tasks
- Edit, add, or remove vector completion tasks as needed
- Use \`map\` if a task needs to iterate over input items
- Responses should be phrased as potential assistant messages. For example, if ranking dating profiles, don't ask "which profile is best" — instead ask "what is a good dating profile" and make each response a dating profile
- If a task is for ranking items from an input array, the array items go into \`responses\`, not \`messages\`

### Updating Example Inputs
- Modify, add, or remove example inputs to match the amended function behavior
- Ensure example inputs still cover edge cases and diverse scenarios

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 3: Verify Compliance

Before finalizing, verify that everything adheres to SPEC.md (including amendments):
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs satisfy both the original spec and all amendments
- **SPEC.md (including amendments) is the universal source of truth**

## Phase 4: Finalize

Once all tests pass and compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md (including amendments) is the universal source of truth** — never contradict it
- **Only implement this amendment** — previous amendments have already been applied
- **Preserve existing functionality** unless the amendment explicitly changes it
- **No API key is needed for tests** — tests run against a local server
`;
}

async function amendLoop(
  state: ToolState,
  log: LogFn,
  useFunctionTasks: boolean,
  mutableInputSchema: boolean,
  amendment: string,
  sessionId?: string,
  model?: string,
): Promise<string | undefined> {
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let lastFailureReasons: string[] = [];

  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Amend loop attempt ${attempt}/${maxAttempts}`);

    // Build tools list
    const tools = [
      ...getCommonTools(state, useFunctionTasks, mutableInputSchema),
      ...(useFunctionTasks ? getFunctionTasksTools(state) : []),
    ];
    const mcpServer = createSdkMcpServer({ name: "amend", tools: wrapToolsWithLogging(tools, log) });

    // Build the prompt
    let prompt: string;

    if (attempt === 1) {
      prompt = useFunctionTasks
        ? buildAmendFunctionTasksPrompt(state, amendment)
        : buildAmendVectorTasksPrompt(state, amendment);
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Use RunNetworkTests to test
2. Use Submit to validate, commit, and push
`;
    }

    const runQuery = (sid?: string) =>
      consumeStream(
        query({
          prompt,
          options: {
            tools: [],
            mcpServers: { amend: mcpServer },
            allowedTools: ["mcp__amend__*"],
            disallowedTools: ["AskUserQuestion"],
            permissionMode: "dontAsk",
            resume: sid,
            model,
          },
        }),
        log,
        sid,
      );

    try {
      sessionId = await runQuery(sessionId);
    } catch (e) {
      if (!state.anyStepRan) {
        log("Session may be invalid, retrying without session...");
        sessionId = await runQuery(undefined);
      } else {
        throw e;
      }
    }
    state.anyStepRan = true;

    // Validate and submit
    log("Running submit...");
    lastFailureReasons = [];
    const submitResult = await submit(
      "amend",
      state.submitApiBase,
      state.submitApiKey,
      {
        userName: state.gitUserName,
        userEmail: state.gitUserEmail,
        ghToken: state.ghToken,
      },
      sessionId,
    );
    if (submitResult.ok) {
      success = true;
      log(`Success: Submitted commit ${submitResult.value}`);
    } else {
      lastFailureReasons.push(submitResult.error!);
      log(`Submit failed: ${submitResult.error}`);
    }
  }

  if (!success) {
    throw new Error("Amend loop failed after maximum attempts.");
  }

  return sessionId;
}

export async function amendMcp(
  state: ToolState,
  options: AgentOptions,
  amendment: string,
): Promise<void> {
  const log = options.log;
  const depth = options.depth;
  const useFunctionTasks = depth > 0;

  log("=== Amend Plan ===");
  let sessionId: string | undefined;
  try {
    sessionId = await amendPlanMcp(state, log, depth, amendment, options.sessionId, options.claudePlanModel);
  } catch (e) {
    if (!state.anyStepRan) {
      log("Session may be invalid, retrying without session...");
      sessionId = await amendPlanMcp(state, log, depth, amendment, undefined, options.claudePlanModel);
    } else {
      throw e;
    }
  }

  const mutableInputSchema = !!options.mutableInputSchema;
  log(`=== Amend Loop: Modifying function (${useFunctionTasks ? "function" : "vector"} tasks) ===`);
  await amendLoop(state, log, useFunctionTasks, mutableInputSchema, amendment, sessionId, options.claudeAmendModel);

  log("=== ObjectiveAI Function amendment complete ===");
}
