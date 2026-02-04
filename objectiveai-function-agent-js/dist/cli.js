#!/usr/bin/env node
import './chunk-RWTUUBCP.js';
import './chunk-EZFATHYT.js';
import { prepare, createFileLogger, promptResources } from './chunk-JHZPOOBO.js';
import { __export } from './chunk-K3NQKI34.js';
import { query } from '@anthropic-ai/claude-agent-sdk';
import { existsSync, readFileSync, readdirSync } from 'fs';

// src/claude/index.ts
var claude_exports = {};
__export(claude_exports, {
  handleIssues: () => handleIssues,
  invent: () => invent,
  prepare: () => prepare
});
function getNextPlanIndex() {
  const plansDir = "plans";
  let nextPlanIndex = 1;
  if (existsSync(plansDir)) {
    const files = readdirSync(plansDir);
    const planNumbers = files.filter((f) => /^\d+\.md$/.test(f)).map((f) => parseInt(f.replace(".md", ""), 10)).filter((n) => !isNaN(n));
    if (planNumbers.length > 0) {
      nextPlanIndex = Math.max(...planNumbers) + 1;
    }
  }
  return nextPlanIndex;
}
function getPlanPath(index) {
  return `plans/${index}.md`;
}

// src/claude/invent.ts
async function inventLoop(log, sessionId) {
  const {
    getCurrentRevision,
    resetToRevision,
    hasUncommittedChanges,
    hasUntrackedFiles,
    checkoutSubmodule,
    pushOrCreateUpstream
  } = await import('./github-KGYY55IO.js');
  const { execSync } = await import('child_process');
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);
  const initialRevision = getCurrentRevision();
  const maxAttempts = 3;
  let attempt = 0;
  let success = false;
  let lastFailureReasons = [];
  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Invent loop attempt ${attempt}/${maxAttempts}`);
    let prompt;
    if (attempt === 1) {
      prompt = `${promptResources([
        "OBJECTIVEAI_INDEX.md",
        "SPEC.md",
        "ESSAY.md",
        "ESSAY_TASKS.md",
        "function/type.json",
        "function/tasks.json",
        "function/description.json",
        "function/input_schema.json",
        "function/input_maps.json",
        "function/output.json",
        "function/output_length.json",
        "function/input_split.json",
        "function/input_merge.json",
        "github/name.json",
        "github/description.json",
        "inputs.json",
        "serverLog.txt",
        "compiledTasks.json",
        "ts-node build.ts",
        "ts-node commitAndPush.ts <message>",
        "ts-node spawnFunctionAgents.ts <json_array>",
        "ts-node getSubFunctionCommits.ts",
        "ts-node installRustLogs.ts"
      ])}
You are inventing a new ObjectiveAI Function. Your goal is to complete the implementation, add example inputs, ensure all tests pass, and leave the repository in a clean state.

## Important: Schema References. Read schema definitions in objectiveai-js in order to understand what types should be contained by files within function/.

## Phase 1: Planning

