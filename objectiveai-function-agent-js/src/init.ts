import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { ObjectiveAI, Functions } from "objectiveai";
import { assets } from "./assets";
import { AgentOptions } from "./agentOptions";

// Helper to execute commands silently
function exec(command: string): string {
  try {
    return execSync(command, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch {
    return "";
  }
}

// Helper to execute commands with logging
function execLog(command: string): void {
  console.log(`> ${command}`);
  execSync(command, { stdio: "inherit" });
}

// Check if we're in a git repository
function isGitRepo(): boolean {
  return existsSync(".git");
}

// Initialize git and add objectiveai submodule
function initializeGit(): void {
  console.log("Initializing git repository...");
  execLog("git init");
  execLog(
    "git submodule add https://github.com/ObjectiveAI/objectiveai objectiveai",
  );
  execLog("git submodule update --init --recursive");
}

// Update submodules
function updateSubmodules(): void {
  console.log("Updating git submodules...");
  execLog("git submodule update --init --recursive --remote --force");
}

// Install npm dependencies
function runNpmInstall(): void {
  console.log("Installing dependencies...");
  execLog("npm install");
  // Reset submodule to discard any line ending changes from npm
  exec("git -C objectiveai checkout -- .");
}

// Check if there are any uncommitted changes or untracked files
function hasChanges(): boolean {
  const status = exec("git status --porcelain");
  return status.length > 0;
}

// Check if this is the first commit
function isFirstCommit(): boolean {
  const result = exec("git rev-parse HEAD");
  return result.length === 0;
}

// Create commit if there are changes
function commitChanges(): void {
  if (!hasChanges()) {
    return;
  }
  const message = isFirstCommit() ? "initial commit" : "update sandbox";
  console.log(`Creating commit: ${message}...`);
  execLog("git add -A");
  execLog(`git commit -m "${message}"`);
}

// Types for function/profile references
type FunctionRef = { owner: string; repository: string; commit: string };
type ProfileRef = { owner: string; repository: string; commit: string };

function getFunctionPath(ref: FunctionRef): string {
  return join(
    "examples",
    "functions",
    ref.owner,
    ref.repository,
    ref.commit,
    "function.json",
  );
}

function getProfilePath(ref: ProfileRef): string {
  return join(
    "examples",
    "profiles",
    ref.owner,
    ref.repository,
    ref.commit,
    "profile.json",
  );
}

function functionExists(ref: FunctionRef): boolean {
  return existsSync(getFunctionPath(ref));
}

function profileExists(ref: ProfileRef): boolean {
  return existsSync(getProfilePath(ref));
}

function writeFunction(ref: FunctionRef, data: unknown): void {
  const path = getFunctionPath(ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function writeProfile(ref: ProfileRef, data: unknown): void {
  const path = getProfilePath(ref);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

async function fetchFunctionRecursively(
  objectiveai: ObjectiveAI,
  ref: FunctionRef,
): Promise<void> {
  if (functionExists(ref)) {
    return;
  }

  console.log(
    `Fetching function: ${ref.owner}/${ref.repository}/${ref.commit}`,
  );
  const func = await Functions.retrieve(
    objectiveai,
    ref.owner,
    ref.repository,
    ref.commit,
  );
  writeFunction(ref, func);

  // Find sub-function tasks and fetch them recursively
  for (const task of func.tasks) {
    if (task.type === "scalar.function" || task.type === "vector.function") {
      const subRef: FunctionRef = {
        owner: task.owner,
        repository: task.repository,
        commit: task.commit,
      };
      await fetchFunctionRecursively(objectiveai, subRef);
    }
  }
}

function isRemoteProfileTask(
  task: Functions.TaskProfile,
): task is Functions.RemoteFunctionTaskProfile {
  return (
    "owner" in task &&
    "repository" in task &&
    "commit" in task &&
    !("tasks" in task) &&
    !("ensemble" in task)
  );
}

function isInlineProfileTask(
  task: Functions.TaskProfile,
): task is Functions.InlineFunctionTaskProfile {
  return "tasks" in task && !("ensemble" in task);
}

async function fetchProfileRecursively(
  objectiveai: ObjectiveAI,
  ref: ProfileRef,
): Promise<void> {
  if (profileExists(ref)) {
    return;
  }

  console.log(`Fetching profile: ${ref.owner}/${ref.repository}/${ref.commit}`);
  const profile = await Functions.Profiles.retrieve(
    objectiveai,
    ref.owner,
    ref.repository,
    ref.commit,
  );
  writeProfile(ref, profile);

  // Find sub-profiles and fetch them recursively
  async function processTaskProfiles(
    tasks: Functions.TaskProfile[],
  ): Promise<void> {
    for (const task of tasks) {
      if (isRemoteProfileTask(task)) {
        const subRef: ProfileRef = {
          owner: task.owner,
          repository: task.repository,
          commit: task.commit,
        };
        await fetchProfileRecursively(objectiveai, subRef);
      } else if (isInlineProfileTask(task)) {
        await processTaskProfiles(task.tasks);
      }
    }
  }

  await processTaskProfiles(profile.tasks);
}

async function fetchExamples(apiBase?: string): Promise<void> {
  // Skip if examples.json already exists
  if (existsSync(join("examples", "examples.json"))) {
    console.log("examples/examples.json already exists, skipping fetch.");
    return;
  }

  const objectiveai = new ObjectiveAI({ apiBase });

  // List all function-profile pairs
  const { data: pairs } = await Functions.listPairs(objectiveai);
  // Randomly select up to 10 pairs
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));

  console.log(`Selected ${selected.length} function-profile pairs`);

  // Fetch each function and profile recursively
  for (const pair of selected) {
    const funcRef: FunctionRef = {
      owner: pair.function.owner,
      repository: pair.function.repository,
      commit: pair.function.commit,
    };
    const profileRef: ProfileRef = {
      owner: pair.profile.owner,
      repository: pair.profile.repository,
      commit: pair.profile.commit,
    };

    await fetchFunctionRecursively(objectiveai, funcRef);
    await fetchProfileRecursively(objectiveai, profileRef);
  }

  // Write examples.json with the selected root pairs
  mkdirSync("examples", { recursive: true });
  writeFileSync(
    join("examples", "examples.json"),
    JSON.stringify(selected, null, 2),
  );

  console.log("Examples fetched. Root pairs saved to examples/examples.json");
}

function writeAssets(): void {
  console.log("Writing asset files...");

  for (const [relativePath, content] of Object.entries(assets)) {
    const dir = dirname(relativePath);
    if (dir !== ".") {
      mkdirSync(dir, { recursive: true });
    }

    // For empty files or "null" JSON files, only write if file doesn't exist
    // For all other assets with content, always overwrite
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

export interface Parameters {
  depth: number;
}

export async function init(options: AgentOptions = {}): Promise<void> {
  // Step 1: Git setup
  if (!isGitRepo()) {
    initializeGit();
  } else {
    updateSubmodules();
  }

  // Step 2: Write asset files (including package.json)
  writeAssets();

  // Step 2.5: Write github/name.json with name option if provided
  if (options.name) {
    const namePath = "github/name.json";
    const existing = existsSync(namePath)
      ? readFileSync(namePath, "utf-8").trim()
      : "";
    if (!existing || existing === "null") {
      console.log(`Writing github/name.json with: ${options.name}`);
      writeFileSync(namePath, JSON.stringify(options.name));
    }
  }

  // Step 3: npm install (also resets submodule after)
  runNpmInstall();

  // Step 4: Fetch examples if needed
  await fetchExamples(options.apiBase);

  // Step 5: Write SPEC.md if doesn't already exist non-empty
  const specPath = "SPEC.md";
  const specExists =
    existsSync(specPath) && readFileSync(specPath, "utf-8").trim().length > 0;
  if (!specExists) {
    console.log("Writing SPEC.md...");
    writeFileSync(specPath, options.spec ?? "");
  }

  // Step 6: Write parameters.json if missing
  if (!existsSync("parameters.json")) {
    const parameters: Parameters = {
      depth: options.depth ?? 0,
    };
    console.log("Writing parameters.json...");
    writeFileSync("parameters.json", JSON.stringify(parameters, null, 2));
  }

  // Step 7: Commit changes if any
  commitChanges();

  console.log("Initialization complete.");
}
