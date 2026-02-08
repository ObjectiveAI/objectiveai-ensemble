import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { AgentOptions, LogFn } from "../../agentOptions";
import { submit } from "../../tools/submit";
import { createFileLogger, consumeStream } from "../../logging";
import { getNextPlanIndex } from "../planIndex";

// Tools - read-only context
import { ReadSpec } from "../../tools/claude/spec";
import { ReadName } from "../../tools/claude/name";
import { ReadEssay } from "../../tools/claude/essay";
import { ReadEssayTasks } from "../../tools/claude/essayTasks";
import {
  ListExampleFunctions,
  ReadExampleFunction,
} from "../../tools/claude/exampleFunctions";

// Tools - expression params
import {
  ReadInputParamSchema,
  ReadMapParamSchema,
  ReadOutputParamSchema,
} from "../../tools/claude/expressionParams";

// Tools - function field CRUD
import {
  ReadFunction,
  ReadFunctionSchema,
  CheckFunction,
} from "../../tools/claude/function";
import {
  ReadType,
  ReadTypeSchema,
  EditType,
  CheckType,
} from "../../tools/claude/type";
import {
  ReadDescription,
  ReadDescriptionSchema,
  EditDescription,
  CheckDescription,
} from "../../tools/claude/description";
import {
  ReadInputSchema,
  ReadInputSchemaSchema,
  EditInputSchema,
  CheckInputSchema,
} from "../../tools/claude/inputSchema";
import {
  ReadInputMaps,
  ReadInputMapsSchema,
  EditInputMaps,
  CheckInputMaps,
} from "../../tools/claude/inputMaps";
import {
  ReadOutputLength,
  ReadOutputLengthSchema,
  EditOutputLength,
  CheckOutputLength,
  DelOutputLength,
} from "../../tools/claude/outputLength";
import {
  ReadInputSplit,
  ReadInputSplitSchema,
  EditInputSplit,
  CheckInputSplit,
  DelInputSplit,
} from "../../tools/claude/inputSplit";
import {
  ReadInputMerge,
  ReadInputMergeSchema,
  EditInputMerge,
  CheckInputMerge,
  DelInputMerge,
} from "../../tools/claude/inputMerge";
import {
  ReadTasks,
  ReadTasksSchema,
  AppendTask,
  EditTask,
  DelTask,
  CheckTasks,
} from "../../tools/claude/tasks";

// Tools - example inputs
import {
  ReadExampleInputs,
  ReadExampleInputsSchema,
  AppendExampleInput,
  EditExampleInput,
  DelExampleInput,
  CheckExampleInputs,
} from "../../tools/claude/inputs";

// Tools - plan
import { makeReadPlan } from "../../tools/claude/plan";

// Tools - network tests
import {
  makeRunNetworkTests,
  ReadDefaultNetworkTest,
  ReadSwissSystemNetworkTest,
} from "../../tools/claude/networkTests";

// Tools - readme
import { ReadReadme, WriteReadme } from "../../tools/claude/readme";

// Tools - submit
import { makeSubmit } from "../../tools/claude/submit";

// Tools - agent functions (for function tasks variant)
import { makeSpawnFunctionAgents } from "../../tools/claude/spawnFunctionAgents";
import {
  ListAgentFunctions,
  ReadAgentFunction,
} from "../../tools/claude/agentFunctions";

