import { existsSync, mkdirSync, writeFileSync, readdirSync, appendFileSync, readFileSync } from 'fs';
import { query } from '@anthropic-ai/claude-agent-sdk';

// src/logging.ts
function getNextLogIndex() {
  const logsDir = "logs";
  let nextIndex = 1;
  if (existsSync(logsDir)) {
    const files = readdirSync(logsDir);
    const logNumbers = files.filter((f) => /^\d+\.txt$/.test(f)).map((f) => parseInt(f.replace(".txt", ""), 10)).filter((n) => !isNaN(n));
    if (logNumbers.length > 0) {
      nextIndex = Math.max(...logNumbers) + 1;
    }
  }
  return nextIndex;
}
function createFileLogger() {
  const logsDir = "logs";
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }
  const logIndex = getNextLogIndex();
  const logPath = `${logsDir}/${logIndex}.txt`;
  writeFileSync(logPath, "");
  const log = (...args) => {
    const message = args.map((arg) => {
      if (typeof arg === "string") return arg;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return String(arg);
      }
    }).join(" ");
    appendFileSync(logPath, message + "\n");
    console.log(...args);
  };
  return { log, logPath };
}
function getLatestLogPath() {
  const logsDir = "logs";
  if (!existsSync(logsDir)) {
    return null;
  }
  const files = readdirSync(logsDir);
  const logNumbers = files.filter((f) => /^\d+\.txt$/.test(f)).map((f) => parseInt(f.replace(".txt", ""), 10)).filter((n) => !isNaN(n));
  if (logNumbers.length === 0) {
    return null;
  }
  const maxIndex = Math.max(...logNumbers);
  return `${logsDir}/${maxIndex}.txt`;
}
async function learnSubmodule(log, sessionId) {
  const indexPath = "OBJECTIVEAI_INDEX.md";
  const indexNonEmpty = (() => {
    if (!existsSync(indexPath)) {
      writeFileSync(indexPath, "");
      return false;
    }
    const content = readFileSync(indexPath, "utf-8").trim();
    return content.length > 0;
  })();
  const stream = (() => {
    if (indexNonEmpty) {
      return query({
        prompt: "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository. Learn about ObjectiveAI and ObjectiveAI Functions. Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are. First, read OBJECTIVEAI_INDEX.md. Then, read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to.",
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
            "WebSearch"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    } else {
      return query({
        prompt: "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository. Learn about ObjectiveAI and ObjectiveAI Functions. Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are. Read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to. Create OBJECTIVEAI_INDEX.md with links to files and your learnings.",
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
            "Write(./OBJECTIVEAI_INDEX.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    }
  })();
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!existsSync(indexPath) || !readFileSync(indexPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("OBJECTIVEAI_INDEX.md is empty after learn phase");
    } else {
      const stream2 = query({
        prompt: "OBJECTIVEAI_INDEX.md is empty after your learn phase. Create OBJECTIVEAI_INDEX.md with links to files and your learnings about ObjectiveAI and ObjectiveAI Functions.",
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
            "Write(./OBJECTIVEAI_INDEX.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
      for await (const message of stream2) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        log(message);
      }
      retry += 1;
    }
  }
  return sessionId;
}
async function learnExamples(log, sessionId) {
  const stream = query({
    prompt: "1. Read `examples/examples.json` to see the root function-profile pairs\n2. For each pair, open and study:\n- `examples/functions/{owner}/{repository}/{commit}/function.json`\n- `examples/profiles/{owner}/{repository}/{commit}/profile.json`\n3. If any function contains sub-tasks, open those sub-function files\n4. If any profile contains sub-profiles, open those sub-profile files",
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
        "WebSearch"
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
  return sessionId;
}
async function spec(log, sessionId) {
  const specPath = "SPEC.md";
  const specNonEmpty = (() => {
    if (!existsSync(specPath)) {
      writeFileSync(specPath, "");
      return false;
    }
    const content = readFileSync(specPath, "utf-8").trim();
    return content.length > 0;
  })();
  const stream = (() => {
    if (specNonEmpty) {
      return query({
        prompt: "Read SPEC.md to understand the ObjectiveAI Function specification.",
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
            "WebSearch"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    } else {
      return query({
        prompt: "Create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.",
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
            "Write(./SPEC.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    }
  })();
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!existsSync(specPath) || !readFileSync(specPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    } else {
      const stream2 = query({
        prompt: "SPEC.md is empty after your spec phase. Create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.",
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
            "Write(./SPEC.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
      for await (const message of stream2) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        log(message);
      }
      retry += 1;
    }
  }
  return sessionId;
}

// src/claude/promptResources.ts
function promptResources(resources) {
  let prompt = "Resources:\n";
  for (const resource of resources) {
    prompt += `- ${resource}
`;
  }
  return prompt;
}

// src/claude/prepare/functionType.ts
async function createFunctionTypeJson(log, sessionId) {
  const functionTypePath = "function/type.json";
  const functionTypeValid = () => {
    if (!existsSync(functionTypePath)) {
      return false;
    }
    let content = readFileSync(functionTypePath, "utf-8").trim();
    if (!content || content === "null") {
      return false;
    }
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    }
    return content === "scalar.function" || content === "vector.function";
  };
  if (!functionTypeValid()) {
    const stream = query({
      prompt: promptResources(["OBJECTIVEAI_INDEX.md", "SPEC.md"]) + 'Create function/type.json specifying the function type ("scalar.function" or "vector.function").',
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
          "Write(./function/type.json)"
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
  }
  let retry = 1;
  while (!functionTypeValid()) {
    if (retry > 10) {
      throw new Error(
        "function/type.json is invalid after createFunctionTypeJson phase"
      );
    }
    const stream = query({
      prompt: 'function/type.json is invalid after your createFunctionTypeJson phase. Create function/type.json specifying the function type ("scalar.function" or "vector.function") based on SPEC.md.',
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
          "Write(./function/type.json)"
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
    retry += 1;
  }
  return sessionId;
}
async function createGitHubNameJson(log, sessionId) {
  const githubNamePath = "github/name.json";
  const githubNameNonEmpty = () => {
    if (!existsSync(githubNamePath)) {
      writeFileSync(githubNamePath, "");
      return false;
    }
    let content = readFileSync(githubNamePath, "utf-8").trim();
    if (!content || content === "null") {
      return false;
    }
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    }
    return content.length > 0;
  };
  if (!githubNameNonEmpty()) {
    const stream = query({
      prompt: promptResources([
        "OBJECTIVEAI_INDEX.md",
        "SPEC.md",
        "function/type.json"
      ]) + 'Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:- Use all lowercase\n- Use dashes (`-`) to separate words if there\'s more than one',
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
          "Write(./github/name.json)"
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
  }
  let retry = 1;
  while (!githubNameNonEmpty()) {
    if (retry > 10) {
      throw new Error(
        "github/name.json is empty after createGitHubNameJson phase"
      );
    }
    const stream = query({
      prompt: 'github/name.json is empty after your createGitHubNameJson phase. Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n- Use all lowercase\n- Use dashes (`-`) to separate words if there\'s more than one',
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
          "Write(./github/name.json)"
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
    retry += 1;
  }
  return sessionId;
}
async function essay(log, sessionId) {
  const essayPath = "ESSAY.md";
  const essayNonEmpty = (() => {
    if (!existsSync(essayPath)) {
      writeFileSync(essayPath, "");
      return false;
    }
    const content = readFileSync(essayPath, "utf-8").trim();
    return content.length > 0;
  })();
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
            "WebSearch"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    } else {
      return query({
        prompt: promptResources([
          "OBJECTIVEAI_INDEX.md",
          "SPEC.md",
          "function/type.json",
          "github/name.json"
        ]) + "Create ESSAY.md describing the ObjectiveAI Function you are building. Explore the purpose, inputs, outputs, and use-cases of the function in detail. Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function. This essay will guide the development of the function and underpins its philosophy.",
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
            "Write(./ESSAY.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    }
  })();
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!existsSync(essayPath) || !readFileSync(essayPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    } else {
      const stream2 = query({
        prompt: "ESSAY.md is empty after your essay phase. Create ESSAY.md describing the ObjectiveAI Function you are building. Explore the purpose, inputs, outputs, and use-cases of the function in detail. Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function. This essay will guide the development of the function and underpins its philosophy.",
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
            "Write(./ESSAY.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
      for await (const message of stream2) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        log(message);
      }
      retry += 1;
    }
  }
  return sessionId;
}
async function essayTasks(log, sessionId) {
  const essayTasksPath = "ESSAY_TASKS.md";
  const essayTasksNonEmpty = (() => {
    if (!existsSync(essayTasksPath)) {
      writeFileSync(essayTasksPath, "");
      return false;
    }
    const content = readFileSync(essayTasksPath, "utf-8").trim();
    return content.length > 0;
  })();
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
            "WebSearch"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    } else {
      return query({
        prompt: promptResources([
          "OBJECTIVEAI_INDEX.md",
          "SPEC.md",
          "function/type.json",
          "github/name.json",
          "ESSAY.md"
        ]) + "Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md. Each task is a plain language description of a task which will go into the function's `tasks` array.",
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
            "Write(./ESSAY_TASKS.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    }
  })();
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }
  let retry = 1;
  while (!existsSync(essayTasksPath) || !readFileSync(essayTasksPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("ESSAY_TASKS.md is empty after essayTasks phase");
    } else {
      const stream2 = query({
        prompt: "ESSAY_TASKS.md is empty after your essayTasks phase. Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md. Each task is a plain language description of a task which will go into the function's `tasks` array.",
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
            "Write(./ESSAY_TASKS.md)"
          ],
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
      for await (const message of stream2) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        log(message);
      }
      retry += 1;
    }
  }
  return sessionId;
}
async function handleOpenIssues(log, sessionId) {
  const { hasOpenIssues } = await import('./github-RVB6PDGH.js');
  if (!hasOpenIssues()) {
    return sessionId;
  }
  const stream = query({
    prompt: promptResources([
      "OBJECTIVEAI_INDEX.md",
      "SPEC.md",
      "function/type.json",
      "github/name.json",
      "ESSAY.md",
      "ESSAY_TASKS.md",
      "ts-node fetchOpenIssues.ts"
    ]) + "There are open issues on this repository that need your attention.\n1. Run `ts-node fetchOpenIssues.ts` to see all open issues with their comments.\n2. Review each issue.",
    options: {
      allowedTools: [
        "Bash(ls*)",
        "Bash(cd)",
        "Bash(cat)",
        "Bash(diff)",
        "Bash(ts-node fetchOpenIssues.ts)",
        "Bash(npx ts-node fetchOpenIssues.ts)",
        "Glob",
        "Grep",
        "Read",
        "WebFetch",
        "WebSearch"
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
  return sessionId;
}

// src/claude/prepare/index.ts
async function prepare(options = {}) {
  const { init } = await import('./init-MZSAFZ4X.js');
  const log = options.log ?? createFileLogger().log;
  log("=== Initializing workspace ===");
  await init({ spec: options.spec, apiBase: options.apiBase });
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

export { createFileLogger, getLatestLogPath, prepare, promptResources };
