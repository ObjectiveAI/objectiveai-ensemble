import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { ObjectiveAI, Functions } from 'objectiveai';

// src/init.ts

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

// assets/function/output.json.txt
var output_json_default = "null";

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
var gitignore_default = "node_modules\n.env\n.claude/settings.local.json\nserverLog.txt\ncompiledTasks.json\nresolvedIssues.json\nbuild.ts\ntest.ts\ntsconfig.json\npackage.json\npackage-lock.json\n_runner.ts";

// assets/build.ts.txt
var build_ts_default = 'import { writeFunctionJson, writeProfileJson, spawnApiServer, createLocalObjectiveAI, runTests } from "@objectiveai/function-agent";\nimport { execSync } from "child_process";\nimport "dotenv/config";\n\nasync function main(): Promise<void> {\n  // Discard any changes to the objectiveai submodule\n  execSync("git -C objectiveai checkout -- .", { stdio: "inherit" });\n\n  // Install dependencies\n  execSync("npm install", { stdio: "inherit" });\n\n  // Build\n  writeFunctionJson();\n  writeProfileJson();\n\n  // Test\n  const apiBase = process.env.ONLY_SET_IF_YOU_KNOW_WHAT_YOURE_DOING;\n  const port = Math.floor(Math.random() * 50000) + 10000;\n\n  const apiProcess = await spawnApiServer({ apiBase, port });\n  const objectiveai = createLocalObjectiveAI({ apiBase, port });\n\n  try {\n    await runTests({ objectiveai });\n  } finally {\n    apiProcess?.kill();\n  }\n}\n\nmain().catch((err) => {\n  console.error(err);\n  process.exit(1);\n});\n';

// assets/package.json.txt
var package_json_default = '{\n  "name": "objectiveai-function",\n  "version": "1.0.0",\n  "main": "main.ts",\n  "scripts": {\n    "check": "ts-node build.ts && ts-node test.ts"\n  },\n  "type": "commonjs",\n  "devDependencies": {\n    "@types/node": "^25.0.9",\n    "ts-node": "^10.9.2",\n    "typescript": "^5.9.3"\n  },\n  "dependencies": {\n    "dotenv": "^17.2.3",\n    "objectiveai": "file:./objectiveai/objectiveai-js",\n    "@objectiveai/function-agent": "file:./objectiveai/objectiveai-function-agent-js",\n    "zod": "^4.3.5"\n  }\n}\n';

// assets/README.md.txt
var README_md_default = "";

// assets/tsconfig.json.txt
var tsconfig_json_default = '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "node20",\n    "moduleResolution": "node16",\n    "esModuleInterop": true,\n    "strict": true,\n    "skipLibCheck": true,\n    "outDir": "./dist",\n    "resolveJsonModule": true\n  },\n  "ts-node": {\n    "compilerOptions": {\n      "module": "commonjs",\n      "allowImportingTsExtensions": true,\n      "noEmit": true\n    }\n  }\n}\n';

// assets/fetchOpenIssues.ts.txt
var fetchOpenIssues_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\n\nconst issues = GitHub.fetchOpenIssues();\nconsole.log(JSON.stringify(issues, null, 2));\n';

// assets/fetchClosedIssues.ts.txt
var fetchClosedIssues_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\n\nconst issues = GitHub.fetchClosedIssues();\nconsole.log(JSON.stringify(issues, null, 2));\n';

// assets/commentOnIssue.ts.txt
var commentOnIssue_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\n\nconst issueNumber = parseInt(process.argv[2], 10);\nconst comment = process.argv[3];\n\nif (isNaN(issueNumber) || !comment) {\n  console.error("Usage: ts-node commentOnIssue.ts <issue_number> <comment>");\n  process.exit(1);\n}\n\nGitHub.commentOnIssue(issueNumber, comment);\nconsole.log(`Commented on issue #${issueNumber}`);\n';

// assets/closeIssue.ts.txt
var closeIssue_ts_default = 'import { existsSync, readFileSync, writeFileSync } from "fs";\n\nconst issueNumber = parseInt(process.argv[2], 10);\n\nif (isNaN(issueNumber)) {\n  console.error("Usage: ts-node closeIssue.ts <issue_number>");\n  process.exit(1);\n}\n\n// Read existing resolved issues\nconst resolvedIssuesPath = "resolvedIssues.json";\nlet resolvedIssues: number[] = [];\nif (existsSync(resolvedIssuesPath)) {\n  resolvedIssues = JSON.parse(readFileSync(resolvedIssuesPath, "utf-8"));\n}\n\n// Add this issue if not already present\nif (!resolvedIssues.includes(issueNumber)) {\n  resolvedIssues.push(issueNumber);\n  writeFileSync(resolvedIssuesPath, JSON.stringify(resolvedIssues, null, 2));\n}\n\nconsole.log(`Marked issue #${issueNumber} for closing`);\n';

