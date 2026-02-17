import z from "zod";
import { join } from "path";
import { Parameters, ParametersSchema } from "./parameters";
import { Functions } from "objectiveai";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import {
  PlaceholderTaskSpecs,
  PlaceholderTaskSpecsSchema,
} from "./placeholder";
import { fetchRemoteFunctions } from "./github";
import { CliFunctionExt } from "./ext";
import { State } from "./state/state";
import { BranchScalarState } from "./state/branchScalarState";
import { BranchVectorState } from "./state/branchVectorState";

export const QualityFunctionSchema = z.object({
  parameters: ParametersSchema,
  name: z.string().nonempty(),
  function: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("branch.scalar.function"),
      function: Functions.QualityBranchRemoteScalarFunctionSchema,
    }),
    z.object({
      type: z.literal("branch.vector.function"),
      function: Functions.QualityBranchRemoteVectorFunctionSchema,
    }),
    z.object({
      type: z.literal("leaf.scalar.function"),
      function: Functions.QualityLeafRemoteScalarFunctionSchema,
    }),
    z.object({
      type: z.literal("leaf.vector.function"),
      function: Functions.QualityLeafRemoteVectorFunctionSchema,
    }),
  ]),
  placeholderTaskSpecs: PlaceholderTaskSpecsSchema.optional(),
});
export type QualityFunction = z.infer<typeof QualityFunctionSchema>;

// Read

function readTextFromFilesystem(path: string): string | null {
  try {
    if (!existsSync(path)) return null;
    const content = readFileSync(path, "utf-8").trim();
    return content || null;
  } catch {
    return null;
  }
}

function readNameFromFilesystem(path: string): string | null {
  return readTextFromFilesystem(join(path, "name.txt"));
}

function readJsonFromFilesystem(path: string): unknown | null {
  try {
    const text = readTextFromFilesystem(path);
    if (text === null) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function readParametersFromFilesystem(path: string): Parameters | null {
  const json = readJsonFromFilesystem(join(path, "parameters.json"));
  if (json === null) return null;
  const result = ParametersSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}

function readFunctionFromFilesystem(
  path: string,
): Functions.RemoteFunction | null {
  const json = readJsonFromFilesystem(join(path, "function.json"));
  if (json === null) return null;
  const result = Functions.RemoteFunctionSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}

function readPlaceholderTaskSpecsFromFilesystem(
  path: string,
): PlaceholderTaskSpecs | null {
  const json = readJsonFromFilesystem(
    join(path, "placeholder_task_specs.json"),
  );
  if (json === null) return null;
  const result = PlaceholderTaskSpecsSchema.safeParse(json);
  if (!result.success) return null;
  return result.data;
}

export async function readQualityFunctionFromFilesystem(
  dir: string,
): Promise<QualityFunction | null> {
  const parameters = readParametersFromFilesystem(dir);
  if (parameters === null) return null;
  const name = readNameFromFilesystem(dir);
  if (name === null) return null;
  const fn = readFunctionFromFilesystem(dir);
  if (fn === null) return null;
  if (parameters.depth > 0) {
    // validate that all placeholder tasks have a corresponding spec
    const placeholderTaskSpecs = readPlaceholderTaskSpecsFromFilesystem(dir);
    for (let i = 0; i < fn.tasks.length; i++) {
      const task = fn.tasks[i];
      if (
        task.type === "placeholder.scalar.function" ||
        task.type === "placeholder.vector.function"
      ) {
        if (
          placeholderTaskSpecs === null ||
          placeholderTaskSpecs[i] === null ||
          placeholderTaskSpecs[i] === undefined
        ) {
          return null;
        }
      }
    }
    if (fn.type === "scalar.function") {
      // validate that this is a quality branch scalar function
      const parsed =
        Functions.QualityBranchRemoteScalarFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      const children = await fetchRemoteFunctions(
        CliFunctionExt.remoteChildren(parsed.data),
      );
      if (children === null) return null;
      try {
        Functions.Quality.checkBranchScalarFunction(parsed.data, children);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "branch.scalar.function", function: parsed.data },
        placeholderTaskSpecs: placeholderTaskSpecs ?? undefined,
      };
    } else if (fn.type === "vector.function") {
      // validate that this is a quality branch vector function
      const parsed =
        Functions.QualityBranchRemoteVectorFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      const children = await fetchRemoteFunctions(
        CliFunctionExt.remoteChildren(parsed.data),
      );
      if (children === null) return null;
      try {
        Functions.Quality.checkBranchVectorFunction(parsed.data, children);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "branch.vector.function", function: parsed.data },
        placeholderTaskSpecs: placeholderTaskSpecs ?? undefined,
      };
    }
  } else {
    if (fn.type === "scalar.function") {
      // validate that this is a quality leaf scalar function
      const parsed =
        Functions.QualityLeafRemoteScalarFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      try {
        Functions.Quality.checkLeafScalarFunction(parsed.data);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "leaf.scalar.function", function: parsed.data },
      };
    } else if (fn.type === "vector.function") {
      // validate that this is a quality leaf vector function
      const parsed =
        Functions.QualityLeafRemoteVectorFunctionSchema.safeParse(fn);
      if (!parsed.success) return null;
      try {
        Functions.Quality.checkLeafVectorFunction(parsed.data);
      } catch {
        return null;
      }
      return {
        parameters,
        name,
        function: { type: "leaf.vector.function", function: parsed.data },
      };
    }
  }
  return null;
}

