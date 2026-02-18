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
import { AgentUpstream } from "../upstream";
import { getAgentUpstream, getGitHubToken } from "../config";
import { Notification, NotificationMessage } from "../notification";

interface InventOptionsBase {
  inventSpec?: string;
  parameters?: ParametersBuilder;
  agentUpstream?: AgentUpstream;
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

export async function invent(
  dir: string,
  options: InventOptions,
  onNotification: (notification: Notification) => void,
  notificationOptions?: { parent: string; taskIndex: number },
): Promise<void> {
  if (options.inventSpec !== undefined) {
    await stage1(
      dir,
      options as typeof options & { inventSpec: string },
      onNotification,
      notificationOptions,
    );
  }
  await stage2(dir, options, onNotification);
}

async function stage1(
  dir: string,
  {
    parameters,
    inventSpec,
    agentUpstream: stateAgentUpstream,
    gitHubToken: stateGitHubToken,
    gitAuthorName: stateGitAuthorName,
    gitAuthorEmail: stateGitAuthorEmail,
    ...stateOptions
  }: InventOptions & { inventSpec: string },
  onNotification: (notification: Notification) => void,
  notificationOptions?: { parent: string; taskIndex: number },
): Promise<void> {
  const agentUpstream =
    stateAgentUpstream ??
    getAgentUpstream() ??
    (() => {
      throw new Error("agentUpstream required");
    })();
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

  let boundOnNotification = notificationOptions
    ? (message: NotificationMessage) =>
        onNotification({ ...notificationOptions, message })
    : (message: NotificationMessage) => onNotification({ message });
  let agentState = await stepName(state, agent, boundOnNotification);

  const name = state.getName().value!;
  writeInitialStateToFilesystem(dir, state, state.parameters);
  pushInitial({
    dir,
    name,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message: "initial commit",
  });

  boundOnNotification = notificationOptions
    ? (message: NotificationMessage) =>
        onNotification({ ...notificationOptions, name, message })
    : (message: NotificationMessage) => onNotification({ name, message });
  agentState = await stepType(state, agent, boundOnNotification, agentState);
  agentState = await stepFields(state, agent, boundOnNotification, agentState);
  agentState = await stepEssay(state, agent, boundOnNotification, agentState);
  agentState = await stepEssayTasks(
    state,
    agent,
    boundOnNotification,
    agentState,
  );
  agentState = await stepBody(state, agent, boundOnNotification, agentState);
  agentState = await stepDescription(
    state,
    agent,
    boundOnNotification,
    agentState,
  );

  boundOnNotification({ role: "done" });

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

async function stage2(
  dir: string,
  {
    agentUpstream: stateAgentUpstream,
    gitHubToken: stateGitHubToken,
    gitAuthorName: stateGitAuthorName,
    gitAuthorEmail: stateGitAuthorEmail,
  }: InventOptions,
  onNotification: (notification: Notification) => void,
): Promise<void> {
  const qualityFn = await readQualityFunctionFromFilesystem(dir);
  if (!qualityFn) return;

  const agentUpstream =
    stateAgentUpstream ??
    getAgentUpstream() ??
    (() => {
      throw new Error("agentUpstream required");
    })();
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

    // If a valid quality function already exists on disk + on GitHub, skip stage1
    if (
      existsSync(subFunctionDir) &&
      (await readQualityFunctionFromFilesystem(subFunctionDir)) &&
      (await getOwnerRepositoryCommit(subFunctionDir))
    ) {
      subInvents.push(
        invent(
          subFunctionDir,
          {
            parameters: subParameters,
            agentUpstream,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail,
          },
          onNotification,
          { parent: qualityFn.name, taskIndex: i },
        ),
      );
    } else if (task.type === "placeholder.vector.function") {
      subInvents.push(
        invent(
          subFunctionDir,
          {
            inventSpec: spec,
            parameters: subParameters,
            agentUpstream,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail,
            type: "vector.function",
            input_schema: task.input_schema,
            output_length: task.output_length,
            input_split: task.input_split,
            input_merge: task.input_merge,
          },
          onNotification,
          { parent: qualityFn.name, taskIndex: i },
        ),
      );
    } else if (task.type === "placeholder.scalar.function") {
      subInvents.push(
        invent(
          subFunctionDir,
          {
            inventSpec: spec,
            parameters: subParameters,
            agentUpstream,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail,
            type: "scalar.function",
            input_schema: task.input_schema,
          },
          onNotification,
          { parent: qualityFn.name, taskIndex: i },
        ),
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