// assets/commitAndPush.ts.txt
var commitAndPush_ts_default = 'import { execSync } from "child_process";\n\nconst message = process.argv[2];\n\nif (!message) {\n  console.error("Usage: ts-node commitAndPush.ts <commit_message>");\n  process.exit(1);\n}\n\n// Discard any changes to the objectiveai submodule\nexecSync("git -C objectiveai checkout -- .", { stdio: "inherit" });\n\n// Stage all changes\nexecSync("git add -A", { stdio: "pipe" });\n\n// Check if there are changes to commit\ntry {\n  execSync("git diff --cached --quiet", { stdio: "pipe" });\n  console.log("No changes to commit.");\n} catch {\n  // There are changes, commit them\n  execSync(`git commit -m "${message.replace(/"/g, \'\\\\"\')}"`, { stdio: "inherit" });\n  console.log("Committed and pushed successfully.");\n}\n';

// assets/spawnFunctionAgents.ts.txt
var spawnFunctionAgents_ts_default = 'import { execSync, spawn } from "child_process";\nimport { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";\nimport { join } from "path";\n\ninterface AgentResult {\n  owner: string;\n  repository: string;\n  commit: string;\n}\n\ninterface AgentError {\n  error: string;\n}\n\ninterface AgentSkipped {\n  skipped: true;\n}\n\ntype Result = AgentResult | AgentError | AgentSkipped;\n\n// Read current depth from parameters.json\nfunction getCurrentDepth(): number {\n  if (!existsSync("parameters.json")) {\n    return 0;\n  }\n  const content = readFileSync("parameters.json", "utf-8");\n  const params = JSON.parse(content) as { depth: number };\n  return params.depth ?? 0;\n}\n\nasync function runAgentInSubdir(spec: string | null, index: number, childDepth: number): Promise<Result> {\n  // Skip if spec is null\n  if (spec === null) {\n    return { skipped: true };\n  }\n\n  const subdir = join("sub_functions", String(index));\n\n  // Delete existing directory if it exists (for retries)\n  if (existsSync(subdir)) {\n    console.log(`Deleting existing directory: ${subdir}`);\n    rmSync(subdir, { recursive: true, force: true });\n  }\n\n  // Create subdirectory\n  mkdirSync(subdir, { recursive: true });\n\n  // Write a runner script that will be executed in the subdirectory\n  const runnerScript = `\nimport { Claude } from "@objectiveai/function-agent";\n\nasync function main(): Promise<void> {\n  await Claude.invent({ spec: ${JSON.stringify(spec)}, depth: ${childDepth} });\n}\n\nmain().catch((err) => {\n  console.error(err);\n  process.exit(1);\n});\n`;\n\n  const runnerPath = join(subdir, "_runner.ts");\n  writeFileSync(runnerPath, runnerScript);\n\n  return new Promise<Result>((resolve) => {\n    const child = spawn("npx", ["ts-node", "_runner.ts"], {\n      cwd: subdir,\n      stdio: ["inherit", "pipe", "pipe"],\n      shell: true,\n    });\n\n    // Capture but discard output to avoid context overload in parent\n    child.stdout?.on("data", () => {});\n    child.stderr?.on("data", () => {});\n\n    child.on("close", (code) => {\n      if (code !== 0) {\n        resolve({ error: `Agent exited with code ${code}. See ${subdir}/logs/ for details.` });\n        return;\n      }\n\n      // Extract owner/repo/commit from the completed function\n      try {\n        const nameJsonPath = join(subdir, "github", "name.json");\n        const name = JSON.parse(readFileSync(nameJsonPath, "utf-8")) as string;\n\n        // Get owner from git remote\n        const remote = execSync("git remote get-url origin", {\n          cwd: subdir,\n          encoding: "utf-8",\n        }).trim();\n\n        // Parse owner from remote URL (https://github.com/owner/repo or git@github.com:owner/repo)\n        const match = remote.match(/github\\.com[:/]([^/]+)\\/([^/.]+)/);\n        const owner = match?.[1] ?? "unknown";\n        const repository = match?.[2] ?? name;\n\n        // Get latest commit\n        const commit = execSync("git rev-parse HEAD", {\n          cwd: subdir,\n          encoding: "utf-8",\n        }).trim();\n\n        resolve({ owner, repository, commit });\n      } catch (err) {\n        resolve({ error: `Failed to extract result: ${err}` });\n      }\n    });\n\n    child.on("error", (err) => {\n      resolve({ error: `Failed to spawn agent: ${err.message}` });\n    });\n  });\n}\n\nasync function main(): Promise<void> {\n  const specsArg = process.argv[2];\n\n  if (!specsArg) {\n    console.error("Usage: ts-node spawnFunctionAgents.ts \'<json_array_of_specs>\'");\n    console.error("Pass null for indices to skip (e.g., for retrying specific agents)");\n    process.exit(1);\n  }\n\n  const specs: (string | null)[] = JSON.parse(specsArg) as (string | null)[];\n\n  if (!Array.isArray(specs) || specs.length === 0) {\n    console.error("Specs must be a non-empty array of strings or nulls");\n    process.exit(1);\n  }\n\n  // Calculate child depth (current depth - 1)\n  const currentDepth = getCurrentDepth();\n  const childDepth = Math.max(0, currentDepth - 1);\n\n  console.log(`Spawning ${specs.length} function agents with depth=${childDepth}...`);\n\n  // Run all agents in parallel\n  const results = await Promise.all(\n    specs.map((spec, index) => runAgentInSubdir(spec, index, childDepth))\n  );\n\n  // Output results as JSON\n  console.log("\\n=== SPAWN_RESULTS ===");\n  console.log(JSON.stringify(results, null, 2));\n}\n\nmain().catch((err) => {\n  console.error(err);\n  process.exit(1);\n});\n';