Write your implementation plan to \`${planPath}\`. Include:
- The input schema structure and field descriptions
- Whether any input maps are needed for mapped task execution
- What the function definition will look like
- What expressions need to be written
- What test inputs will cover edge cases and diverse scenarios

## Phase 2: Implementation

Create a TODO list and execute each item:

### Task Structure Decision

Analyze ESSAY_TASKS.md to determine the task structure:

**Option A: Single Vector Completion Task**
If the function can be implemented with a single evaluation (mapped or unmapped):
- Create an inline vector completion task in \`function/tasks.json\`
- Use \`map\` if the task needs to iterate over input items
- The task's prompt and responses define what gets evaluated

**Option B: Multiple Sub-Functions**
If ESSAY_TASKS.md describes multiple distinct evaluations that each warrant their own function:
1. Create a spec for each sub-function describing:
   - What it evaluates (purpose, not implementation details)
   - The input schema it expects
   - Whether it's scalar or vector
   - Key evaluation criteria
2. Run \`ts-node spawnFunctionAgents.ts '<json_array_of_specs>'\`
   - Example: \`ts-node spawnFunctionAgents.ts '["Spec for task 0...", "Spec for task 1..."]'\`
3. Parse the output after \`=== SPAWN_RESULTS ===\` to get \`{owner, repository, commit}\` for each
4. Create function tasks in \`function/tasks.json\` referencing those sub-functions:
   \`\`\`json
   {
     "type": "scalar.function",
     "owner": "<owner>",
     "repository": "<repository>",
     "commit": "<commit>",
     "input": {"$starlark": "..."}
   }
   \`\`\`
5. Handle any errors in the spawn results

**Retrying Failed Sub-Functions**
If a sub-function fails (result contains \`{error: "..."}\`), you can retry specific indices:
- Pass \`null\` for indices that succeeded and should be skipped
- Example: \`ts-node spawnFunctionAgents.ts '[null, "Retry spec for task 1", null]'\`
- This deletes \`sub_functions/1/\` and re-spawns only that agent
- Results will show \`{skipped: true}\` for null indices

**Reading Sub-Functions**
After spawning, sub-functions are available in \`sub_functions/<index>/\`:
- Read their \`function.json\`, \`function/\` files, \`inputs.json\`, etc. to understand what was created
- Each sub-function is a complete ObjectiveAI function repository

**Getting Commit SHAs**
To retrieve the current commit SHA for each sub-function:
- Run \`ts-node getSubFunctionCommits.ts\`
- Parse the output after \`=== SUB_FUNCTION_COMMITS ===\` to get \`{index, owner, repository, commit, path}\` for each
- Use these values to update \`function/tasks.json\` with the correct references

### Function Definition
- Edit files in \`function/\` directory to define the function
- **Use Starlark expressions** (\`{"$starlark": "..."}\`) for most expressions - it's Python-like and more readable
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access expressions
- Starlark example: \`{"$starlark": "input['items'][0]"}\`
- JMESPath example: \`{"$jmespath": "input.name"}\` (simple field access only)

### Expression Context
Expressions receive a single object with these fields:
- \`input\` - Always present, the function input
- \`map\` - Present in mapped tasks, the current map element
- \`tasks\` - Present in output expressions, array of task results

### Test Inputs
- Edit \`inputs.json\` to add diverse test inputs (minimum 10, maximum 100)
- **Diversity in structure**: Include edge cases like empty arrays, single items, boundary values, missing optional fields, maximum lengths
- **Diversity in intended output**: Cover the full range of expected scores (low, medium, high quality inputs that should produce different outputs)

### Build and Test
- Run \`ts-node build.ts\` to compile function.json and execute tests
- If tests fail, read \`serverLog.txt\` and \`compiledTasks.json\` for error details
- Fix issues and repeat until all tests pass

### Debugging
- Read \`compiledTasks.json\` to see how expressions are compiled for each input
- If expression errors occur, check the Starlark/JMESPath syntax

### Rust Logging (Advanced Debugging)
If you need deeper debugging into the ObjectiveAI runtime:
1. Edit files in the objectiveai submodule to add logging:
   - \`objectiveai/objectiveai-rs/src/\` - Core Rust SDK
   - \`objectiveai/objectiveai-api/src/\` - API server logic
   - \`objectiveai/objectiveai-rs-wasm-js/src/\` - WASM bindings
2. Run \`ts-node installRustLogs.ts\` to rebuild the WASM with your changes
3. Run \`ts-node build.ts\` to test - logs will appear in \`serverLog.txt\`

## Phase 3: Verify SPEC.md Compliance

Before finalizing, verify that everything adheres to SPEC.md:
- Re-read SPEC.md carefully
- Ensure the function definition, inputs, and outputs match what SPEC.md describes
- If anything contradicts SPEC.md, fix it to match the spec
- **SPEC.md is the universal source of truth** - the final product must not contradict it

## Phase 4: Finalize

Once all tests pass and SPEC.md compliance is verified:
- Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
- Ensure there are no uncommitted changes or untracked files

## Important Notes

- **SPEC.md is the universal source of truth** - never contradict it
- **No API key is needed for tests** - tests run against a local server
- **Prefer Starlark over JMESPath** - Starlark is more readable and powerful
- **Only modify function/*.json files when necessary**:
  - If the build fails due to invalid/missing values
  - If a field is undefined and needs to be set
`;
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Run \`ts-node build.ts\` to compile and test
2. Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
`;
    }
    const stream = query({
      prompt,
      options: {
        allowedTools: [
          "Bash(ls*)",
          "Bash(cd)",
          "Bash(cat)",
          "Bash(diff)",
          "Bash(ts-node build.ts)",
          "Bash(npx ts-node build.ts)",
          "Bash(ts-node commitAndPush.ts *)",
          "Bash(npx ts-node commitAndPush.ts *)",
          "Bash(ts-node spawnFunctionAgents.ts *)",
          "Bash(npx ts-node spawnFunctionAgents.ts *)",
          "Bash(ts-node getSubFunctionCommits.ts)",
          "Bash(npx ts-node getSubFunctionCommits.ts)",
          "Bash(ts-node installRustLogs.ts)",
          "Bash(npx ts-node installRustLogs.ts)",
          "Glob",
          "Grep",
          "Read",
          "WebFetch",
          "WebSearch",
          "Edit(inputs.json)",
          "Edit(./inputs.json)",
          "Write(./inputs.json)",
          "Write(inputs.json)",
          "Edit(function/description.json)",
          "Edit(./function/description.json)",
          "Write(function/description.json)",
          "Write(./function/description.json)",
          "Edit(function/input_schema.json)",
          "Edit(./function/input_schema.json)",
          "Write(function/input_schema.json)",
          "Write(./function/input_schema.json)",
          "Edit(function/input_maps.json)",
          "Edit(./function/input_maps.json)",
          "Write(function/input_maps.json)",
          "Write(./function/input_maps.json)",
          "Edit(function/tasks.json)",
          "Edit(./function/tasks.json)",
          "Write(function/tasks.json)",
          "Write(./function/tasks.json)",
          "Edit(function/output.json)",
          "Edit(./function/output.json)",
          "Write(function/output.json)",
          "Write(./function/output.json)",
          "Edit(function/output_length.json)",
          "Edit(./function/output_length.json)",
          "Write(function/output_length.json)",
          "Write(./function/output_length.json)",
          "Edit(function/input_split.json)",
          "Edit(./function/input_split.json)",
          "Write(function/input_split.json)",
          "Write(./function/input_split.json)",
          "Edit(function/input_merge.json)",
          "Edit(./function/input_merge.json)",
          "Write(function/input_merge.json)",
          "Write(./function/input_merge.json)",
          "Edit(github/description.json)",
          "Edit(./github/description.json)",
          "Write(github/description.json)",
          "Write(./github/description.json)",
          "Edit(README.md)",
          "Edit(./README.md)",
          "Write(README.md)",
          "Write(./README.md)",
          `Edit(plans/${nextPlanIndex}.md)`,
          `Edit(./plans/${nextPlanIndex}.md)`,
          `Write(plans/${nextPlanIndex}.md)`,
          `Write(./plans/${nextPlanIndex}.md)`,
          "Edit(./objectiveai/objectiveai-api/src/**)",
          "Edit(objectiveai/objectiveai-api/src/**)",
          "Edit(./objectiveai/objectiveai-rs/src/**)",
          "Edit(objectiveai/objectiveai-rs/src/**)",
          "Edit(./objectiveai/objectiveai-rs-wasm-js/src/**)",
          "Edit(objectiveai/objectiveai-rs-wasm-js/src/**)"
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    log("Validating assistant's work...");
    log("Checking out objectiveai submodule changes...");
    checkoutSubmodule();
    log("Running build and tests...");
    let buildSuccess = false;
    try {
      execSync("ts-node build.ts", { stdio: "inherit" });
      buildSuccess = true;
    } catch {
      log("Build or tests failed.");
    }
    lastFailureReasons = [];
    if (!buildSuccess) {
      lastFailureReasons.push(
        "Build or tests failed. Read serverLog.txt and compiledTasks.json for details."
      );
      log("Failed: Build or tests failed.");
    }
    const hasChanges = hasUncommittedChanges() || hasUntrackedFiles();
    if (hasChanges) {
      lastFailureReasons.push(
        "There are uncommitted changes or untracked files. Commit them with ts-node commitAndPush.ts <message>."
      );
      log("Failed: There are uncommitted changes or untracked files.");
    }
    const descriptionPath = "github/description.json";
    const hasDescription = (() => {
      if (!existsSync(descriptionPath)) return false;
      let content = readFileSync(descriptionPath, "utf-8").trim();
      if (!content || content === "null") return false;
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.slice(1, -1);
      }
      return content.length > 0;
    })();
    if (!hasDescription) {
      lastFailureReasons.push(
        "github/description.json is empty. Write a description for the GitHub repository."
      );
      log("Failed: github/description.json is empty.");
    }
    const readmePath = "README.md";
    const hasReadme = existsSync(readmePath) && readFileSync(readmePath, "utf-8").trim().length > 0;
    if (!hasReadme) {
      lastFailureReasons.push(
        "README.md is empty. Write a README for the repository."
      );
      log("Failed: README.md is empty.");
    }
    if (lastFailureReasons.length === 0) {
      success = true;
      log("Success: All conditions met.");
    }
  }
  if (!success) {
    log("All attempts failed. Resetting to initial revision.");
    resetToRevision(initialRevision);
    throw new Error("Invent loop failed after maximum attempts.");
  }
  log("Pushing commits...");
  pushOrCreateUpstream();
  return sessionId;
}
async function invent(options = {}) {
  const { prepare: prepare2 } = await import('./prepare-S5T2TGXE.js');
  const log = options.log ?? createFileLogger().log;
  const sessionId = await prepare2({ ...options, log });
  log("=== Invent Loop: Creating new function ===");
  await inventLoop(log, sessionId);
  log("=== ObjectiveAI Function invention complete ===");
}
async function handleIssuesLoop(log, sessionId) {
  const {
    getCurrentRevision,
    resetToRevision,
    fetchOpenIssues,
    hasUncommittedChanges,
    hasUntrackedFiles,
    checkoutSubmodule,
    pushOrCreateUpstream,
    closeIssue
  } = await import('./github-KGYY55IO.js');
  const { execSync } = await import('child_process');
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);
  const initialRevision = getCurrentRevision();
  const maxAttempts = 3;
  let attempt = 0;
  let success = false;
  let lastFailureReasons = [];
  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Issue loop attempt ${attempt}/${maxAttempts}`);
    let prompt;
    if (attempt === 1) {
      prompt = `${promptResources([
        "OBJECTIVEAI_INDEX.md",
        "SPEC.md",
        "ESSAY.md",
        "ESSAY_TASKS.md",
        "function/type.json",
        "function/tasks.json",
        "function/description.json",
        "function/input_schema.json",
        "function/input_maps.json",
        "function/output.json",
        "function/output_length.json",
        "function/input_split.json",
        "function/input_merge.json",
        "github/name.json",
        "github/description.json",
        "inputs.json",
        "serverLog.txt",
        "compiledTasks.json",
        "function.json (available after ts-node build.ts)",
        "ts-node build.ts",
        "ts-node fetchOpenIssues.ts",
        "ts-node fetchClosedIssues.ts",
        "ts-node commentOnIssue.ts <number> <comment>",
        "ts-node closeIssue.ts <number>",
        "ts-node commitAndPush.ts <message>",
        "ts-node cloneSubFunctions.ts [--latest]",
        "ts-node installRustLogs.ts"
      ])}
You are maintaining an existing ObjectiveAI Function. There are open GitHub issues that need your attention. Your goal is to address these issues, ensure all tests pass, and leave the repository in a clean state.

**Important**: This function already exists and works. Do NOT reinvent or fundamentally redesign it. Focus only on addressing the specific issues raised.

## Phase 1: Understand the Function

First, read and understand the existing function:
- Read \`function.json\` to understand the current implementation
- Run \`ts-node build.ts\` to see if tests currently pass

## Phase 2: Review Issues

For each issue, determine:
- Is it valid and actionable?
- What specific changes are needed?
- Does it require modifying function definition, inputs, or both?

## Phase 3: Planning

Write your plan to \`${planPath}\`. Include:
- Summary of each issue
- Planned changes for each issue
- Any issues that are invalid and should be closed without changes

## Phase 4: Implementation

Address each valid issue:

### Making Changes
- Edit files in \`function/\` directory as needed
- Edit \`inputs.json\` if new test cases are needed
- **Use Starlark expressions** (\`{"$starlark": "..."}\`) for most expressions
- Only use JMESPath (\`{"$jmespath": "..."}\`) for very simple field access

### Build and Test
- Run \`ts-node build.ts\` to compile and test
- If tests fail, read \`serverLog.txt\` and \`compiledTasks.json\` for details
- Fix issues and repeat until all tests pass

### Inspecting Sub-Functions
If the function references sub-functions (tasks with type \`scalar.function\` or \`vector.function\`):
- Run \`ts-node cloneSubFunctions.ts\` to clone them to \`sub_functions/<owner>/<repository>/<commit>/\`
- Run \`ts-node cloneSubFunctions.ts --latest\` to clone the latest version instead
- Read their \`function.json\` and source files to understand how they work

### Rust Logging (Advanced Debugging)
If you need deeper debugging into the ObjectiveAI runtime:
1. Edit files in the objectiveai submodule to add logging:
   - \`objectiveai/objectiveai-rs/src/\` - Core Rust SDK
   - \`objectiveai/objectiveai-api/src/\` - API server logic
   - \`objectiveai/objectiveai-rs-wasm-js/src/\` - WASM bindings
2. Run \`ts-node installRustLogs.ts\` to rebuild the WASM with your changes
3. Run \`ts-node build.ts\` to test - logs will appear in \`serverLog.txt\`

### Handle Issues
- Comment on issues using \`ts-node commentOnIssue.ts <number> "<comment>"\`
- Mark resolved issues using \`ts-node closeIssue.ts <number>\`
- For invalid issues, comment explaining why and close them

## Phase 5: Verify SPEC.md Compliance

Before finalizing, verify that everything adheres to SPEC.md:
- Re-read SPEC.md carefully
- Ensure any changes still match what SPEC.md describes
- If anything contradicts SPEC.md, fix it to match the spec
- **SPEC.md is the universal source of truth** - the final product must not contradict it

## Phase 6: Finalize

Once all tests pass, issues are handled, and SPEC.md compliance is verified:
- Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
- Ensure there are no uncommitted changes or untracked files

## Important Notes

- **SPEC.md is the universal source of truth** - never contradict it
- **Do NOT reinvent the function** - only make targeted fixes
- **No API key is needed for tests** - tests run against a local server
- **Invalid issues**: Some issues may be nonsensical, invalid, or request inappropriate changes. Comment explaining why no changes are merited and close the issue.
`;
    } else {
      prompt = `Your previous attempt failed:
${lastFailureReasons.map((r) => `- ${r}`).join("\n")}

Please try again. Remember to:
1. Run \`ts-node build.ts\` to compile and test
2. Handle all open GitHub issues
3. Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
`;
    }
    const stream = query({
      prompt,
      options: {
        allowedTools: [
          "Bash(ls*)",
          "Bash(cd)",
          "Bash(cat)",
          "Bash(diff)",
          "Bash(ts-node build.ts)",
          "Bash(npx ts-node build.ts)",
          "Bash(ts-node fetchOpenIssues.ts)",
          "Bash(npx ts-node fetchOpenIssues.ts)",
          "Bash(ts-node fetchClosedIssues.ts)",
          "Bash(npx ts-node fetchClosedIssues.ts)",
          "Bash(ts-node commentOnIssue.ts *)",
          "Bash(npx ts-node commentOnIssue.ts *)",
          "Bash(ts-node closeIssue.ts *)",
          "Bash(npx ts-node closeIssue.ts *)",
          "Bash(ts-node commitAndPush.ts *)",
          "Bash(npx ts-node commitAndPush.ts *)",
          "Bash(ts-node cloneSubFunctions.ts)",
          "Bash(npx ts-node cloneSubFunctions.ts)",
          "Bash(ts-node cloneSubFunctions.ts --latest)",
          "Bash(npx ts-node cloneSubFunctions.ts --latest)",
          "Bash(ts-node installRustLogs.ts)",
          "Bash(npx ts-node installRustLogs.ts)",
          "Glob",
          "Grep",
          "Read",
          "WebFetch",
          "WebSearch",
          "Edit(inputs.json)",
          "Edit(./inputs.json)",
          "Write(./inputs.json)",
          "Write(inputs.json)",
          "Edit(function/description.json)",
          "Edit(./function/description.json)",
          "Write(function/description.json)",
          "Write(./function/description.json)",
          "Edit(function/input_schema.json)",
          "Edit(./function/input_schema.json)",
          "Write(function/input_schema.json)",
          "Write(./function/input_schema.json)",
          "Edit(function/input_maps.json)",
          "Edit(./function/input_maps.json)",
          "Write(function/input_maps.json)",
          "Write(./function/input_maps.json)",
          "Edit(function/tasks.json)",
          "Edit(./function/tasks.json)",
          "Write(function/tasks.json)",
          "Write(./function/tasks.json)",
          "Edit(function/output.json)",
          "Edit(./function/output.json)",
          "Write(function/output.json)",
          "Write(./function/output.json)",
          "Edit(function/output_length.json)",
          "Edit(./function/output_length.json)",
          "Write(function/output_length.json)",
          "Write(./function/output_length.json)",
          "Edit(function/input_split.json)",
          "Edit(./function/input_split.json)",
          "Write(function/input_split.json)",
          "Write(./function/input_split.json)",
          "Edit(function/input_merge.json)",
          "Edit(./function/input_merge.json)",
          "Write(function/input_merge.json)",
          "Write(./function/input_merge.json)",
          "Edit(github/description.json)",
          "Edit(./github/description.json)",
          "Write(github/description.json)",
          "Write(./github/description.json)",
          "Edit(README.md)",
          "Edit(./README.md)",
          "Write(README.md)",
          "Write(./README.md)",
          `Edit(plans/${nextPlanIndex}.md)`,
          `Edit(./plans/${nextPlanIndex}.md)`,
          `Write(plans/${nextPlanIndex}.md)`,
          `Write(./plans/${nextPlanIndex}.md)`,
          "Edit(./objectiveai/objectiveai-api/src/**)",
          "Edit(objectiveai/objectiveai-api/src/**)",
          "Edit(./objectiveai/objectiveai-rs/src/**)",
          "Edit(objectiveai/objectiveai-rs/src/**)",
          "Edit(./objectiveai/objectiveai-rs-wasm-js/src/**)",
          "Edit(objectiveai/objectiveai-rs-wasm-js/src/**)"
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId
      }
    });
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    log("Validating assistant's work...");
    log("Checking out objectiveai submodule changes...");
    checkoutSubmodule();
    log("Running build and tests...");
    let buildSuccess = false;
    try {
      execSync("ts-node build.ts", { stdio: "inherit" });
      buildSuccess = true;
    } catch {
      log("Build or tests failed.");
    }
    lastFailureReasons = [];
    if (!buildSuccess) {
      lastFailureReasons.push(
        "Build or tests failed. Read serverLog.txt and compiledTasks.json for details."
      );
      log("Failed: Build or tests failed.");
    }
    const resolvedIssuesPath2 = "resolvedIssues.json";
    let resolvedIssues = [];
    if (existsSync(resolvedIssuesPath2)) {
      resolvedIssues = JSON.parse(readFileSync(resolvedIssuesPath2, "utf-8"));
    }
    const openIssues = fetchOpenIssues();
    const unresolvedIssues = openIssues.filter(
      (issue) => !resolvedIssues.includes(issue.number)
    );
    if (unresolvedIssues.length > 0) {
      const nums = unresolvedIssues.map((i) => `#${i.number}`).join(", ");
      lastFailureReasons.push(
        `There are unresolved GitHub issues: ${nums}. Mark them resolved with ts-node closeIssue.ts <number>.`
      );
      log(`Failed: Unresolved issues: ${nums}`);
    }
    const hasChanges = hasUncommittedChanges() || hasUntrackedFiles();
    if (hasChanges) {
      lastFailureReasons.push(
        "There are uncommitted changes or untracked files. Commit them with ts-node commitAndPush.ts <message>."
      );
      log("Failed: There are uncommitted changes or untracked files.");
    }
    if (lastFailureReasons.length === 0) {
      success = true;
      log("Success: All conditions met.");
    }
  }
  if (!success) {
    log("All attempts failed. Resetting to initial revision.");
    resetToRevision(initialRevision);
    throw new Error("Issue loop failed after maximum attempts.");
  }
  log("Pushing commits...");
  pushOrCreateUpstream();
  const resolvedIssuesPath = "resolvedIssues.json";
  if (existsSync(resolvedIssuesPath)) {
    const resolvedIssues = JSON.parse(
      readFileSync(resolvedIssuesPath, "utf-8")
    );
    for (const issueNumber of resolvedIssues) {
      log(`Closing issue #${issueNumber}...`);
      try {
        closeIssue(issueNumber);
      } catch (err) {
        log(`Failed to close issue #${issueNumber}: ${err}`);
      }
    }
  }
  return sessionId;
}
async function handleIssues(options = {}) {
  const { prepare: prepare2 } = await import('./prepare-S5T2TGXE.js');
  const log = options.log ?? createFileLogger().log;
  const sessionId = await prepare2({ ...options, log });
  log("=== Issue Loop: Handling issues on existing function ===");
  await handleIssuesLoop(log, sessionId);
  log("=== ObjectiveAI Function issue handling complete ===");
}

// src/cli.ts
async function main() {
  const command = process.argv[2];
  const spec = process.argv[3];
  switch (command) {
    case "invent":
      await claude_exports.invent({ spec });
      break;
    case "handle-issues":
      await claude_exports.handleIssues({ spec });
      break;
    default:
      console.log("Usage: objectiveai-function-agent <command> [spec]");
      console.log("");
      console.log("Commands:");
      console.log("  invent         Create a new ObjectiveAI Function");
      console.log("  handle-issues  Handle GitHub issues on an existing function");
      console.log("");
      console.log("Options:");
      console.log("  [spec]         Optional spec string for SPEC.md");
      process.exit(1);
  }
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
