import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";

// Step 1 - Learn about ObjectiveAI and ObjectiveAI Functions
export async function learnSubmodule(
  sessionId?: string,
): Promise<string | undefined> {
  // Check if OBJECTIVEAI_INDEX.md exists and is non-empty
  const indexPath = "OBJECTIVEAI_INDEX.md";
  const indexNonEmpty = (() => {
    if (!existsSync(indexPath)) {
      writeFileSync(indexPath, "");
      return false;
    }
    const content = readFileSync(indexPath, "utf-8").trim();
    return content.length > 0;
  })();

  // Query
  const stream = (() => {
    if (indexNonEmpty) {
      return query({
        prompt:
          "You are an ObjectiveAI Function Agent, and you will be building an ObjectiveAI Function." +
          " Learn about ObjectiveAI and ObjectiveAI Functions." +
          " Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are." +
          " First, read OBJECTIVEAI_INDEX.md." +
          " Then, read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    } else {
      return query({
        prompt:
          "You are an ObjectiveAI Function Agent, and you will be building an ObjectiveAI Function." +
          " Learn about ObjectiveAI and ObjectiveAI Functions." +
          " Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are." +
          " Read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to." +
          " Create OBJECTIVEAI_INDEX.md with links to files and your learnings.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(OBJECTIVEAI_INDEX.md)",
            "Edit(./OBJECTIVEAI_INDEX.md)",
            "Write(OBJECTIVEAI_INDEX.md)",
            "Write(./OBJECTIVEAI_INDEX.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent learns about ObjectiveAI and ObjectiveAI Functions
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    console.log(message);
  }

  // Ensure that learning produced an index (or pre-existing index is valid)
  let retry = 1;
  while (!existsSync(indexPath) || !readFileSync(indexPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("OBJECTIVEAI_INDEX.md is empty after learn phase");
    } else {
      const stream = query({
        prompt:
          "OBJECTIVEAI_INDEX.md is empty after your learn phase." +
          " Create OBJECTIVEAI_INDEX.md with links to files and your learnings about ObjectiveAI and ObjectiveAI Functions.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(OBJECTIVEAI_INDEX.md)",
            "Edit(./OBJECTIVEAI_INDEX.md)",
            "Write(OBJECTIVEAI_INDEX.md)",
            "Write(./OBJECTIVEAI_INDEX.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries learning about ObjectiveAI and ObjectiveAI Functions
      for await (const message of stream) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        console.log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 2 - Learn from examples
export async function learnExamples(
  sessionId?: string,
): Promise<string | undefined> {
  // Query
  const stream = query({
    prompt:
      "1. Read `examples/examples.json` to see the root function-profile pairs\n" +
      "2. For each pair, open and study:\n" +
      "- `examples/functions/{owner}/{repository}/{commit}/function.json`\n" +
      "- `examples/profiles/{owner}/{repository}/{commit}/profile.json`\n" +
      "3. If any function contains sub-tasks, open those sub-function files\n" +
      "4. If any profile contains sub-profiles, open those sub-profile files",
    options: {
      allowedTools: [
        "Bash(ls*)",
        "Bash(cd)",
        "Bash(cat)",
        "Bash(diff)",
        "Glob",
        "Grep",
        "Read",
        "WebFetch",
        "WebSearch",
      ],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId,
    },
  });

  // Agent learns from examples
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    console.log(message);
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 3 - Read or Create SPEC.md
export async function spec(sessionId?: string): Promise<string | undefined> {
  // Check if SPEC.md exists and is non-empty
  const specPath = "SPEC.md";
  const specNonEmpty = (() => {
    if (!existsSync(specPath)) {
      writeFileSync(specPath, "");
      return false;
    }
    const content = readFileSync(specPath, "utf-8").trim();
    return content.length > 0;
  })();

  // Query
  const stream = (() => {
    if (specNonEmpty) {
      return query({
        prompt:
          "Read SPEC.md to understand the ObjectiveAI Function specification.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    } else {
      return query({
        prompt:
          "Create SPEC.md specifying the ObjectiveAI Function to be built." +
          " Think deeply about what function to invent:\n" +
          "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
          "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
          "Be creative and describe a function with plain language.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(SPEC.md)",
            "Edit(./SPEC.md)",
            "Write(SPEC.md)",
            "Write(./SPEC.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent reads or creates SPEC.md
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    console.log(message);
  }

  // Ensure that SPEC.md is non-empty
  let retry = 1;
  while (!existsSync(specPath) || !readFileSync(specPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    } else {
      const stream = query({
        prompt:
          "SPEC.md is empty after your spec phase." +
          " Create SPEC.md specifying the ObjectiveAI Function to be built." +
          " Think deeply about what function to invent:\n" +
          "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
          "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
          "Be creative and describe a function with plain language.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(SPEC.md)",
            "Edit(./SPEC.md)",
            "Write(SPEC.md)",
            "Write(./SPEC.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries SPEC.md creation
      for await (const message of stream) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        console.log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 4 - Create function/type.json (if needed)
export async function createFunctionTypeJson(
  sessionId?: string,
): Promise<string | undefined> {
  // Check if function/type.json exists and is a valid function type
  const functionTypePath = "function/type.json";
  const functionTypeValid = () => {
    if (!existsSync(functionTypePath)) {
      return false;
    }
    try {
      const content = readFileSync(functionTypePath, "utf-8");
      const parsed = JSON.parse(content);
      return (
        parsed.type === "scalar.function" || parsed.type === "vector.function"
      );
    } catch {
      return false;
    }
  };

  // Query
  if (!functionTypeValid()) {
    const stream = query({
      prompt:
        promptResources(["OBJECTIVEAI_INDEX.md", "SPEC.md"]) +
        'Create function/type.json specifying the function type ("scalar.function" or "vector.function").',
      options: {
        allowedTools: [
          "Bash(ls*)",
          "Bash(cd)",
          "Bash(cat)",
          "Bash(diff)",
          "Glob",
          "Grep",
          "Read",
          "WebFetch",
          "WebSearch",
          "Edit(function/type.json)",
          "Edit(./function/type.json)",
          "Write(function/type.json)",
          "Write(./function/type.json)",
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Agent creates function/type.json
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      console.log(message);
    }
  }

  let retry = 1;
  while (!functionTypeValid()) {
    if (retry > 10) {
      throw new Error(
        "function/type.json is invalid after createFunctionTypeJson phase",
      );
    }
    const stream = query({
      prompt:
        "function/type.json is invalid after your createFunctionTypeJson phase." +
        ' Create function/type.json specifying the function type ("scalar.function" or "vector.function") based on SPEC.md.',
      options: {
        allowedTools: [
          "Bash(ls*)",
          "Bash(cd)",
          "Bash(cat)",
          "Bash(diff)",
          "Glob",
          "Grep",
          "Read",
          "WebFetch",
          "WebSearch",
          "Edit(function/type.json)",
          "Edit(./function/type.json)",
          "Write(function/type.json)",
          "Write(./function/type.json)",
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Agent retries function/type.json creation
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      console.log(message);
    }
    retry += 1;
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 5 - Create github/name.json (if needed)
export async function createGitHubNameJson(
  sessionId?: string,
): Promise<string | undefined> {
  // Check if github/name.json exists and is non-empty
  const githubNamePath = "github/name.json";
  const githubNameNonEmpty = () => {
    if (!existsSync(githubNamePath)) {
      writeFileSync(githubNamePath, "");
      return false;
    }
    const content = readFileSync(githubNamePath, "utf-8").trim();
    return content.length > 0;
  };

  // Query
  if (!githubNameNonEmpty()) {
    const stream = query({
      prompt:
        promptResources([
          "OBJECTIVEAI_INDEX.md",
          "SPEC.md",
          "function/type.json",
        ]) +
        "Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n" +
        '**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:' +
        "- Use all lowercase\n" +
        "- Use dashes (`-`) to separate words if there's more than one",
      options: {
        allowedTools: [
          "Bash(ls*)",
          "Bash(cd)",
          "Bash(cat)",
          "Bash(diff)",
          "Glob",
          "Grep",
          "Read",
          "WebFetch",
          "WebSearch",
          "Edit(github/name.json)",
          "Edit(./github/name.json)",
          "Write(github/name.json)",
          "Write(./github/name.json)",
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Agent creates github/name.json
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      console.log(message);
    }
  }

  let retry = 1;
  while (!githubNameNonEmpty()) {
    if (retry > 10) {
      throw new Error(
        "github/name.json is empty after createGitHubNameJson phase",
      );
    }
    const stream = query({
      prompt:
        "github/name.json is empty after your createGitHubNameJson phase." +
        " Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n" +
        '**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n' +
        "- Use all lowercase\n" +
        "- Use dashes (`-`) to separate words if there's more than one",
      options: {
        allowedTools: [
          "Bash(ls*)",
          "Bash(cd)",
          "Bash(cat)",
          "Bash(diff)",
          "Glob",
          "Grep",
          "Read",
          "WebFetch",
          "WebSearch",
          "Edit(github/name.json)",
          "Edit(./github/name.json)",
          "Write(github/name.json)",
          "Write(./github/name.json)",
        ],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Agent retries github/name.json creation
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      console.log(message);
    }
    retry += 1;
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 6 - Read or Create ESSAY.md
export async function essay(sessionId?: string): Promise<string | undefined> {
  // Check if ESSAY.md exists and is non-empty
  const essayPath = "ESSAY.md";
  const essayNonEmpty = (() => {
    if (!existsSync(essayPath)) {
      writeFileSync(essayPath, "");
      return false;
    }
    const content = readFileSync(essayPath, "utf-8").trim();
    return content.length > 0;
  })();

  // Query
  const stream = (() => {
    if (essayNonEmpty) {
      return query({
        prompt: "Read ESSAY.md to understand the ObjectiveAI Function essay.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    } else {
      return query({
        prompt:
          promptResources([
            "OBJECTIVEAI_INDEX.md",
            "SPEC.md",
            "function/type.json",
            "github/name.json",
          ]) +
          "Create ESSAY.md describing the ObjectiveAI Function you are building." +
          " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
          " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
          " This essay will guide the development of the function and underpins its philosophy.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(ESSAY.md)",
            "Edit(./ESSAY.md)",
            "Write(ESSAY.md)",
            "Write(./ESSAY.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent reads or creates ESSAY.md
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    console.log(message);
  }

  // Ensure that ESSAY.md is non-empty
  let retry = 1;
  while (!existsSync(essayPath) || !readFileSync(essayPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    } else {
      const stream = query({
        prompt:
          "ESSAY.md is empty after your essay phase." +
          " Create ESSAY.md describing the ObjectiveAI Function you are building." +
          " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
          " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
          " This essay will guide the development of the function and underpins its philosophy.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(ESSAY.md)",
            "Edit(./ESSAY.md)",
            "Write(ESSAY.md)",
            "Write(./ESSAY.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries ESSAY.md creation
      for await (const message of stream) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        console.log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 7 - Read or Create ESSAY_TASKS.md
export async function essayTasks(
  sessionId?: string,
): Promise<string | undefined> {
  // Check if ESSAY_TASKS.md exists and is non-empty
  const essayTasksPath = "ESSAY_TASKS.md";
  const essayTasksNonEmpty = (() => {
    if (!existsSync(essayTasksPath)) {
      writeFileSync(essayTasksPath, "");
      return false;
    }
    const content = readFileSync(essayTasksPath, "utf-8").trim();
    return content.length > 0;
  })();

  // Query
  const stream = (() => {
    if (essayTasksNonEmpty) {
      return query({
        prompt: "Read ESSAY_TASKS.md to understand the Function's tasks.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    } else {
      return query({
        prompt:
          promptResources([
            "OBJECTIVEAI_INDEX.md",
            "SPEC.md",
            "function/type.json",
            "github/name.json",
            "ESSAY.md",
          ]) +
          "Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
          " Each task is a plain language description of a task which will go into the function's `tasks` array.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(ESSAY_TASKS.md)",
            "Edit(./ESSAY_TASKS.md)",
            "Write(ESSAY_TASKS.md)",
            "Write(./ESSAY_TASKS.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent reads or creates ESSAY_TASKS.md
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    console.log(message);
  }

  // Ensure that ESSAY_TASKS.md is non-empty
  let retry = 1;
  while (
    !existsSync(essayTasksPath) ||
    !readFileSync(essayTasksPath, "utf-8").trim()
  ) {
    if (retry > 3) {
      throw new Error("ESSAY_TASKS.md is empty after essayTasks phase");
    } else {
      const stream = query({
        prompt:
          "ESSAY_TASKS.md is empty after your essayTasks phase." +
          " Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
          " Each task is a plain language description of a task which will go into the function's `tasks` array.",
        options: {
          allowedTools: [
            "Bash(ls*)",
            "Bash(cd)",
            "Bash(cat)",
            "Bash(diff)",
            "Glob",
            "Grep",
            "Read",
            "WebFetch",
            "WebSearch",
            "Edit(ESSAY_TASKS.md)",
            "Edit(./ESSAY_TASKS.md)",
            "Write(ESSAY_TASKS.md)",
            "Write(./ESSAY_TASKS.md)",
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries ESSAY_TASKS.md creation
      for await (const message of stream) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        console.log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 8 - Handle open issues (optional)
export async function handleOpenIssues(
  sessionId?: string,
): Promise<string | undefined> {
  // Check if there are open issues
  const { hasOpenIssues } = await import("../github");
  if (!hasOpenIssues()) {
    return sessionId;
  }

  // Query - have the assistant fetch and handle open issues
  const stream = query({
    prompt:
      promptResources([
        "OBJECTIVEAI_INDEX.md",
        "SPEC.md",
        "function/type.json",
        "github/name.json",
        "ESSAY.md",
        "ESSAY_TASKS.md",
        "ts-node fetchOpenIssues.ts",
      ]) +
      "There are open issues on this repository that need your attention.\n" +
      "1. Run `ts-node fetchOpenIssues.ts` to see all open issues with their comments.\n" +
      "2. Review each issue.",
    options: {
      allowedTools: [
        "Bash(ls*)",
        "Bash(cd)",
        "Bash(cat)",
        "Bash(diff)",
        "Bash(ts-node fetchOpenIssues.ts)",
        "Glob",
        "Grep",
        "Read",
        "WebFetch",
        "WebSearch",
      ],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId,
    },
  });

  // Agent handles open issues
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    console.log(message);
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 9 - Main Loop
export async function mainLoop(
  sessionId?: string,
): Promise<string | undefined> {
  const {
    getCurrentRevision,
    resetToRevision,
    hasOpenIssues,
    hasUncommittedChanges,
    hasUntrackedFiles,
    checkoutSubmodule,
    pushOrCreateUpstream,
    closeIssue,
  } = await import("../github");
  const { execSync } = await import("child_process");

  // Find the next plan index
  const plansDir = "plans";
  let nextPlanIndex = 1;

  if (existsSync(plansDir)) {
    const files = readdirSync(plansDir);
    const planNumbers = files
      .filter((f) => /^\d+\.md$/.test(f))
      .map((f) => parseInt(f.replace(".md", ""), 10))
      .filter((n) => !isNaN(n));

    if (planNumbers.length > 0) {
      nextPlanIndex = Math.max(...planNumbers) + 1;
    }
  }

  const planPath = `${plansDir}/${nextPlanIndex}.md`;

  // Store current revision for potential rollback
  const initialRevision = getCurrentRevision();

  const maxAttempts = 3;
  let attempt = 0;
  let success = false;
  let lastFailureReason = "";

  while (attempt < maxAttempts && !success) {
    attempt++;
    console.log(`Main loop attempt ${attempt}/${maxAttempts}`);

    // Reset to initial revision if this is a retry
    if (attempt > 1) {
      console.log(`Resetting to initial revision: ${initialRevision}`);
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
      ])}
You are implementing an ObjectiveAI Function. Your goal is to complete the implementation, ensure all tests pass, and leave the repository in a clean state.

## Important: Schema References

The \`objectiveai\` submodule contains all the schemas and type definitions you need:
- \`objectiveai/objectiveai-rs/src/\` - Rust SDK with data structures and validation
- \`objectiveai/objectiveai-js/src/\` - TypeScript SDK with schemas
- \`objectiveai/objectiveai-js/src/functions/\` - Function, Task, and Profile schemas
- \`objectiveai/objectiveai-js/src/functions/expression/\` - Expression input/output schemas
- \`objectiveai/objectiveai-rs/src/functions/expression/runtime.rs\` - Custom expression functions

Read these files to understand the valid schemas for functions, tasks, expressions, and inputs.

## Phase 1: Validation

First, read and validate all function definition files in the \`function/\` directory and \`inputs.json\`.
- Verify the input schema is valid JSON Schema
- Check that tasks are properly defined
- Validate that inputs.json contains at least 10 diverse test inputs

## Phase 2: Planning

Write your implementation plan to \`${planPath}\`. Include:
- What changes need to be made to the function definition (if any)
- What expressions need to be written or fixed (if any)
- What additional test inputs might be needed (if any)
- Any issues you've identified (if any)

## Phase 3: Implementation

Create a TODO list and execute each item:

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
- Include edge cases: empty arrays, single items, boundary values
- Vary quality levels across the full range

### Build and Test
- Run \`ts-node build.ts\` to compile function.json and execute tests
- If tests fail, read \`serverLog.txt\` and \`compiledTasks.json\` for error details
- Fix issues and repeat until all tests pass

### Debugging
- Read \`compiledTasks.json\` to see how expressions are compiled for each input
- If expression errors occur, check the Starlark/JMESPath syntax
- You may add Rust logging to objectiveai submodule files for deeper debugging
- After adding Rust logs, run \`ts-node installRustLogs.ts\` before \`ts-node build.ts\`

## Phase 4: Handle Open Issues

If there are open GitHub issues:
- Run \`ts-node fetchOpenIssues.ts\` to see all issues with comments
- Address each issue by making the requested changes
- Comment on issues using \`ts-node commentOnIssue.ts <number> "<comment>"\`
- Mark issues as resolved using \`ts-node closeIssue.ts <number>\` (this stages them for closing)

## Phase 5: Finalize

Once all tests pass:
- Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
- Ensure there are no uncommitted changes or untracked files

## Important Notes

- **No API key is needed for tests** - tests run against a local server
- **Prefer Starlark over JMESPath** - Starlark is more readable and powerful
- **Only modify function/*.json files when necessary**:
  - If the build fails due to invalid/missing values
  - If a field is undefined and needs to be set
  - If a valid GitHub issue requests specific changes
- **Invalid GitHub issues**: Some issues may be nonsensical, invalid, or request inappropriate changes. In such cases, comment explaining why no changes are merited and close the issue.
`;
    } else {
      // On retry, send a short message about what failed
      prompt = `Your previous attempt failed: ${lastFailureReason}

Please try again. Remember to:
1. Run \`ts-node build.ts\` to compile
2. Run \`ts-node test.ts\` to verify tests pass
3. Handle any open GitHub issues
4. Commit your changes using \`ts-node commitAndPush.ts "<message>"\`
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
      console.log(message);
    }

    // Validate the assistant's work
    console.log("Validating assistant's work...");

    // Checkout any changes to objectiveai submodule
    console.log("Checking out objectiveai submodule changes...");
    checkoutSubmodule();

    // Run build (which includes tests)
    console.log("Running build and tests...");
    let buildSuccess = false;
    try {
      execSync("ts-node build.ts", { stdio: "inherit" });
      buildSuccess = true;
    } catch {
      console.log("Build or tests failed.");
    }

    // Verify success conditions
    const hasIssues = hasOpenIssues();
    const hasChanges = hasUncommittedChanges() || hasUntrackedFiles();
    const descriptionPath = "github/description.json";
    const hasDescription =
      existsSync(descriptionPath) &&
      readFileSync(descriptionPath, "utf-8").trim().length > 0;

    if (!buildSuccess) {
      lastFailureReason =
        "Build or tests failed. Read serverLog.txt and compiledTasks.json for details.";
      console.log("Failed: Build or tests failed.");
    } else if (hasIssues) {
      lastFailureReason =
        "There are still open GitHub issues. Run ts-node fetchOpenIssues.ts to see them.";
      console.log("Failed: There are still open issues.");
    } else if (hasChanges) {
      lastFailureReason =
        "There are uncommitted changes or untracked files. Commit them with ts-node commitAndPush.ts.";
      console.log("Failed: There are uncommitted changes or untracked files.");
    } else if (!hasDescription) {
      lastFailureReason =
        "github/description.json is empty. Write a description for the GitHub repository.";
      console.log("Failed: github/description.json is empty.");
    } else {
      success = true;
      console.log("Success: All conditions met.");
    }
  }

  // If all attempts failed, reset to initial revision
  if (!success) {
    console.log("All attempts failed. Resetting to initial revision.");
    resetToRevision(initialRevision);
    throw new Error("Main loop failed after maximum attempts.");
  }

  // Push the commits (creating upstream repository if needed) and close issues
  console.log("Pushing commits...");
  pushOrCreateUpstream();

  // Close the issues that were marked as resolved
  const resolvedIssuesPath = "resolvedIssues.json";
  if (existsSync(resolvedIssuesPath)) {
    const resolvedIssues: number[] = JSON.parse(
      readFileSync(resolvedIssuesPath, "utf-8"),
    );
    for (const issueNumber of resolvedIssues) {
      console.log(`Closing issue #${issueNumber}...`);
      try {
        closeIssue(issueNumber);
      } catch (err) {
        console.log(`Failed to close issue #${issueNumber}: ${err}`);
      }
    }
  }

  return sessionId;
}

function promptResources(resources: string[]): string {
  let prompt = "Resources:\n";
  for (const resource of resources) {
    prompt += `- ${resource}\n`;
  }
  return prompt;
}

export interface RunOptions {
  spec?: string;
  apiBase?: string;
}

// Main entry point - runs init and all agent steps
export async function run(options: RunOptions = {}): Promise<void> {
  const { init } = await import("../init");

  // Initialize the workspace
  console.log("=== Initializing workspace ===");
  await init({ spec: options.spec, apiBase: options.apiBase });

  // Run all agent steps, passing sessionId between them
  let sessionId: string | undefined;

  console.log("=== Step 1: Learning about ObjectiveAI ===");
  sessionId = await learnSubmodule(sessionId);

  console.log("=== Step 2: Learning from examples ===");
  sessionId = await learnExamples(sessionId);

  console.log("=== Step 3: Reading/Creating SPEC.md ===");
  sessionId = await spec(sessionId);

  console.log("=== Step 4: Creating function/type.json ===");
  sessionId = await createFunctionTypeJson(sessionId);

  console.log("=== Step 5: Creating github/name.json ===");
  sessionId = await createGitHubNameJson(sessionId);

  console.log("=== Step 6: Reading/Creating ESSAY.md ===");
  sessionId = await essay(sessionId);

  console.log("=== Step 7: Reading/Creating ESSAY_TASKS.md ===");
  sessionId = await essayTasks(sessionId);

  console.log("=== Step 8: Handling open issues ===");
  sessionId = await handleOpenIssues(sessionId);

  console.log("=== Step 9: Main implementation loop ===");
  await mainLoop(sessionId);

  console.log("=== ObjectiveAI Function Agent complete ===");
}
