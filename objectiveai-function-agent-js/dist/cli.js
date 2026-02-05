#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, appendFileSync } from 'fs';
import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { ObjectiveAI, Functions } from 'objectiveai';
import { query } from '@anthropic-ai/claude-agent-sdk';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/claude/index.ts
var claude_exports = {};
__export(claude_exports, {
  handleIssues: () => handleIssues,
  invent: () => invent,
  inventFunctionTasks: () => inventFunctionTasks,
  inventVectorTasks: () => inventVectorTasks,
  prepare: () => prepare
});
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

// assets/function/description.json.txt
var description_json_default = "null";

// assets/function/input_maps.json.txt
var input_maps_json_default = "null";

// assets/function/input_merge.json.txt
var input_merge_json_default = "null";

// assets/function/input_schema.json.txt
var input_schema_json_default = "null";

// assets/function/input_split.json.txt
var input_split_json_default = "null";

// assets/function/output_length.json.txt
var output_length_json_default = "null";

// assets/function/tasks.json.txt
var tasks_json_default = "null";

// assets/function/type.json.txt
var type_json_default = "null";

// assets/github/description.json.txt
var description_json_default2 = "null";

// assets/github/name.json.txt
var name_json_default = "null";

// assets/.gitignore.txt
var gitignore_default = "node_modules\r\n.env\r\n.claude/settings.local.json\r\nserverLog.txt\r\ncompiledTasks.json\r\nresolvedIssues.json\r\nbuild.ts\r\ntest.ts\r\ntsconfig.json\r\npackage.json\r\npackage-lock.json\r\n_runner.ts";

// assets/build.ts.txt
var build_ts_default = 'import { writeFunctionJson, writeProfileJson, spawnApiServer, createLocalObjectiveAI, runTests } from "@objectiveai/function-agent";\r\nimport { execSync } from "child_process";\r\nimport "dotenv/config";\r\n\r\nasync function main(): Promise<void> {\r\n  // Discard any changes to the objectiveai submodule\r\n  execSync("git -C objectiveai checkout -- .", { stdio: "inherit" });\r\n\r\n  // Install dependencies\r\n  execSync("npm install", { stdio: "inherit" });\r\n\r\n  // Build\r\n  writeFunctionJson();\r\n  writeProfileJson();\r\n\r\n  // Test\r\n  const apiBase = process.env.ONLY_SET_IF_YOU_KNOW_WHAT_YOURE_DOING;\r\n  const port = Math.floor(Math.random() * 50000) + 10000;\r\n\r\n  const apiProcess = await spawnApiServer({ apiBase, port });\r\n  const objectiveai = createLocalObjectiveAI({ apiBase, port });\r\n\r\n  try {\r\n    await runTests({ objectiveai });\r\n  } finally {\r\n    apiProcess?.kill();\r\n  }\r\n}\r\n\r\nmain().catch((err) => {\r\n  console.error(err);\r\n  process.exit(1);\r\n});\r\n';

// assets/package.json.txt
var package_json_default = '{\r\n  "name": "objectiveai-function",\r\n  "version": "1.0.0",\r\n  "main": "main.ts",\r\n  "scripts": {\r\n    "check": "ts-node build.ts && ts-node test.ts"\r\n  },\r\n  "type": "commonjs",\r\n  "devDependencies": {\r\n    "@types/node": "^25.0.9",\r\n    "ts-node": "^10.9.2",\r\n    "typescript": "^5.9.3"\r\n  },\r\n  "dependencies": {\r\n    "dotenv": "^17.2.3",\r\n    "objectiveai": "file:./objectiveai/objectiveai-js",\r\n    "@objectiveai/function-agent": "file:./objectiveai/objectiveai-function-agent-js",\r\n    "zod": "^4.3.5"\r\n  }\r\n}\r\n';

// assets/README.md.txt
var README_md_default = "";

// assets/tsconfig.json.txt
var tsconfig_json_default = '{\r\n  "compilerOptions": {\r\n    "target": "ES2020",\r\n    "module": "node20",\r\n    "moduleResolution": "node16",\r\n    "esModuleInterop": true,\r\n    "strict": true,\r\n    "skipLibCheck": true,\r\n    "outDir": "./dist",\r\n    "resolveJsonModule": true\r\n  },\r\n  "ts-node": {\r\n    "compilerOptions": {\r\n      "module": "commonjs",\r\n      "allowImportingTsExtensions": true,\r\n      "noEmit": true\r\n    }\r\n  }\r\n}\r\n';

// assets/fetchOpenIssues.ts.txt
var fetchOpenIssues_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\r\n\r\nconst issues = GitHub.fetchOpenIssues();\r\nconsole.log(JSON.stringify(issues, null, 2));\r\n';

// assets/fetchClosedIssues.ts.txt
var fetchClosedIssues_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\r\n\r\nconst issues = GitHub.fetchClosedIssues();\r\nconsole.log(JSON.stringify(issues, null, 2));\r\n';

// assets/commentOnIssue.ts.txt
var commentOnIssue_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\r\n\r\nconst issueNumber = parseInt(process.argv[2], 10);\r\nconst comment = process.argv[3];\r\n\r\nif (isNaN(issueNumber) || !comment) {\r\n  console.error("Usage: ts-node commentOnIssue.ts <issue_number> <comment>");\r\n  process.exit(1);\r\n}\r\n\r\nGitHub.commentOnIssue(issueNumber, comment);\r\nconsole.log(`Commented on issue #${issueNumber}`);\r\n';

