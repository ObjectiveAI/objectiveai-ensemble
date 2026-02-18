import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { State } from "../state/state";
import { getAgentStepFn } from "./agent";
import { Parameters, ParametersBuilder, buildParameters } from "../parameters";
import { Functions } from "objectiveai";
import {
  readQualityFunctionFromFilesystem,
  writeInitialStateToFilesystem,
  writeFinalStateToFilesystem,
  writeFunctionToFilesystem,
} from "../fs";
import {
  getOwnerRepositoryCommit,
  OwnerRepositoryCommit,
  pushFinal,
  pushInitial,
} from "../github";
import { isDirty } from "../git";
import {
  stepName,
  stepType,
  stepFields,
  stepEssay,
  stepEssayTasks,
  stepBody,
  stepDescription,
} from "./steps";
import { AgentUpstream } from "src/upstream";
import { getGitHubToken } from "src/config";

interface InventOptionsBase {
  dir: string;
  inventSpec?: string;
  parameters?: ParametersBuilder;
  agentUpstream: AgentUpstream;
  gitHubToken?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
}

export type InventOptions =
  | InventOptionsBase
  | (InventOptionsBase & {
      type: "scalar.function";
      input_schema?: Functions.RemoteScalarFunction["input_schema"];
    })
  | (InventOptionsBase & {
      type: "vector.function";
      input_schema?: Functions.RemoteVectorFunction["input_schema"];
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
  agentUpstream,
  gitHubToken: stateGitHubToken,
  gitAuthorName: stateGitAuthorName,
  gitAuthorEmail: stateGitAuthorEmail,
  ...stateOptions
}: InventOptions & { inventSpec: string }): Promise<void> {
  const gitHubToken =
    stateGitHubToken ??
    getGitHubToken() ??
    (() => {
      throw new Error("gitHubToken required");
    })();
  const gitAuthorName =
    stateGitAuthorName ??
    (() => {
      throw new Error("gitAuthorName required");
    })();
  const gitAuthorEmail =
    stateGitAuthorEmail ??
    (() => {
      throw new Error("gitAuthorEmail required");
    })();

  const state = new State({
    parameters: buildParameters(parameters),
    inventSpec,
    gitHubToken,
    ...stateOptions,
  });
  const agent = getAgentStepFn(agentUpstream);

  let agentState = await stepName(state, agent);
  writeInitialStateToFilesystem(dir, state, state.parameters);
  pushInitial({
    dir,
    name: state.getName().value!,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message: "initial commit",
  });

  agentState = await stepType(state, agent, agentState);
  agentState = await stepFields(state, agent, agentState);
  agentState = await stepEssay(state, agent, agentState);
  agentState = await stepEssayTasks(state, agent, agentState);
  agentState = await stepBody(state, agent, agentState);
  agentState = await stepDescription(state, agent, agentState);

  writeFinalStateToFilesystem(dir, state, state.parameters);
  pushFinal({
    dir,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message: `implement ${state.getName().value!}`,
    description: state.getDescription().value!,
  });
}

async function stage2({
  dir,
  agentUpstream,
  gitHubToken: stateGitHubToken,
  gitAuthorName: stateGitAuthorName,
  gitAuthorEmail: stateGitAuthorEmail,
}: InventOptions): Promise<void> {
  const qualityFn = await readQualityFunctionFromFilesystem(dir);
  if (!qualityFn) return;

  const gitHubToken =
    stateGitHubToken ??
    getGitHubToken() ??
    (() => {
      throw new Error("gitHubToken required");
    })();
  const gitAuthorName =
    stateGitAuthorName ??
    (() => {
      throw new Error("gitAuthorName required");
    })();
  const gitAuthorEmail =
    stateGitAuthorEmail ??
    (() => {
      throw new Error("gitAuthorEmail required");
    })();

  if (isDirty(dir)) {
    pushFinal({
      dir,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      message: `update ${qualityFn.name}`,
      description: qualityFn.function.function.description ?? "",
    });
  }

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
          gitHubToken,
          gitAuthorName,
          gitAuthorEmail,
          agentUpstream,
        }),
      );
    } else if (task.type === "placeholder.vector.function") {
      subInvents.push(
        invent({
          dir: subFunctionDir,
          inventSpec: spec,
          parameters: subParameters,
          gitHubToken,
          gitAuthorName,
          gitAuthorEmail,
          agentUpstream,
          type: "vector.function",
          input_schema: task.input_schema,
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
          gitHubToken,
          gitAuthorName,
          gitAuthorEmail,
          agentUpstream,
          type: "scalar.function",
          input_schema: task.input_schema,
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
    pushFinal({
      dir,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      message: `update ${qualityFn.name}`,
      description: qualityFn.function.function.description ?? "",
    });
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
