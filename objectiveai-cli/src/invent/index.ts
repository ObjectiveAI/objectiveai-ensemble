import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { State } from "../state/state";
import { AgentStepFn } from "./agent";
import { Parameters, ParametersBuilder, buildParameters } from "../parameters";
import { Functions } from "objectiveai";
import {
  readQualityFunctionFromFilesystem,
  writeStateToFilesystem,
  writeFunctionToFilesystem,
} from "../fs";
import {
  getOwnerRepositoryCommit,
  OwnerRepositoryCommit,
} from "../github";
import {
  stepName,
  stepType,
  stepFields,
  stepEssay,
  stepEssayTasks,
  stepPlan,
  stepBody,
  stepDescription,
} from "./steps";

interface InventOptionsBase {
  dir: string;
  inventSpec?: string;
  parameters?: ParametersBuilder;
  agent: AgentStepFn;
}

export type InventOptions =
  | InventOptionsBase
  | (InventOptionsBase & { type: "scalar.function" })
  | (InventOptionsBase & {
      type: "vector.function";
      output_length?: Functions.RemoteVectorFunction["output_length"];
      input_split?: Functions.RemoteVectorFunction["input_split"];
      input_merge?: Functions.RemoteVectorFunction["input_merge"];
    });

export async function invent(options: InventOptions): Promise<void> {
  if (options.inventSpec !== undefined) {
    await stage1(options as typeof options & { inventSpec: string });
  }
  await stage2(options);
}

async function stage1({
  dir,
  parameters,
  inventSpec,
  agent,
  ...stateOptions
}: InventOptions & { inventSpec: string }): Promise<void> {
  const state = new State({
    parameters: buildParameters(parameters),
    inventSpec,
    ...stateOptions,
  });

  await stepName(state, agent);
  await stepType(state, agent);
  await stepFields(state, agent);
  await stepEssay(state, agent);
  await stepEssayTasks(state, agent);
  await stepPlan(state, agent);
  await stepBody(state, agent);
  await stepDescription(state, agent);

  writeStateToFilesystem(dir, state, buildParameters(parameters));
}

async function stage2({ dir, agent }: InventOptions): Promise<void> {
  const qualityFn = await readQualityFunctionFromFilesystem(dir);
  if (!qualityFn) return;

  if (
    qualityFn.function.type !== "branch.scalar.function" &&
    qualityFn.function.type !== "branch.vector.function"
  ) {
    return; // Leaf functions have no sub-functions
  }

  const specs = qualityFn.placeholderTaskSpecs;
  if (!specs) return;

  const subDir = join(dir, "sub_functions");
  mkdirSync(subDir, { recursive: true });

  const subParameters: Parameters = {
    ...qualityFn.parameters,
    depth: qualityFn.parameters.depth - 1,
  };

  const tasks = qualityFn.function.function.tasks;
  const subInvents: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const spec = specs[i];
    if (spec === null || spec === undefined) continue;

    const task = tasks[i];
    const subFunctionDir = join(subDir, String(i));

    // If a valid quality function already exists on disk, skip stage1
    if (
      existsSync(subFunctionDir) &&
      (await readQualityFunctionFromFilesystem(subFunctionDir))
    ) {
      subInvents.push(
        invent({
          dir: subFunctionDir,
          parameters: subParameters,
          agent,
        }),
      );
    } else if (task.type === "placeholder.vector.function") {
      subInvents.push(
        invent({
          dir: subFunctionDir,
          inventSpec: spec,
          parameters: subParameters,
          agent,
          type: "vector.function",
          output_length: task.output_length,
          input_split: task.input_split,
          input_merge: task.input_merge,
        }),
      );
    } else if (task.type === "placeholder.scalar.function") {
      subInvents.push(
        invent({
          dir: subFunctionDir,
          inventSpec: spec,
          parameters: subParameters,
          agent,
          type: "scalar.function",
        }),
      );
    }
  }

  // Await all sub-invents, collecting errors to throw later
  const errors: unknown[] = [];
  const results = await Promise.allSettled(subInvents);
  for (const result of results) {
    if (result.status === "rejected") errors.push(result.reason);
  }

  // Closer: replace resolved placeholders with real function task references
  let replaced = false;
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (
      task.type !== "placeholder.scalar.function" &&
      task.type !== "placeholder.vector.function"
    ) {
      continue;
    }

    const subFunctionDir = join(subDir, String(i));

    const subQualityFn =
      await readQualityFunctionFromFilesystem(subFunctionDir);
    if (!subQualityFn) continue;

    // Assert sub-function has no placeholder tasks remaining
    if (hasPlaceholderTasks(subQualityFn.function.function)) continue;

    const orc = await getOwnerRepositoryCommit(subFunctionDir);
    if (!orc) continue;

    replacePlaceholderTask(tasks, i, task, orc);
    replaced = true;
  }

  if (replaced) {
    writeFunctionToFilesystem(
      dir,
      qualityFn.function.function as Functions.RemoteFunction,
    );
  }

  // Re-throw any sub-invent errors
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors);
}

function hasPlaceholderTasks(fn: Functions.RemoteFunction): boolean {
  return fn.tasks.some(
    (t) =>
      t.type === "placeholder.scalar.function" ||
      t.type === "placeholder.vector.function",
  );
}

function replacePlaceholderTask(
  tasks: Functions.RemoteFunction["tasks"],
  index: number,
  placeholder: Functions.RemoteFunction["tasks"][number],
  orc: OwnerRepositoryCommit,
): void {
  if (placeholder.type === "placeholder.scalar.function") {
    tasks[index] = {
      type: "scalar.function",
      owner: orc.owner,
      repository: orc.repository,
      commit: orc.commit,
      skip: placeholder.skip,
      map: placeholder.map,
      input: placeholder.input,
      output: placeholder.output,
    };
  } else if (placeholder.type === "placeholder.vector.function") {
    tasks[index] = {
      type: "vector.function",
      owner: orc.owner,
      repository: orc.repository,
      commit: orc.commit,
      skip: placeholder.skip,
      map: placeholder.map,
      input: placeholder.input,
      output: placeholder.output,
    };
  }
}