// assets/closeIssue.ts.txt
var closeIssue_ts_default = 'import { existsSync, readFileSync, writeFileSync } from "fs";\r\n\r\nconst issueNumber = parseInt(process.argv[2], 10);\r\n\r\nif (isNaN(issueNumber)) {\r\n  console.error("Usage: ts-node closeIssue.ts <issue_number>");\r\n  process.exit(1);\r\n}\r\n\r\n// Read existing resolved issues\r\nconst resolvedIssuesPath = "resolvedIssues.json";\r\nlet resolvedIssues: number[] = [];\r\nif (existsSync(resolvedIssuesPath)) {\r\n  resolvedIssues = JSON.parse(readFileSync(resolvedIssuesPath, "utf-8"));\r\n}\r\n\r\n// Add this issue if not already present\r\nif (!resolvedIssues.includes(issueNumber)) {\r\n  resolvedIssues.push(issueNumber);\r\n  writeFileSync(resolvedIssuesPath, JSON.stringify(resolvedIssues, null, 2));\r\n}\r\n\r\nconsole.log(`Marked issue #${issueNumber} for closing`);\r\n';

// assets/commitAndPush.ts.txt
var commitAndPush_ts_default = 'import { execSync } from "child_process";\r\n\r\nconst message = process.argv[2];\r\n\r\nif (!message) {\r\n  console.error("Usage: ts-node commitAndPush.ts <commit_message>");\r\n  process.exit(1);\r\n}\r\n\r\n// Discard any changes to the objectiveai submodule\r\nexecSync("git -C objectiveai checkout -- .", { stdio: "inherit" });\r\n\r\n// Stage all changes\r\nexecSync("git add -A", { stdio: "pipe" });\r\n\r\n// Check if there are changes to commit\r\ntry {\r\n  execSync("git diff --cached --quiet", { stdio: "pipe" });\r\n  console.log("No changes to commit.");\r\n} catch {\r\n  // There are changes, commit them\r\n  execSync(`git commit -m "${message.replace(/"/g, \'\\\\"\')}"`, { stdio: "inherit" });\r\n  console.log("Committed and pushed successfully.");\r\n}\r\n';

// assets/spawnFunctionAgents.ts.txt
var spawnFunctionAgents_ts_default = 'import { execSync, spawn } from "child_process";\r\nimport { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";\r\nimport { join } from "path";\r\n\r\ninterface AgentResult {\r\n  owner: string;\r\n  repository: string;\r\n  commit: string;\r\n}\r\n\r\ninterface AgentError {\r\n  error: string;\r\n}\r\n\r\ninterface AgentSkipped {\r\n  skipped: true;\r\n}\r\n\r\ntype Result = AgentResult | AgentError | AgentSkipped;\r\n\r\n// Read current depth from parameters.json\r\nfunction getCurrentDepth(): number {\r\n  if (!existsSync("parameters.json")) {\r\n    return 0;\r\n  }\r\n  const content = readFileSync("parameters.json", "utf-8");\r\n  const params = JSON.parse(content) as { depth: number };\r\n  return params.depth ?? 0;\r\n}\r\n\r\nasync function runAgentInSubdir(spec: string | null, index: number, childDepth: number): Promise<Result> {\r\n  // Skip if spec is null\r\n  if (spec === null) {\r\n    return { skipped: true };\r\n  }\r\n\r\n  const subdir = join("sub_functions", String(index));\r\n\r\n  // Delete existing directory if it exists (for retries)\r\n  if (existsSync(subdir)) {\r\n    console.log(`Deleting existing directory: ${subdir}`);\r\n    rmSync(subdir, { recursive: true, force: true });\r\n  }\r\n\r\n  // Create subdirectory\r\n  mkdirSync(subdir, { recursive: true });\r\n\r\n  // Write a runner script that will be executed in the subdirectory\r\n  const runnerScript = `\r\nimport { Claude } from "@objectiveai/function-agent";\r\n\r\nasync function main(): Promise<void> {\r\n  await Claude.invent({ spec: ${JSON.stringify(spec)}, depth: ${childDepth} });\r\n}\r\n\r\nmain().catch((err) => {\r\n  console.error(err);\r\n  process.exit(1);\r\n});\r\n`;\r\n\r\n  const runnerPath = join(subdir, "_runner.ts");\r\n  writeFileSync(runnerPath, runnerScript);\r\n\r\n  return new Promise<Result>((resolve) => {\r\n    const child = spawn("npx", ["ts-node", "_runner.ts"], {\r\n      cwd: subdir,\r\n      stdio: ["inherit", "pipe", "pipe"],\r\n      shell: true,\r\n    });\r\n\r\n    // Capture but discard output to avoid context overload in parent\r\n    child.stdout?.on("data", () => {});\r\n    child.stderr?.on("data", () => {});\r\n\r\n    child.on("close", (code) => {\r\n      if (code !== 0) {\r\n        resolve({ error: `Agent exited with code ${code}. See ${subdir}/logs/ for details.` });\r\n        return;\r\n      }\r\n\r\n      // Extract owner/repo/commit from the completed function\r\n      try {\r\n        const nameJsonPath = join(subdir, "github", "name.json");\r\n        const name = JSON.parse(readFileSync(nameJsonPath, "utf-8")) as string;\r\n\r\n        // Get owner from git remote\r\n        const remote = execSync("git remote get-url origin", {\r\n          cwd: subdir,\r\n          encoding: "utf-8",\r\n        }).trim();\r\n\r\n        // Parse owner from remote URL (https://github.com/owner/repo or git@github.com:owner/repo)\r\n        const match = remote.match(/github\\.com[:/]([^/]+)\\/([^/.]+)/);\r\n        const owner = match?.[1] ?? "unknown";\r\n        const repository = match?.[2] ?? name;\r\n\r\n        // Get latest commit\r\n        const commit = execSync("git rev-parse HEAD", {\r\n          cwd: subdir,\r\n          encoding: "utf-8",\r\n        }).trim();\r\n\r\n        resolve({ owner, repository, commit });\r\n      } catch (err) {\r\n        resolve({ error: `Failed to extract result: ${err}` });\r\n      }\r\n    });\r\n\r\n    child.on("error", (err) => {\r\n      resolve({ error: `Failed to spawn agent: ${err.message}` });\r\n    });\r\n  });\r\n}\r\n\r\nasync function main(): Promise<void> {\r\n  const specsArg = process.argv[2];\r\n\r\n  if (!specsArg) {\r\n    console.error("Usage: ts-node spawnFunctionAgents.ts \'<json_array_of_specs>\'");\r\n    console.error("Pass null for indices to skip (e.g., for retrying specific agents)");\r\n    process.exit(1);\r\n  }\r\n\r\n  const specs: (string | null)[] = JSON.parse(specsArg) as (string | null)[];\r\n\r\n  if (!Array.isArray(specs) || specs.length === 0) {\r\n    console.error("Specs must be a non-empty array of strings or nulls");\r\n    process.exit(1);\r\n  }\r\n\r\n  // Calculate child depth (current depth - 1)\r\n  const currentDepth = getCurrentDepth();\r\n  const childDepth = Math.max(0, currentDepth - 1);\r\n\r\n  console.log(`Spawning ${specs.length} function agents with depth=${childDepth}...`);\r\n\r\n  // Run all agents in parallel\r\n  const results = await Promise.all(\r\n    specs.map((spec, index) => runAgentInSubdir(spec, index, childDepth))\r\n  );\r\n\r\n  // Output results as JSON\r\n  console.log("\\n=== SPAWN_RESULTS ===");\r\n  console.log(JSON.stringify(results, null, 2));\r\n}\r\n\r\nmain().catch((err) => {\r\n  console.error(err);\r\n  process.exit(1);\r\n});\r\n';

