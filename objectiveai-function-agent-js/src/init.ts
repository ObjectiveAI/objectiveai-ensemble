import { existsSync, mkdirSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { ObjectiveAI, Functions } from "objectiveai";
import { AgentOptions } from "./agentOptions";

export interface Parameters {
  depth: number;
}

type FunctionRef = { owner: string; repository: string; commit: string };

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

function functionExists(ref: FunctionRef): boolean {
  return existsSync(getFunctionPath(ref));
}

function writeFunction(ref: FunctionRef, data: unknown): void {
  const path = getFunctionPath(ref);
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

async function fetchExamples(apiBase?: string, apiKey?: string): Promise<void> {
  if (existsSync(join("examples", "examples.json"))) {
    return;
  }

  const objectiveai = new ObjectiveAI({ ...(apiBase && { apiBase }), ...(apiKey && { apiKey }) });

  const { data: functions } = await Functions.list(objectiveai);
  const shuffled = functions.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(10, shuffled.length));

  for (const func of selected) {
    await fetchFunctionRecursively(objectiveai, func);
  }

  mkdirSync("examples", { recursive: true });
  writeFileSync(
    join("examples", "examples.json"),
    JSON.stringify(selected, null, 2),
  );
}

function writeGitignore(): void {
  writeFileSync(
    ".gitignore",
    ["examples/", "agent_functions/", "networkTests/", ""].join("\n"),
  );
}

export async function init(options: AgentOptions = {}): Promise<void> {
  // Initialize git repo if needed
  if (!existsSync(".git")) {
    execSync("git init", { stdio: "pipe" });
  }

  // Write .gitignore
  writeGitignore();

  // Fetch examples if needed
  await fetchExamples(options.apiBase, options.apiKey);

  // Write parameters.json if missing
  if (!existsSync("parameters.json")) {
    const parameters: Parameters = {
      depth: options.depth ?? 0,
    };
    writeFileSync("parameters.json", JSON.stringify(parameters, null, 2));
  }
}
