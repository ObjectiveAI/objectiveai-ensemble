import { existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { ObjectiveAI, Functions } from "objectiveai";
import { AgentOptions } from "./agentOptions";

export interface Parameters {
  depth: number;
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
  if (existsSync(join("examples", "examples.json"))) {
    return;
  }

  const objectiveai = new ObjectiveAI(apiBase ? { apiBase } : undefined);

  const { data: pairs } = await Functions.listPairs(objectiveai);
  const shuffled = pairs.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));

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

  mkdirSync("examples", { recursive: true });
  writeFileSync(
    join("examples", "examples.json"),
    JSON.stringify(selected, null, 2),
  );
}

function writeGitignore(): void {
  if (existsSync(".gitignore")) {
    return;
  }
  writeFileSync(
    ".gitignore",
    ["examples/", "agent_functions/", "networkTests/", ""].join("\n"),
  );
}

export async function init(options: AgentOptions = {}): Promise<void> {
  // Write .gitignore
  writeGitignore();

  // Fetch examples if needed
  await fetchExamples(options.apiBase);

  // Write parameters.json if missing
  if (!existsSync("parameters.json")) {
    const parameters: Parameters = {
      depth: options.depth ?? 0,
    };
    writeFileSync("parameters.json", JSON.stringify(parameters, null, 2));
  }
}
