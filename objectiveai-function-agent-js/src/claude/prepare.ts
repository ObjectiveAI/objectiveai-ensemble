import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { AgentOptions, LogFn } from "../agentOptions";
import { promptResources } from "./promptResources";
import { createFileLogger } from "../logging";

// Step 1 - Learn about ObjectiveAI and ObjectiveAI Functions
async function learnSubmodule(log: LogFn, sessionId?: string): Promise<string | undefined> {
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
          "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository." +
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
          "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository." +
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
    log(message);
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
        log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 2 - Learn from examples
async function learnExamples(log: LogFn, sessionId?: string): Promise<string | undefined> {
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
    log(message);
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 3 - Read or Create SPEC.md
async function spec(log: LogFn, sessionId?: string): Promise<string | undefined> {
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
    log(message);
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
        log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 4 - Create function/type.json (if needed)
async function createFunctionTypeJson(
  log: LogFn,
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
      log(message);
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
      log(message);
    }
    retry += 1;
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 5 - Create github/name.json (if needed)
async function createGitHubNameJson(
  log: LogFn,
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
      log(message);
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
      log(message);
    }
    retry += 1;
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 6 - Read or Create ESSAY.md
async function essay(log: LogFn, sessionId?: string): Promise<string | undefined> {
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
    log(message);
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
        log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 7 - Read or Create ESSAY_TASKS.md
async function essayTasks(log: LogFn, sessionId?: string): Promise<string | undefined> {
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
    log(message);
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
        log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}

// Step 8 - Handle open issues (optional)
async function handleOpenIssues(
  log: LogFn,
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
    log(message);
  }

  // Return session ID for resuming
  return sessionId;
}

// Runs init and steps 1-8
export async function prepare(
  options: AgentOptions = {},
): Promise<string | undefined> {
  const { init } = await import("../init");
  const log = options.log ?? createFileLogger().log;

  // Initialize the workspace
  log("=== Initializing workspace ===");
  await init({ spec: options.spec, apiBase: options.apiBase });

  // Run preparation steps, passing sessionId between them
  let sessionId = options.sessionId;

  log("=== Step 1: Learning about ObjectiveAI ===");
  sessionId = await learnSubmodule(log, sessionId);

  log("=== Step 2: Learning from examples ===");
  sessionId = await learnExamples(log, sessionId);

  log("=== Step 3: Reading/Creating SPEC.md ===");
  sessionId = await spec(log, sessionId);

  log("=== Step 4: Creating function/type.json ===");
  sessionId = await createFunctionTypeJson(log, sessionId);

  log("=== Step 5: Creating github/name.json ===");
  sessionId = await createGitHubNameJson(log, sessionId);

  log("=== Step 6: Reading/Creating ESSAY.md ===");
  sessionId = await essay(log, sessionId);

  log("=== Step 7: Reading/Creating ESSAY_TASKS.md ===");
  sessionId = await essayTasks(log, sessionId);

  log("=== Step 8: Handling open issues ===");
  sessionId = await handleOpenIssues(log, sessionId);

  return sessionId;
}