// Common tools shared by both variants
function getCommonTools(planIndex: number, apiBase?: string, apiKey?: string) {
  return [
    // Core Context
    ReadSpec,
    ReadName,
    ReadEssay,
    ReadEssayTasks,
    makeReadPlan(planIndex),
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,

    // Function
    ReadFunction,
    CheckFunction,
    ReadType,
    ReadTypeSchema,
    EditType,
    CheckType,
    ReadDescription,
    ReadDescriptionSchema,
    EditDescription,
    CheckDescription,
    ReadInputSchema,
    ReadInputSchemaSchema,
    EditInputSchema,
    CheckInputSchema,
    ReadInputMaps,
    ReadInputMapsSchema,
    EditInputMaps,
    CheckInputMaps,
    ReadOutputLength,
    ReadOutputLengthSchema,
    EditOutputLength,
    DelOutputLength,
    CheckOutputLength,
    ReadInputSplit,
    ReadInputSplitSchema,
    EditInputSplit,
    DelInputSplit,
    CheckInputSplit,
    ReadInputMerge,
    ReadInputMergeSchema,
    EditInputMerge,
    DelInputMerge,
    CheckInputMerge,
    ReadTasks,
    ReadTasksSchema,
    AppendTask,
    EditTask,
    DelTask,
    CheckTasks,

    // Expression params
    ReadInputParamSchema,
    ReadMapParamSchema,
    ReadOutputParamSchema,

    // Example inputs
    ReadExampleInputs,
    ReadExampleInputsSchema,
    AppendExampleInput,
    EditExampleInput,
    DelExampleInput,
    CheckExampleInputs,

    // README
    ReadReadme,
    WriteReadme,

    // Network tests
    makeRunNetworkTests(apiBase, apiKey),
    ReadDefaultNetworkTest,
    ReadSwissSystemNetworkTest,

    // Submit
    makeSubmit(apiBase, apiKey),
  ];
}

// Additional tools for function tasks variant (sub-function spawning)
function getFunctionTasksTools(apiBase?: string, apiKey?: string) {
  return [makeSpawnFunctionAgents(apiBase, apiKey), ListAgentFunctions, ReadAgentFunction];
}

function buildFunctionTasksPrompt(): string {
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.

Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the plan, and example functions to understand the context.

## Phase 1: Implementation

### Task Structure

This function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). You must create **at least 2 sub-functions** by spawning child agents:

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

3. Parse the result to get \`{name, owner, repository, commit}\` for each

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

function buildVectorTasksPrompt(): string {
  return `You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and submit the result.

Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the plan, and example functions to understand the context.

## Phase 1: Implementation

### Task Structure

This function must use **vector completion tasks** (type: \`vector.completion\`). Create 1 or more inline vector completion tasks using AppendTask:
- Use \`map\` if a task needs to iterate over input items
- Each task's prompt and responses define what gets evaluated

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
  log: LogFn,
  useFunctionTasks: boolean,
  sessionId?: string,
  apiBase?: string,
  apiKey?: string,
): Promise<string | undefined> {
  const nextPlanIndex = getNextPlanIndex();
  const maxAttempts = 5;
  let attempt = 0;
  let success = false;
  let lastFailureReasons: string[] = [];

  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Invent loop attempt ${attempt}/${maxAttempts}`);

    // Build tools list
    const tools = [
      ...getCommonTools(nextPlanIndex, apiBase, apiKey),
      ...(useFunctionTasks ? getFunctionTasksTools(apiBase, apiKey) : []),
    ];
    const mcpServer = createSdkMcpServer({ name: "invent", tools });

    // Build the prompt - full on first attempt, short on retry
    let prompt: string;

    if (attempt === 1) {
      prompt = useFunctionTasks
        ? buildFunctionTasksPrompt()
        : buildVectorTasksPrompt();
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
    const submitResult = await submit("submit", apiBase, apiKey);
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
  options: AgentOptions = {},
): Promise<void> {
  const log = options.log ?? createFileLogger().log;

  log("=== Invent Loop: Creating new function (function tasks) ===");
  await inventLoop(log, true, options.sessionId, options.apiBase, options.apiKey);

  log("=== ObjectiveAI Function invention complete ===");
}

// Main entry point for inventing with vector tasks (depth === 0)
export async function inventVectorTasksMcp(
  options: AgentOptions = {},
): Promise<void> {
  const log = options.log ?? createFileLogger().log;

  log("=== Invent Loop: Creating new function (vector tasks) ===");
  await inventLoop(log, false, options.sessionId, options.apiBase, options.apiKey);

  log("=== ObjectiveAI Function invention complete ===");
}

// Unified entry point that selects variant based on depth
export async function inventMcp(options: AgentOptions = {}): Promise<void> {
  const depth = options.depth ?? 0;
  if (depth === 0) {
    await inventVectorTasksMcp(options);
  } else {
    await inventFunctionTasksMcp(options);
  }
}