// Write

function writeTextToFilesystem(path: string, content: string): void {
  writeFileSync(path, content, "utf-8");
}

function writeJsonToFilesystem(path: string, data: unknown): void {
  writeTextToFilesystem(path, JSON.stringify(data, null, 2));
}

function writeNameToFilesystem(dir: string, name: string): void {
  writeTextToFilesystem(join(dir, "name.txt"), name);
}

function writeParametersToFilesystem(
  dir: string,
  parameters: Parameters,
): void {
  writeJsonToFilesystem(join(dir, "parameters.json"), parameters);
}

export function writeFunctionToFilesystem(
  dir: string,
  fn: Functions.RemoteFunction,
): void {
  writeJsonToFilesystem(join(dir, "function.json"), fn);
}

function writeInventSpecToFilesystem(dir: string, spec: string): void {
  writeTextToFilesystem(join(dir, "INVENT_SPEC.md"), spec);
}

function writeInventEssayToFilesystem(dir: string, essay: string): void {
  writeTextToFilesystem(join(dir, "INVENT_ESSAY.md"), essay);
}

function writeInventEssayTasksToFilesystem(
  dir: string,
  essayTasks: string,
): void {
  writeTextToFilesystem(join(dir, "INVENT_ESSAY_TASKS.md"), essayTasks);
}

function writeReadmeToFilesystem(dir: string, readme: string): void {
  writeTextToFilesystem(join(dir, "README.md"), readme);
}

function writePlaceholderTaskSpecsToFilesystem(
  dir: string,
  specs: PlaceholderTaskSpecs,
): void {
  writeJsonToFilesystem(join(dir, "placeholder_task_specs.json"), specs);
}

export function writeGitignoreToFilesystem(dir: string): void {
  const content = [
    "# Ignore everything",
    "*",
    "",
    "# Allow specific files",
    "!.gitignore",
    "!name.txt",
    "!parameters.json",
    "!function.json",
    "!INVENT_SPEC.md",
    "!INVENT_ESSAY.md",
    "!INVENT_ESSAY_TASKS.md",
    "!README.md",
    "!placeholder_task_specs.json",
    "",
  ].join("\n");
  writeTextToFilesystem(join(dir, ".gitignore"), content);
}

export function writeInitialStateToFilesystem(
  dir: string,
  state: State,
  parameters: Parameters,
): void {
  mkdirSync(dir, { recursive: true });

  const name = state.getName();
  if (!name.ok) throw new Error("Name not set");
  writeNameToFilesystem(dir, name.value);

  writeParametersToFilesystem(dir, parameters);

  writeGitignoreToFilesystem(dir);
}

export function writeFinalStateToFilesystem(
  dir: string,
  state: State,
  parameters: Parameters,
): void {
  writeInitialStateToFilesystem(dir, state, parameters);

  const inner = state.inner;
  if (!inner) throw new Error("Inner state not set");
  writeFunctionToFilesystem(dir, inner.function as Functions.RemoteFunction);

  writeInventSpecToFilesystem(dir, state.inventSpec);

  const essay = state.getInventEssay();
  if (essay.ok) writeInventEssayToFilesystem(dir, essay.value);

  const essayTasks = state.getInventEssayTasks();
  if (essayTasks.ok) writeInventEssayTasksToFilesystem(dir, essayTasks.value);

  const readme = state.getReadme();
  if (readme.ok) writeReadmeToFilesystem(dir, readme.value);

  if (
    inner instanceof BranchScalarState ||
    inner instanceof BranchVectorState
  ) {
    const specs = inner.getPlaceholderTaskSpecs();
    if (specs) writePlaceholderTaskSpecsToFilesystem(dir, specs);
  }
}