// assets/cloneSubFunctions.ts.txt
var cloneSubFunctions_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\r\n\r\nconst latest = process.argv.includes("--latest");\r\n\r\nconst cloned = GitHub.cloneSubFunctions({ latest });\r\n\r\nconsole.log("\\n=== CLONE_RESULTS ===");\r\nconsole.log(JSON.stringify(cloned, null, 2));\r\n';

// assets/getSubFunctionCommits.ts.txt
var getSubFunctionCommits_ts_default = 'import { execSync } from "child_process";\r\nimport { existsSync, readdirSync, readFileSync } from "fs";\r\n\r\n// Read JSON file that should contain a string value\r\n// Handles both quoted ("value") and unquoted (value) content\r\nfunction readStringJsonFile(path: string): string | null {\r\n  if (!existsSync(path)) {\r\n    return null;\r\n  }\r\n  let content = readFileSync(path, "utf-8").trim();\r\n  if (!content || content === "null") {\r\n    return null;\r\n  }\r\n  // Remove surrounding quotes if both present (only one pair)\r\n  if (content.startsWith(\'"\') && content.endsWith(\'"\')) {\r\n    content = content.slice(1, -1);\r\n  }\r\n  return content;\r\n}\r\n\r\ninterface SubFunctionInfo {\r\n  index: number;\r\n  owner: string;\r\n  repository: string;\r\n  commit: string;\r\n  path: string;\r\n}\r\n\r\nfunction main(): void {\r\n  const subFunctionsDir = "sub_functions";\r\n\r\n  if (!existsSync(subFunctionsDir)) {\r\n    console.log("No sub_functions directory found.");\r\n    console.log("\\n=== SUB_FUNCTION_COMMITS ===");\r\n    console.log("[]");\r\n    return;\r\n  }\r\n\r\n  const entries = readdirSync(subFunctionsDir);\r\n  const results: SubFunctionInfo[] = [];\r\n\r\n  for (const entry of entries) {\r\n    // Skip non-numeric directories (like .gitignore)\r\n    const index = parseInt(entry, 10);\r\n    if (isNaN(index)) continue;\r\n\r\n    const subFunctionPath = `${subFunctionsDir}/${entry}`;\r\n\r\n    // Get the commit SHA from git\r\n    let commit: string;\r\n    try {\r\n      commit = execSync("git rev-parse HEAD", {\r\n        cwd: subFunctionPath,\r\n        encoding: "utf-8",\r\n        stdio: "pipe",\r\n      }).trim();\r\n    } catch {\r\n      console.log(`Failed to get commit for ${subFunctionPath}`);\r\n      continue;\r\n    }\r\n\r\n    // Get owner/repository from github/name.json if it exists\r\n    let owner = "";\r\n    let repository = "";\r\n    const namePath = `${subFunctionPath}/github/name.json`;\r\n    const name = readStringJsonFile(namePath);\r\n    if (name) {\r\n      const parts = name.split("/");\r\n      if (parts.length === 2) {\r\n        owner = parts[0];\r\n        repository = parts[1];\r\n      }\r\n    }\r\n\r\n    results.push({\r\n      index,\r\n      owner,\r\n      repository,\r\n      commit,\r\n      path: subFunctionPath,\r\n    });\r\n  }\r\n\r\n  // Sort by index\r\n  results.sort((a, b) => a.index - b.index);\r\n\r\n  console.log("\\n=== SUB_FUNCTION_COMMITS ===");\r\n  console.log(JSON.stringify(results, null, 2));\r\n}\r\n\r\nmain();\r\n';