// assets/cloneSubFunctions.ts.txt
var cloneSubFunctions_ts_default = 'import { GitHub } from "@objectiveai/function-agent";\n\nconst latest = process.argv.includes("--latest");\n\nconst cloned = GitHub.cloneSubFunctions({ latest });\n\nconsole.log("\\n=== CLONE_RESULTS ===");\nconsole.log(JSON.stringify(cloned, null, 2));\n';

// assets/getSubFunctionCommits.ts.txt
var getSubFunctionCommits_ts_default = 'import { execSync } from "child_process";\nimport { existsSync, readdirSync, readFileSync } from "fs";\n\ninterface SubFunctionInfo {\n  index: number;\n  owner: string;\n  repository: string;\n  commit: string;\n  path: string;\n}\n\nfunction main(): void {\n  const subFunctionsDir = "sub_functions";\n\n  if (!existsSync(subFunctionsDir)) {\n    console.log("No sub_functions directory found.");\n    console.log("\\n=== SUB_FUNCTION_COMMITS ===");\n    console.log("[]");\n    return;\n  }\n\n  const entries = readdirSync(subFunctionsDir);\n  const results: SubFunctionInfo[] = [];\n\n  for (const entry of entries) {\n    // Skip non-numeric directories (like .gitignore)\n    const index = parseInt(entry, 10);\n    if (isNaN(index)) continue;\n\n    const subFunctionPath = `${subFunctionsDir}/${entry}`;\n\n    // Get the commit SHA from git\n    let commit: string;\n    try {\n      commit = execSync("git rev-parse HEAD", {\n        cwd: subFunctionPath,\n        encoding: "utf-8",\n        stdio: "pipe",\n      }).trim();\n    } catch {\n      console.log(`Failed to get commit for ${subFunctionPath}`);\n      continue;\n    }\n\n    // Get owner/repository from github/name.json if it exists\n    let owner = "";\n    let repository = "";\n    const namePath = `${subFunctionPath}/github/name.json`;\n    if (existsSync(namePath)) {\n      const name = JSON.parse(readFileSync(namePath, "utf-8")) as string;\n      const parts = name.split("/");\n      if (parts.length === 2) {\n        owner = parts[0];\n        repository = parts[1];\n      }\n    }\n\n    results.push({\n      index,\n      owner,\n      repository,\n      commit,\n      path: subFunctionPath,\n    });\n  }\n\n  // Sort by index\n  results.sort((a, b) => a.index - b.index);\n\n  console.log("\\n=== SUB_FUNCTION_COMMITS ===");\n  console.log(JSON.stringify(results, null, 2));\n}\n\nmain();\n';

// assets/installRustLogs.ts.txt
var installRustLogs_ts_default = 'import { execSync } from "child_process";\n\n// Rebuild the ObjectiveAI packages with any changes made to the Rust source\n// This rebuilds objectiveai-js (which includes WASM) and objectiveai-function-agent-js\n\nconsole.log("Rebuilding ObjectiveAI packages...");\n\n// Install dependencies in the submodule workspace\nexecSync("npm install", { cwd: "objectiveai", stdio: "inherit" });\n\n// Build objectiveai-js first (includes WASM rebuild)\nexecSync("npm run build -w objectiveai-js", { cwd: "objectiveai", stdio: "inherit" });\n\n// Build objectiveai-function-agent-js (depends on objectiveai-js)\nexecSync("npm run build -w objectiveai-function-agent-js", { cwd: "objectiveai", stdio: "inherit" });\n\n// Reinstall in function workspace to pick up the rebuilt packages\nexecSync("npm install", { stdio: "inherit" });\n\nconsole.log("Rebuild complete. Run ts-node build.ts to test.");\n';

// assets/plans/.gitkeep.txt
var gitkeep_default = "";

// assets/logs/.gitignore.txt
var gitignore_default2 = "*\n!.gitignore\n";

// assets/ESSAY.md.txt
var ESSAY_md_default = "";

// assets/ESSAY_TASKS.md.txt
var ESSAY_TASKS_md_default = "";

// assets/sub_functions/.gitignore.txt
var gitignore_default3 = "*\n!.gitignore\n";

// assets/inputs.json.txt
var inputs_json_default = "[]\n";

// src/assets.ts
var assets = {
  "function/description.json": description_json_default,
  "function/input_maps.json": input_maps_json_default,
  "function/input_merge.json": input_merge_json_default,
  "function/input_schema.json": input_schema_json_default,
  "function/input_split.json": input_split_json_default,
  "function/output.json": output_json_default,
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
    "git submodule add -b function-agent-js https://github.com/ObjectiveAI/objectiveai objectiveai"
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

export { assets, init };
