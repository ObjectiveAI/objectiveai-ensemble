import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { AgentOptions, LogFn } from "../../agentOptions";
import { submit } from "../../tools/submit";
import { createFileLogger, consumeStream } from "../../logging";
import { registerSchemaRefs } from "../../tools/schemaRefs";
import { ToolState } from "../../tools/claude/toolState";

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
  makeEditType,
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

// Tools - agent functions (for function tasks variant)
import { makeSpawnFunctionAgents } from "../../tools/claude/spawnFunctionAgents";
import {
  makeListAgentFunctions,
  makeReadAgentFunction,
} from "../../tools/claude/agentFunctions";

// Common tools shared by both variants
function getCommonTools(state: ToolState) {
  registerSchemaRefs();
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
    makeEditType(state),
    makeCheckType(state),
    makeReadDescription(state),
    makeReadDescriptionSchema(state),
    makeEditDescription(state),
    makeCheckDescription(state),
    makeReadInputSchema(state),
    makeReadInputSchemaSchema(state),
    makeEditInputSchema(state),
    makeCheckInputSchema(state),
    makeReadInputMaps(state),
    makeReadInputMapsSchema(state),
    makeAppendInputMap(state),
    makeDelInputMap(state),
    makeDelInputMaps(state),
    makeCheckInputMaps(state),
    makeReadOutputLength(state),
    makeReadOutputLengthSchema(state),
    makeEditOutputLength(state),
    makeDelOutputLength(state),
    makeCheckOutputLength(state),
    makeReadInputSplit(state),
    makeReadInputSplitSchema(state),
    makeEditInputSplit(state),
    makeDelInputSplit(state),
    makeCheckInputSplit(state),
    makeReadInputMerge(state),
    makeReadInputMergeSchema(state),
    makeEditInputMerge(state),
    makeDelInputMerge(state),
    makeCheckInputMerge(state),
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

// Additional tools for function tasks variant (sub-function spawning)
function getFunctionTasksTools(state: ToolState) {
  return [
    makeSpawnFunctionAgents(state),
    makeListAgentFunctions(state),
    makeReadAgentFunction(state),
  ];
}

function widthText(minWidth: number, maxWidth: number): string {
  if (minWidth === maxWidth) return `exactly **${minWidth}**`;
  return `between **${minWidth}** and **${maxWidth}**`;
}

function buildFunctionTasksPrompt(state: ToolState): string {
  const w = widthText(state.minWidth, state.maxWidth);
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.

Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the plan, and example functions to understand the context, if needed.

## Phase 1: Implementation

### Task Structure

This function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). You must create ${w} sub-functions by spawning child agents.

**Before spawning**, define the parent function's input schema using EditInputSchema, and input_maps using AppendInputMap if any tasks will use mapped iteration. The sub-function specs you write must describe input schemas that are derivable from this parent input schema, so define these first.

1. Analyze ESSAY_TASKS.md and create a spec for each sub-function describing:
   - What it evaluates (purpose, not implementation details)
   - The input schema it expects
   - Whether it's scalar or vector
   - Key evaluation criteria

2. Use the SpawnFunctionAgents tool with an array of objects, each containing:
   - \`name\`: A short, descriptive name for the sub-function (used as directory name)
   - \`spec\`: The full spec text for the sub-function
   \`\`\`json
   [
     {"name": "humor-scorer", "spec": "Spec for humor scoring..."},
     {"name": "clarity-scorer", "spec": "Spec for clarity scoring..."}
   ]
   \`\`\`

3. Parse the result to get \`{name, owner, repository, commit}\` for each. Use ReadAgentFunction to read each spawned sub-function's \`function.json\`.

4. Create function tasks using AppendTask referencing those sub-functions:
   \`\`\`json
   {
     "type": "<scalar/vector>.function",
     "owner": "<owner>",
     "repository": "<repository>",
     "commit": "<commit>",
     "input": {"$starlark": "..."},
     "output": {"$starlark": "..."}
   }
   \`\`\`

5. Handle any errors in the spawn results

**Retrying Failed Sub-Functions**
If a sub-function fails (result contains \`{error: "..."}\`), call SpawnFunctionAgents again:
- Include only the failed entries and add \`"overwrite": true\` to each
- Example: \`[{"name": "clarity-scorer", "spec": "Updated spec...", "overwrite": true}]\`
- This deletes the existing \`agent_functions/clarity-scorer/\` directory and re-spawns the agent

**Reading Sub-Functions**
Use ListAgentFunctions and ReadAgentFunction to inspect spawned sub-functions.

### Function Definition
- Use the Edit* tools to define each function field
- Read the *Schema tools to understand what types are expected
- **Use Starlark expressions** (\`{"$starlark": "..."}\`) for most expressions - it's Python-like and more readable
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions
- Starlark example: \`{"$starlark": "input['items'][0]"}\`
- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)

### Expression Context
Expressions receive a single object with these fields:
- \`input\` - Always present, the function input
- \`map\` - Present in mapped tasks, the current map element
- \`output\` - Present in task output expressions, the raw task result (FunctionOutput, or array of FunctionOutputs if mapped)

### Example Inputs
- Use AppendExampleInput to add diverse test inputs (minimum 10, maximum 100)
- **Diversity in structure**: Include edge cases like empty arrays, single items, boundary values, missing optional fields, maximum lengths
- **Diversity in intended output**: Cover the full range of expected scores (low, medium, high quality inputs that should produce different outputs)
- **Multimodal content**: If your input schema uses multimodal types (image, video, audio, file), call ReadInputSchemaSchema first to understand the exact format for these types. Use bogus/placeholder URLs (e.g. \`"https://example.com/image.jpg"\`) — this is fine for testing.

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 2: Verify SPEC.md Compliance

Before finalizing, verify that everything adheres to SPEC.md:
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs match what SPEC.md describes
- If anything contradicts SPEC.md, fix it to match the spec
- **SPEC.md is the universal source of truth** - the final product must not contradict it

## Phase 3: Finalize

Once all tests pass and SPEC.md compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md is the universal source of truth** - never contradict it
- **No API key is needed for tests** - tests run against a local server
- **Prefer Starlark over JMESPath** - Starlark is more readable and powerful
`;
}