// assets/installRustLogs.ts.txt
var installRustLogs_ts_default = 'import { execSync } from "child_process";\r\n\r\n// Rebuild the ObjectiveAI packages with any changes made to the Rust source\r\n// This rebuilds objectiveai-js (which includes WASM) and objectiveai-function-agent-js\r\n\r\nconsole.log("Rebuilding ObjectiveAI packages...");\r\n\r\n// Install dependencies in the submodule workspace\r\nexecSync("npm install", { cwd: "objectiveai", stdio: "inherit" });\r\n\r\n// Build objectiveai-js first (includes WASM rebuild)\r\nexecSync("npm run build -w objectiveai-js", { cwd: "objectiveai", stdio: "inherit" });\r\n\r\n// Build objectiveai-function-agent-js (depends on objectiveai-js)\r\nexecSync("npm run build -w objectiveai-function-agent-js", { cwd: "objectiveai", stdio: "inherit" });\r\n\r\n// Reinstall in function workspace to pick up the rebuilt packages\r\nexecSync("npm install", { stdio: "inherit" });\r\n\r\nconsole.log("Rebuild complete. Run ts-node build.ts to test.");\r\n';

// assets/plans/.gitkeep.txt
var gitkeep_default = "";

// assets/logs/.gitignore.txt
var gitignore_default2 = "*\r\n!.gitignore\r\n";

// assets/ESSAY.md.txt
var ESSAY_md_default = "";

// assets/ESSAY_TASKS.md.txt
var ESSAY_TASKS_md_default = "";

// assets/sub_functions/.gitignore.txt
var gitignore_default3 = "*\r\n!.gitignore\r\n";

// assets/cloned_functions/.gitignore.txt
var gitignore_default4 = "*\r\n!.gitignore\r\n";

// assets/inputs.json.txt
var inputs_json_default = "[]\r\n";

// src/assets.ts
var assets = {
  "function/description.json": description_json_default,
  "function/input_maps.json": input_maps_json_default,
  "function/input_merge.json": input_merge_json_default,
  "function/input_schema.json": input_schema_json_default,
  "function/input_split.json": input_split_json_default,
  "function/output_length.json": output_length_json_default,
  "function/tasks.json": tasks_json_default,
  "function/type.json": type_json_default,
  "github/description.json": description_json_default2,
  "github/name.json": name_json_default,
  ".gitignore": gitignore_default,
  "build.ts": build_ts_default,
  "package.json": package_json_default,
  "README.md": README_md_default,
  "tsconfig.json": tsconfig_json_default,
  "fetchOpenIssues.ts": fetchOpenIssues_ts_default,
  "fetchClosedIssues.ts": fetchClosedIssues_ts_default,
  "commentOnIssue.ts": commentOnIssue_ts_default,
  "closeIssue.ts": closeIssue_ts_default,
  "commitAndPush.ts": commitAndPush_ts_default,
  "spawnFunctionAgents.ts": spawnFunctionAgents_ts_default,
  "cloneSubFunctions.ts": cloneSubFunctions_ts_default,
  "getSubFunctionCommits.ts": getSubFunctionCommits_ts_default,
  "installRustLogs.ts": installRustLogs_ts_default,
  "plans/.gitkeep": gitkeep_default,
  "logs/.gitignore": gitignore_default2,
  "sub_functions/.gitignore": gitignore_default3,
  "cloned_functions/.gitignore": gitignore_default4,
  "inputs.json": inputs_json_default,
  "ESSAY.md": ESSAY_md_default,
  "ESSAY_TASKS.md": ESSAY_TASKS_md_default
};

