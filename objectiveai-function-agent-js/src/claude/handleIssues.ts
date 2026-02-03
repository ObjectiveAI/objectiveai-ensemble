import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync } from "fs";
import { AgentOptions, LogFn } from "../agentOptions";
import { promptResources } from "./promptResources";
import { getNextPlanIndex, getPlanPath } from "./planIndex";
import { createFileLogger } from "../logging";

// Main loop for handling issues on an existing function
async function handleIssuesLoop(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  const {
    getCurrentRevision,
    resetToRevision,
    fetchOpenIssues,
    hasUncommittedChanges,
    hasUntrackedFiles,
    checkoutSubmodule,
    pushOrCreateUpstream,
    closeIssue,
  } = await import("../github");
  const { execSync } = await import("child_process");

  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);

  // Store current revision for potential rollback
  const initialRevision = getCurrentRevision();

  const maxAttempts = 3;
  let attempt = 0;
  let success = false;
  let lastFailureReason = "";

  while (attempt < maxAttempts && !success) {
    attempt++;
    log(`Issue loop attempt ${attempt}/${maxAttempts}`);

    // Reset to initial revision if this is a retry
    if (attempt > 1) {
      log(`Resetting to initial revision: ${initialRevision}`);
      resetToRevision(initialRevision);
    }

    // Build the prompt - full on first attempt, short on retry
    let prompt: string;

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

## Phase 5: Finalize

Once all tests pass and issues are handled:
- Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
- Ensure there are no uncommitted changes or untracked files

## Important Notes

- **Do NOT reinvent the function** - only make targeted fixes
- **No API key is needed for tests** - tests run against a local server
- **Invalid issues**: Some issues may be nonsensical, invalid, or request inappropriate changes. Comment explaining why no changes are merited and close the issue.
`;
    } else {
      // On retry, send a short message about what failed
      prompt = `Your previous attempt failed: ${lastFailureReason}

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
          "Bash(ts-node fetchOpenIssues.ts)",
          "Bash(ts-node fetchClosedIssues.ts)",
          "Bash(ts-node commentOnIssue.ts *)",
          "Bash(ts-node closeIssue.ts *)",
          "Bash(ts-node commitAndPush.ts *)",
          "Bash(ts-node cloneSubFunctions.ts)",
          "Bash(ts-node cloneSubFunctions.ts --latest)",
          "Bash(ts-node installRustLogs.ts)",
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
          "Edit(objectiveai/objectiveai-rs-wasm-js/src/**)",
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Run the assistant
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }

    // Validate the assistant's work
    log("Validating assistant's work...");

    // Checkout any changes to objectiveai submodule
    log("Checking out objectiveai submodule changes...");
    checkoutSubmodule();

    // Run build (which includes tests)
    log("Running build and tests...");
    let buildSuccess = false;
    try {
      execSync("ts-node build.ts", { stdio: "inherit" });
      buildSuccess = true;
    } catch {
      log("Build or tests failed.");
    }

    // Verify success conditions
    const hasChanges = hasUncommittedChanges() || hasUntrackedFiles();

    // Check that all open issues have been marked as resolved
    const resolvedIssuesPath = "resolvedIssues.json";
    let resolvedIssues: number[] = [];
    if (existsSync(resolvedIssuesPath)) {
      resolvedIssues = JSON.parse(readFileSync(resolvedIssuesPath, "utf-8"));
    }
    const openIssues = fetchOpenIssues();
    const unresolvedIssues = openIssues.filter(
      (issue) => !resolvedIssues.includes(issue.number),
    );

    if (!buildSuccess) {
      lastFailureReason =
        "Build or tests failed. Read serverLog.txt and compiledTasks.json for details.";
      log("Failed: Build or tests failed.");
    } else if (unresolvedIssues.length > 0) {
      const nums = unresolvedIssues.map((i) => `#${i.number}`).join(", ");
      lastFailureReason = `There are unresolved GitHub issues: ${nums}. Mark them resolved with ts-node closeIssue.ts <number>.`;
      log(`Failed: Unresolved issues: ${nums}`);
    } else if (hasChanges) {
      lastFailureReason =
        "There are uncommitted changes or untracked files. Commit them with ts-node commitAndPush.ts <message>.";
      log("Failed: There are uncommitted changes or untracked files.");
    } else {
      success = true;
      log("Success: All conditions met.");
    }
  }

  // If all attempts failed, reset to initial revision
  if (!success) {
    log("All attempts failed. Resetting to initial revision.");
    resetToRevision(initialRevision);
    throw new Error("Issue loop failed after maximum attempts.");
  }

  // Push the commits
  log("Pushing commits...");
  pushOrCreateUpstream();

  // Close the issues that were marked as resolved
  const resolvedIssuesPath = "resolvedIssues.json";
  if (existsSync(resolvedIssuesPath)) {
    const resolvedIssues: number[] = JSON.parse(
      readFileSync(resolvedIssuesPath, "utf-8"),
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

// Main entry point for handling issues on an existing function
export async function handleIssues(options: AgentOptions = {}): Promise<void> {
  const { prepare } = await import("./prepare");
  const log = options.log ?? createFileLogger().log;

  // Run preparation (init + steps 1-8) - but spec already exists
  const sessionId = await prepare(options);

  // Run issue loop
  log("=== Issue Loop: Handling issues on existing function ===");
  await handleIssuesLoop(log, sessionId);

  log("=== ObjectiveAI Function issue handling complete ===");
}