function buildVectorTasksPrompt(state: ToolState): string {
  const w = widthText(state.minWidth, state.maxWidth);
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.

Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the plan, and example functions to understand the context, if needed.

## Phase 1: Implementation

### Task Structure

This function must use **vector completion tasks** (type: \`vector.completion\`). Create ${w} inline vector completion tasks using AppendTask:
- Use \`map\` if a task needs to iterate over input items
- Each task's prompt and responses define what gets evaluated

### Function Definition
- Use the Edit* tools to define each function field
- Read the *Schema tools to understand what types are expected
- **Use Starlark expressions** (\`{"$starlark": "..."}\`) for most expressions - it's Python-like and more readable
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions
- Starlark example: \`{"$starlark": "input['items'][0]"}\`
- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)
- **Never use \`str()\` on multimodal content** (images, audio, video). Pass rich content directly via expressions so the model receives the actual media, not a stringified representation.

### Message and Response Content Format
- **Messages**: Always use array-of-parts format for message \`content\`, never plain strings.
  - Correct: \`{"role": "user", "content": [{"type": "text", "text": "What is the quality of this?"}]}\`
  - Wrong: \`{"role": "user", "content": "What is the quality of this?"}\`
- **Responses**: Always use array-of-parts format for each response, never plain strings.
  - Correct: \`[[{"type": "text", "text": "good"}], [{"type": "text", "text": "bad"}]]\`
  - Wrong: \`["good", "bad"]\`
- This ensures compiled tasks can carry multimodal content (images, audio, etc.) alongside text.

### Expression Context
Expressions receive a single object with these fields:
- \`input\` - Always present, the function input
- \`map\` - Present in mapped tasks, the current map element
- \`output\` - Present in task output expressions, the raw task result (VectorCompletionOutput, or array of VectorCompletionOutputs if mapped)

### Example Inputs
- Use AppendExampleInput to add diverse test inputs (minimum 10, maximum 100)
- **Diversity in structure**: Include edge cases like empty arrays, single items, boundary values, missing optional fields, maximum lengths
- **Diversity in intended output**: Cover the full range of expected scores (low, medium, high quality inputs that should produce different outputs)
- **Multimodal content**: If your input schema uses multimodal types (image, video, audio, file), call ReadInputSchemaSchema first to understand the exact format for these types. Use bogus/placeholder URLs (e.g. \`"https://example.com/image.jpg"\`) — this is fine for testing.

### Build and Test
- Fix issues and repeat until all tests pass

## Phase 2: Verify SPEC.md Compliance

Before finalizing, verify that everything adheres to SPEC.md:
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs match what SPEC.md describes
- If anything contradicts SPEC.md, fix it to match the spec
- **SPEC.md is the universal source of truth** - the final product must not contradict it

## Phase 3: Finalize

Once all tests pass and SPEC.md compliance is verified:
- Use the Submit tool with a commit message to validate, commit, and push
- If Submit fails, fix the issues it reports and try again

## Important Notes

- **SPEC.md is the universal source of truth** - never contradict it
- **No API key is needed for tests** - tests run against a local server
- **Prefer Starlark over JMESPath** - Starlark is more readable and powerful
`;
}

async function inventLoop(
  state: ToolState,
  log: LogFn,
  useFunctionTasks: boolean,
  sessionId?: string,
): Promise<string | undefined> {
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let lastFailureReasons: string[] = [];

  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Invent loop attempt ${attempt}/${maxAttempts}`);

    // Build tools list
    const tools = [
      ...getCommonTools(state),
      ...(useFunctionTasks ? getFunctionTasksTools(state) : []),
    ];
    const mcpServer = createSdkMcpServer({ name: "invent", tools });

    // Build the prompt - full on first attempt, short on retry
    let prompt: string;

    if (attempt === 1) {
      prompt = useFunctionTasks
        ? buildFunctionTasksPrompt(state)
        : buildVectorTasksPrompt(state);
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Use RunNetworkTests to test
2. Use Submit to validate, commit, and push
`;
    }

    sessionId = await consumeStream(
      query({
        prompt,
        options: {
          tools: [],
          mcpServers: { invent: mcpServer },
          allowedTools: ["mcp__invent__*"],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      }),
      log,
      sessionId,
    );

    // Validate and submit
    log("Running submit...");
    lastFailureReasons = [];
    const submitResult = await submit(
      "submit",
      state.submitApiBase,
      state.submitApiKey,
      {
        userName: state.gitUserName,
        userEmail: state.gitUserEmail,
      },
    );
    if (submitResult.ok) {
      success = true;
      log(`Success: Submitted commit ${submitResult.value}`);
    } else {
      lastFailureReasons.push(submitResult.error!);
      log(`Submit failed: ${submitResult.error}`);
    }
  }

  // If all attempts failed, reset to initial revision
  if (!success) {
    throw new Error("Invent loop failed after maximum attempts.");
  }

  return sessionId;
}

// Main entry point for inventing with function tasks (depth > 0)
export async function inventFunctionTasksMcp(
  state: ToolState,
  options: AgentOptions,
): Promise<void> {
  const log = options.log;

  log("=== Invent Loop: Creating new function (function tasks) ===");
  await inventLoop(state, log, true, options.sessionId);

  log("=== ObjectiveAI Function invention complete ===");
}

// Main entry point for inventing with vector tasks (depth === 0)
export async function inventVectorTasksMcp(
  state: ToolState,
  options: AgentOptions,
): Promise<void> {
  const log = options.log;

  log("=== Invent Loop: Creating new function (vector tasks) ===");
  await inventLoop(state, log, false, options.sessionId);

  log("=== ObjectiveAI Function invention complete ===");
}

// Unified entry point that selects variant based on depth
export async function inventMcp(
  state: ToolState,
  options: AgentOptions,
): Promise<void> {
  const depth = options.depth;
  if (depth === 0) {
    await inventVectorTasksMcp(state, options);
  } else {
    await inventFunctionTasksMcp(state, options);
  }
}