// src/init.ts
function exec(command) {
  try {
    return execSync(command, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}
function execLog(command) {
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit" });
}
function isGitRepo() {
  return existsSync(".git");
}
function initializeGit() {
  console.log("Initializing git repository...");
  execLog("git init");
  execLog(
    "git submodule add https://github.com/ObjectiveAI/objectiveai objectiveai"
  );
  execLog("git submodule update --init --recursive");
}
function updateSubmodules() {
  console.log("Updating git submodules...");
  execLog("git submodule update --init --recursive --remote --force");
}
function runNpmInstall() {
  console.log("Installing dependencies...");
  execLog("npm install");
  exec("git -C objectiveai checkout -- .");
}
function hasChanges() {
  const status = exec("git status --porcelain");
  return status.length > 0;
}
function isFirstCommit() {
  const result = exec("git rev-parse HEAD");
  return result.length === 0;
}
function commitChanges() {
  if (!hasChanges()) {
    return;
  }
  const message = isFirstCommit() ? "initial commit" : "update sandbox";
  console.log(`Creating commit: ${message}...`);
  execLog("git add -A");
  execLog(`git commit -m "${message}"`);
}
function getFunctionPath(ref) {
  return join(
    "examples",
    "functions",
    ref.owner,
    ref.repository,
    ref.commit,
    "function.json"
  );
}
function getProfilePath(ref) {
  return join(
    "examples",
    "profiles",
    ref.owner,
    ref.repository,
    ref.commit,
    "profile.json"
  );
}
function functionExists(ref) {
  return existsSync(getFunctionPath(ref));
}
function profileExists(ref) {
  return existsSync(getProfilePath(ref));
}
function writeFunction(ref, data) {
  const path = getFunctionPath(ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}
function writeProfile(ref, data) {
  const path = getProfilePath(ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}
async function fetchFunctionRecursively(objectiveai, ref) {
  if (functionExists(ref)) {
    return;
  }
  console.log(
    `Fetching function: ${ref.owner}/${ref.repository}/${ref.commit}`
  );
  const func = await Functions.retrieve(
    objectiveai,
    ref.owner,
    ref.repository,
    ref.commit
  );
  writeFunction(ref, func);
  for (const task of func.tasks) {
    if (task.type === "scalar.function" || task.type === "vector.function") {
      const subRef = {
        owner: task.owner,
        repository: task.repository,
        commit: task.commit
      };
      await fetchFunctionRecursively(objectiveai, subRef);
    }
  }
}
function isRemoteProfileTask(task) {
  return "owner" in task && "repository" in task && "commit" in task && !("tasks" in task) && !("ensemble" in task);
}
function isInlineProfileTask(task) {
  return "tasks" in task && !("ensemble" in task);
}
async function fetchProfileRecursively(objectiveai, ref) {
  if (profileExists(ref)) {
    return;
  }
  console.log(`Fetching profile: ${ref.owner}/${ref.repository}/${ref.commit}`);
  const profile = await Functions.Profiles.retrieve(
    objectiveai,
    ref.owner,
    ref.repository,
    ref.commit
  );
  writeProfile(ref, profile);
  async function processTaskProfiles(tasks) {
    for (const task of tasks) {
      if (isRemoteProfileTask(task)) {
        const subRef = {
          owner: task.owner,
          repository: task.repository,
          commit: task.commit
        };
        await fetchProfileRecursively(objectiveai, subRef);
      } else if (isInlineProfileTask(task)) {
        await processTaskProfiles(task.tasks);
      }
    }
  }
  await processTaskProfiles(profile.tasks);
}
async function fetchExamples(apiBase) {
  if (existsSync(join("examples", "examples.json"))) {
    console.log("examples/examples.json already exists, skipping fetch.");
    return;
  }
  const objectiveai = new ObjectiveAI({ apiBase });
  const { data: pairs } = await Functions.listPairs(objectiveai);
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));
  console.log(`Selected ${selected.length} function-profile pairs`);
  for (const pair of selected) {
    const funcRef = {
      owner: pair.function.owner,
      repository: pair.function.repository,
      commit: pair.function.commit
    };
    const profileRef = {
      owner: pair.profile.owner,
      repository: pair.profile.repository,
      commit: pair.profile.commit
    };
    await fetchFunctionRecursively(objectiveai, funcRef);
    await fetchProfileRecursively(objectiveai, profileRef);
  }
  mkdirSync("examples", { recursive: true });
  writeFileSync(
    join("examples", "examples.json"),
    JSON.stringify(selected, null, 2)
  );
  console.log("Examples fetched. Root pairs saved to examples/examples.json");
}
function writeAssets() {
  console.log("Writing asset files...");
  for (const [relativePath, content] of Object.entries(assets)) {
    const dir = dirname(relativePath);
    if (dir !== ".") {
      mkdirSync(dir, { recursive: true });
    }
    const trimmed = content.trim();
    const isEmpty = trimmed === "" || trimmed === "null";
    if (isEmpty && existsSync(relativePath)) {
      continue;
    }
    const exists = existsSync(relativePath);
    writeFileSync(relativePath, content);
    console.log(`  ${exists ? "Updated" : "Created"}: ${relativePath}`);
  }
}
async function init(options = {}) {
  if (!isGitRepo()) {
    initializeGit();
  } else {
    updateSubmodules();
  }
  writeAssets();
  runNpmInstall();
  await fetchExamples(options.apiBase);
  const specPath = "SPEC.md";
  const specExists = existsSync(specPath) && readFileSync(specPath, "utf-8").trim().length > 0;
  if (!specExists) {
    console.log("Writing SPEC.md...");
    writeFileSync(specPath, options.spec ?? "");
  }
  if (!existsSync("parameters.json")) {
    const parameters = {
      depth: options.depth ?? 0
    };
    console.log("Writing parameters.json...");
    writeFileSync("parameters.json", JSON.stringify(parameters, null, 2));
  }
  commitChanges();
  console.log("Initialization complete.");
}
function getSlashCwd() {
  return process.cwd().replace(/\\/g, "/");
}
function getBackslashCwd() {
  return process.cwd().replace(/\//g, "\\");
}
function getGitBashCwd() {
  return execSync('bash -c "pwd"', { encoding: "utf-8" }).trim();
}

// src/claude/allowedTools.ts
function allowedTools(tools) {
  const slashCwd = getSlashCwd();
  const backslashCwd = getBackslashCwd();
  const gitBashCwd = getGitBashCwd();
  const gitBashCwdNoMnt = gitBashCwd.startsWith("/mnt") ? gitBashCwd.slice(4) : null;
  const result = [
    "Bash(ls*)",
    "Bash(cd)",
    "Bash(cat)",
    "Bash(diff)",
    "Glob",
    "Grep",
    "Read",
    "WebFetch",
    "WebSearch"
  ];
  for (const tool of tools) {
    switch (tool.kind) {
      case "ts-node": {
        const script = tool.value;
        result.push(
          `Bash(ts-node ${script})`,
          `Bash(npx ts-node ${script})`,
          `Bash(cd ${slashCwd} && ts-node ${script})`,
          `Bash(cd ${backslashCwd} && ts-node ${script})`,
          `Bash(cd ${gitBashCwd} && ts-node ${script})`,
          `Bash(cd ${slashCwd} && npx ts-node ${script})`,
          `Bash(cd ${backslashCwd} && npx ts-node ${script})`,
          `Bash(cd ${gitBashCwd} && npx ts-node ${script})`
        );
        if (gitBashCwdNoMnt) {
          result.push(
            `Bash(cd ${gitBashCwdNoMnt} && ts-node ${script})`,
            `Bash(cd ${gitBashCwdNoMnt} && npx ts-node ${script})`
          );
        }
        break;
      }
      case "write-edit": {
        const file = tool.value;
        const backslashFile = file.replace(/\//g, "\\");
        result.push(
          `Edit(${file})`,
          `Edit(./${file})`,
          `Edit(${slashCwd}/${file})`,
          `Edit(${backslashCwd}\\${backslashFile})`,
          `Edit(${gitBashCwd}/${file})`,
          `Write(${file})`,
          `Write(./${file})`,
          `Write(${slashCwd}/${file})`,
          `Write(${backslashCwd}\\${backslashFile})`,
          `Write(${gitBashCwd}/${file})`
        );
        if (gitBashCwdNoMnt) {
          result.push(
            `Edit(${gitBashCwdNoMnt}/${file})`,
            `Write(${gitBashCwdNoMnt}/${file})`
          );
        }
        break;
      }
      case "edit-glob": {
        const pattern = tool.value;
        const backslashPattern = pattern.replace(/\//g, "\\");
        result.push(
          `Edit(${pattern})`,
          `Edit(./${pattern})`,
          `Edit(${slashCwd}/${pattern})`,
          `Edit(${backslashCwd}\\${backslashPattern})`,
          `Edit(${gitBashCwd}/${pattern})`
        );
        if (gitBashCwdNoMnt) {
          result.push(`Edit(${gitBashCwdNoMnt}/${pattern})`);
        }
        break;
      }
    }
  }
  console.log(result);
  return result;
}

// src/claude/prepare/learnSubmodule.ts
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
          allowedTools: allowedTools([]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    } else {
      return query({
        prompt: "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository. Learn about ObjectiveAI and ObjectiveAI Functions. Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are. Read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to. Create OBJECTIVEAI_INDEX.md with links to files and your learnings.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "OBJECTIVEAI_INDEX.md" }
          ]),
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
          allowedTools: allowedTools([
            { kind: "write-edit", value: "OBJECTIVEAI_INDEX.md" }
          ]),
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
          allowedTools: allowedTools([]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId
        }
      });
    } else {
      return query({
        prompt: "Create SPEC.md specifying the ObjectiveAI Function to be built. Think deeply about what function to invent:\n- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\nBe creative and describe a function with plain language.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "SPEC.md" }
          ]),
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
          allowedTools: allowedTools([
            { kind: "write-edit", value: "SPEC.md" }
          ]),
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
        allowedTools: allowedTools([
          { kind: "write-edit", value: "function/type.json" }
        ]),
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
        allowedTools: allowedTools([
          { kind: "write-edit", value: "function/type.json" }
        ]),
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
      ]) + 'Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n- Use all lowercase\n- Use dashes (`-`) to separate words if there\'s more than one',
      options: {
        allowedTools: allowedTools([
          { kind: "write-edit", value: "github/name.json" }
        ]),
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
        allowedTools: allowedTools([
          { kind: "write-edit", value: "github/name.json" }
        ]),
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
          allowedTools: allowedTools([]),
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
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY.md" }
          ]),
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
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY.md" }
          ]),
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
          allowedTools: allowedTools([]),
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
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY_TASKS.md" }
          ]),
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
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY_TASKS.md" }
          ]),
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
function gh(args) {
  return execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe" }).trim();
}
function getUpstream() {
  try {
    return execSync("git remote get-url origin", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return null;
  }
}
function fetchIssueComments(issueNumber) {
  const result = gh(
    `issue view ${issueNumber} --json comments`
  );
  const raw = JSON.parse(result);
  return (raw.comments || []).map((comment) => ({
    body: comment.body,
    created_at: comment.createdAt,
    user: comment.author ? { login: comment.author.login } : null
  }));
}
function hasOpenIssues() {
  const upstream = getUpstream();
  if (!upstream) {
    return false;
  }
  try {
    const result = gh("issue list --state open --json number --limit 1");
    const issues = JSON.parse(result);
    return issues.length > 0;
  } catch {
    return false;
  }
}
function fetchOpenIssues() {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot fetch issues.");
  }
  const result = gh(
    "issue list --state open --json number,title,body,state,labels,createdAt,updatedAt,closedAt,author"
  );
  const raw = JSON.parse(result);
  return raw.map((issue) => ({
    number: issue.number,
    title: issue.title,
    body: issue.body,
    state: issue.state,
    labels: issue.labels,
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    closed_at: issue.closedAt,
    user: issue.author ? { login: issue.author.login } : null,
    comments: fetchIssueComments(issue.number)
  }));
}
function closeIssue(issueNumber) {
  const upstream = getUpstream();
  if (!upstream) {
    throw new Error("No upstream remote found. Cannot close issue.");
  }
  gh(`issue close ${issueNumber}`);
}
function readStringJsonFile(path) {
  if (!existsSync(path)) {
    return null;
  }
  let content = readFileSync(path, "utf-8").trim();
  if (!content || content === "null") {
    return null;
  }
  if (content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }
  return content;
}
function createRepository(options = {}) {
  const name = options.name ?? readStringJsonFile("github/name.json");
  if (!name) {
    throw new Error("Repository name is required. Provide it as option or in github/name.json");
  }
  const description = options.description ?? readStringJsonFile("github/description.json");
  let cmd = `repo create ${name}`;
  if (description) {
    cmd += ` --description "${description.replace(/"/g, '\\"')}"`;
  }
  if (options.public !== false) {
    cmd += " --public";
  } else {
    cmd += " --private";
  }
  cmd += " --source=. --push";
  gh(cmd);
  return getUpstream() ?? `https://github.com/${name}`;
}
function pushOrCreateUpstream(options = {}) {
  const upstream = getUpstream();
  if (!upstream) {
    createRepository(options);
  } else {
    execSync("git push", { stdio: "inherit" });
  }
}
function getCurrentRevision() {
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
  } catch {
    return null;
  }
}
function resetToRevision(revision) {
  if (revision === null) {
    execSync("git checkout -- .", { stdio: "inherit" });
    execSync("git clean -fd", { stdio: "inherit" });
  } else {
    execSync(`git reset --hard ${revision}`, { stdio: "inherit" });
  }
}
function hasUncommittedChanges() {
  try {
    execSync("git diff --quiet --ignore-submodules", { stdio: "pipe" });
    execSync("git diff --cached --quiet --ignore-submodules", { stdio: "pipe" });
    return false;
  } catch {
    return true;
  }
}
function hasUntrackedFiles() {
  let submodulePaths = [];
  try {
    const submoduleResult = execSync("git config --file .gitmodules --get-regexp path", {
      encoding: "utf-8",
      stdio: "pipe"
    }).trim();
    if (submoduleResult) {
      submodulePaths = submoduleResult.split("\n").map((line) => line.split(" ")[1]).filter(Boolean);
    }
  } catch {
  }
  const result = execSync("git ls-files --others --exclude-standard", {
    encoding: "utf-8",
    stdio: "pipe"
  }).trim();
  if (result.length === 0) {
    return false;
  }
  const untrackedFiles = result.split("\n").filter((file) => {
    return !submodulePaths.some((subPath) => file.startsWith(subPath + "/") || file === subPath);
  });
  return untrackedFiles.length > 0;
}
function resetAndUpdateSubmodule() {
  execSync("git -C objectiveai checkout -- .", { stdio: "inherit" });
  execSync("git submodule update --init --recursive --remote --force", {
    stdio: "inherit"
  });
  const status = execSync("git status --porcelain", {
    encoding: "utf-8",
    stdio: "pipe"
  }).trim();
  if (status === " M objectiveai" || status === "M  objectiveai") {
    execSync('git add objectiveai && git commit -m "update submodule"', {
      stdio: "inherit"
    });
  }
}

// src/claude/prepare/handleOpenIssues.ts
async function handleOpenIssues(log, sessionId) {
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

// src/claude/invent/inventFunctionTasks.ts
function getInventFunctionTools(planIndex) {
  return [
    { kind: "ts-node", value: "build.ts" },
    { kind: "ts-node", value: "commitAndPush.ts *" },
    { kind: "ts-node", value: "spawnFunctionAgents.ts *" },
    { kind: "ts-node", value: "getSubFunctionCommits.ts" },
    { kind: "ts-node", value: "installRustLogs.ts" },
    { kind: "ts-node", value: "cloneSubFunctions.ts" },
    { kind: "ts-node", value: "cloneSubFunctions.ts --latest" },
    { kind: "write-edit", value: "inputs.json" },
    { kind: "write-edit", value: "function/description.json" },
    { kind: "write-edit", value: "function/input_schema.json" },
    { kind: "write-edit", value: "function/input_maps.json" },
    { kind: "write-edit", value: "function/tasks.json" },
    { kind: "write-edit", value: "function/output_length.json" },
    { kind: "write-edit", value: "function/input_split.json" },
    { kind: "write-edit", value: "function/input_merge.json" },
    { kind: "write-edit", value: "github/description.json" },
    { kind: "write-edit", value: "README.md" },
    { kind: "write-edit", value: `plans/${planIndex}.md` },
    { kind: "edit-glob", value: "objectiveai/objectiveai-api/src/**" },
    { kind: "edit-glob", value: "objectiveai/objectiveai-rs/src/**" },
    { kind: "edit-glob", value: "objectiveai/objectiveai-rs-wasm-js/src/**" }
  ];
}
async function inventFunctionTasksLoop(log, sessionId) {
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);
  const initialRevision = getCurrentRevision();
  const maxAttempts = 5;
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
        "ts-node cloneSubFunctions.ts [--latest]",
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

### Task Structure

This function must use **function tasks** (type: \`scalar.function\` or \`vector.function\`). You must create **at least 2 sub-functions** by spawning child agents:

1. Analyze ESSAY_TASKS.md and create a spec for each sub-function describing:
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
- \`output\` - Present in task output expressions, the raw task result (FunctionOutput, or array of FunctionOutputs if mapped)

### Test Inputs
- Edit \`inputs.json\` to add diverse test inputs (minimum 10, maximum 100)
- **Diversity in structure**: Include edge cases like empty arrays, single items, boundary values, missing optional fields, maximum lengths
- **Diversity in intended output**: Cover the full range of expected scores (low, medium, high quality inputs that should produce different outputs)

### Build and Test
- Run \`ts-node build.ts\` to compile function.json and execute tests
- If tests fail, read \`serverLog.txt\` and \`compiledTasks.json\` for error details
- Fix issues and repeat until all tests pass

### Inspecting Sub-Functions
If the function references sub-functions (tasks with type \`scalar.function\` or \`vector.function\`):
- Run \`ts-node cloneSubFunctions.ts\` to clone them to \`cloned_functions/<owner>/<repository>/<commit>/\`
- Run \`ts-node cloneSubFunctions.ts --latest\` to clone the latest version instead
- Read their \`function.json\` and source files to understand how they work
- This can be used to fetch specific functions from GitHub

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
        allowedTools: allowedTools(getInventFunctionTools(nextPlanIndex)),
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
    log("Resetting and updating objectiveai submodule...");
    resetAndUpdateSubmodule();
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
    const hasChanges2 = hasUncommittedChanges() || hasUntrackedFiles();
    if (hasChanges2) {
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
async function inventFunctionTasks(options = {}) {
  const log = options.log ?? createFileLogger().log;
  const sessionId = await prepare({ ...options, log });
  log("=== Invent Loop: Creating new function ===");
  await inventFunctionTasksLoop(log, sessionId);
  log("=== ObjectiveAI Function invention complete ===");
}
function getInventTools(planIndex) {
  return [
    { kind: "ts-node", value: "build.ts" },
    { kind: "ts-node", value: "commitAndPush.ts *" },
    { kind: "ts-node", value: "installRustLogs.ts" },
    { kind: "write-edit", value: "inputs.json" },
    { kind: "write-edit", value: "function/description.json" },
    { kind: "write-edit", value: "function/input_schema.json" },
    { kind: "write-edit", value: "function/input_maps.json" },
    { kind: "write-edit", value: "function/tasks.json" },
    { kind: "write-edit", value: "function/output_length.json" },
    { kind: "write-edit", value: "function/input_split.json" },
    { kind: "write-edit", value: "function/input_merge.json" },
    { kind: "write-edit", value: "github/description.json" },
    { kind: "write-edit", value: "README.md" },
    { kind: "write-edit", value: `plans/${planIndex}.md` },
    { kind: "edit-glob", value: "objectiveai/objectiveai-api/src/**" },
    { kind: "edit-glob", value: "objectiveai/objectiveai-rs/src/**" },
    { kind: "edit-glob", value: "objectiveai/objectiveai-rs-wasm-js/src/**" }
  ];
}
async function inventVectorTasksLoop(log, sessionId) {
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);
  const initialRevision = getCurrentRevision();
  const maxAttempts = 5;
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

### Task Structure

This function must use **vector completion tasks** (type: \`vector.completion\`). Create 1 or more inline vector completion tasks in \`function/tasks.json\`:
- Use \`map\` if a task needs to iterate over input items
- Each task's prompt and responses define what gets evaluated

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
- \`output\` - Present in task output expressions, the raw task result (VectorCompletionOutput, or array of VectorCompletionOutputs if mapped)

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
        allowedTools: allowedTools(getInventTools(nextPlanIndex)),
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
    log("Resetting and updating objectiveai submodule...");
    resetAndUpdateSubmodule();
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
    const hasChanges2 = hasUncommittedChanges() || hasUntrackedFiles();
    if (hasChanges2) {
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
async function inventVectorTasks(options = {}) {
  const log = options.log ?? createFileLogger().log;
  const sessionId = await prepare({ ...options, log });
  log("=== Invent Loop: Creating new function ===");
  await inventVectorTasksLoop(log, sessionId);
  log("=== ObjectiveAI Function invention complete ===");
}

// src/claude/invent/index.ts
async function invent(options = {}) {
  const depth = options.depth ?? 0;
  if (depth === 0) {
    await inventVectorTasks(options);
  } else {
    await inventFunctionTasks(options);
  }
}
function getIssueHandlingTools(planIndex) {
  return [
    { kind: "ts-node", value: "build.ts" },
    { kind: "ts-node", value: "fetchOpenIssues.ts" },
    { kind: "ts-node", value: "fetchClosedIssues.ts" },
    { kind: "ts-node", value: "commentOnIssue.ts *" },
    { kind: "ts-node", value: "closeIssue.ts *" },
    { kind: "ts-node", value: "commitAndPush.ts *" },
    { kind: "ts-node", value: "cloneSubFunctions.ts" },
    { kind: "ts-node", value: "cloneSubFunctions.ts --latest" },
    { kind: "ts-node", value: "installRustLogs.ts" },
    { kind: "write-edit", value: "inputs.json" },
    { kind: "write-edit", value: "function/description.json" },
    { kind: "write-edit", value: "function/input_schema.json" },
    { kind: "write-edit", value: "function/input_maps.json" },
    { kind: "write-edit", value: "function/tasks.json" },
    { kind: "write-edit", value: "function/output_length.json" },
    { kind: "write-edit", value: "function/input_split.json" },
    { kind: "write-edit", value: "function/input_merge.json" },
    { kind: "write-edit", value: "github/description.json" },
    { kind: "write-edit", value: "README.md" },
    { kind: "write-edit", value: `plans/${planIndex}.md` },
    { kind: "edit-glob", value: "objectiveai/objectiveai-api/src/**" },
    { kind: "edit-glob", value: "objectiveai/objectiveai-rs/src/**" },
    { kind: "edit-glob", value: "objectiveai/objectiveai-rs-wasm-js/src/**" }
  ];
}
async function handleIssuesLoop(log, sessionId) {
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);
  const initialRevision = getCurrentRevision();
  const maxAttempts = 5;
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
- Run \`ts-node cloneSubFunctions.ts\` to clone them to \`cloned_functions/<owner>/<repository>/<commit>/\`
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
        allowedTools: allowedTools(getIssueHandlingTools(nextPlanIndex)),
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
    log("Resetting and updating objectiveai submodule...");
    resetAndUpdateSubmodule();
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
    const hasChanges2 = hasUncommittedChanges() || hasUntrackedFiles();
    if (hasChanges2) {
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
  const log = options.log ?? createFileLogger().log;
  const sessionId = await prepare({ ...options, log });
  log("=== Issue Loop: Handling issues on existing function ===");
  await handleIssuesLoop(log, sessionId);
  log("=== ObjectiveAI Function issue handling complete ===");
}

// src/cli.ts
function parseArgs() {
  const args = process.argv.slice(2);
  let command;
  let spec2;
  let depth;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--depth=")) {
      depth = parseInt(arg.slice(8), 10);
    } else if (arg === "--depth") {
      depth = parseInt(args[++i], 10);
    } else if (!command) {
      command = arg;
    } else if (!spec2) {
      spec2 = arg;
    }
  }
  return { command, spec: spec2, depth };
}
async function main() {
  const { command, spec: spec2, depth } = parseArgs();
  switch (command) {
    case "invent":
      await claude_exports.invent({ spec: spec2, depth });
      break;
    case "handle-issues":
      await claude_exports.handleIssues({ spec: spec2 });
      break;
    default:
      console.log("Usage: objectiveai-function-agent <command> [spec] [--depth N]");
      console.log("");
      console.log("Commands:");
      console.log("  invent         Create a new ObjectiveAI Function");
      console.log("  handle-issues  Handle GitHub issues on an existing function");
      console.log("");
      console.log("Options:");
      console.log("  [spec]         Optional spec string for SPEC.md");
      console.log("  --depth N      Depth level (0=vector, >0=function tasks)");
      process.exit(1);
  }
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
