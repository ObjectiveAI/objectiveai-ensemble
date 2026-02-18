import { join } from "path";
import { mkdirSync } from "fs";
import { State } from "../state/state";
import { AgentStepFn, getAgentStepFn } from "../agent";
import { Parameters, ParametersBuilder, buildParameters } from "../parameters";
import { Functions } from "objectiveai";
import {
  readQualityFunctionFromFilesystem,
  writeInitialStateToFilesystem,
  writeFinalStateToFilesystem,
  writeFunctionToFilesystem,
} from "../fs";
import {
  GitHubBackend,
  DefaultGitHubBackend,
  OwnerRepositoryCommit,
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
import {
  getAgentUpstream,
  getGitAuthorEmail,
  getGitAuthorName,
  getGitHubToken,
} from "../config";
import { Notification, NotificationMessage } from "../notification";

interface InventOptionsBase {
  inventSpec: string;
  parameters: ParametersBuilder;
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
  onNotification: (notification: Notification) => void,
  options?: InventOptions,
  continuation?: {
    parent: string;
    taskIndex: number;
    agent: AgentStepFn;
    gitHubBackend: GitHubBackend;
    gitHubToken: string;
    gitAuthorName: string;
    gitAuthorEmail: string;
  },
): Promise<void> {
  const [agent, gitHubBackend] = continuation
    ? [continuation.agent, continuation.gitHubBackend]
    : (() => {
        const [agent, gitHubBackend] = getAgentStepFn(
          getAgentUpstream() ??
            (() => {
              throw new Error("agentUpstream required");
            })(),
        );
        return [agent, gitHubBackend ?? DefaultGitHubBackend];
      })();
  const gitHubToken = continuation
    ? continuation.gitHubToken
    : (getGitHubToken() ??
      (() => {
        throw new Error("gitHubToken required");
      })());
  const gitAuthorName = continuation
    ? continuation.gitAuthorName
    : (getGitAuthorName() ??
      (() => {
        throw new Error("gitAuthorName required");
      })());
  const gitAuthorEmail = continuation
    ? continuation.gitAuthorEmail
    : (getGitAuthorEmail() ??
      (() => {
        throw new Error("gitAuthorEmail required");
      })());
  if (options !== undefined) {
    await stage1(
      dir,
      onNotification,
      options,
      agent,
      gitHubBackend,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      continuation
        ? { parent: continuation.parent, taskIndex: continuation.taskIndex }
        : undefined,
    );
  }
  await stage2(dir, onNotification, {
    agent,
    gitHubBackend,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
  });
}

async function stage1(
  dir: string,
  onNotification: (notification: Notification) => void,
  { parameters, inventSpec, ...stateOptions }: InventOptions,
  agent: AgentStepFn,
  gitHubBackend: GitHubBackend,
  gitHubToken: string,
  gitAuthorName: string,
  gitAuthorEmail: string,
  notificationOptions?: { parent: string; taskIndex: number },
): Promise<void> {
  const state = new State(
    {
      parameters: buildParameters(parameters),
      inventSpec,
      gitHubToken,
      ...stateOptions,
    },
    gitHubBackend,
  );

  let boundOnNotification = notificationOptions
    ? (message: NotificationMessage) =>
        onNotification({ ...notificationOptions, message })
    : (message: NotificationMessage) => onNotification({ message });
  let agentState = await stepName(state, agent, boundOnNotification);

  const name = state.getName().value!;
  writeInitialStateToFilesystem(dir, state, state.parameters);
  await gitHubBackend.pushInitial({
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
  await gitHubBackend.pushFinal({
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
  onNotification: (notification: Notification) => void,
  continuation: {
    agent: AgentStepFn;
    gitHubBackend: GitHubBackend;
    gitHubToken: string;
    gitAuthorName: string;
    gitAuthorEmail: string;
  },
): Promise<void> {
  const qualityFn = await readQualityFunctionFromFilesystem(
    dir,
    continuation.gitHubBackend,
  );
  if (!qualityFn) return;

  const gitHubToken =
    getGitHubToken() ??
    (() => {
      throw new Error("gitHubToken required");
    })();
  const gitAuthorName =
    getGitAuthorName() ??
    (() => {
      throw new Error("gitAuthorName required");
    })();
  const gitAuthorEmail =
    getGitAuthorEmail() ??
    (() => {
      throw new Error("gitAuthorEmail required");
    })();

  if (isDirty(dir)) {
    await continuation.gitHubBackend.pushFinal({
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
    const childQualityFn = await readQualityFunctionFromFilesystem(
      subFunctionDir,
      continuation.gitHubBackend,
    );
    if (
      childQualityFn &&
      (await continuation.gitHubBackend.getOwnerRepositoryCommit(
        subFunctionDir,
      ))
    ) {
      subInvents.push(
        invent(subFunctionDir, onNotification, undefined, {
          parent: qualityFn.name,
          taskIndex: i,
          ...continuation,
        }),
      );
      onNotification({
        parent: qualityFn.name,
        taskIndex: i,
        name: childQualityFn.name,
        message: { role: "done" },
      });
    } else if (task.type === "placeholder.vector.function") {
      subInvents.push(
        invent(
          subFunctionDir,
          onNotification,
          {
            inventSpec: spec,
            parameters: subParameters,
            type: "vector.function",
            input_schema: task.input_schema,
            output_length: task.output_length,
            input_split: task.input_split,
            input_merge: task.input_merge,
          },
          { parent: qualityFn.name, taskIndex: i, ...continuation },
        ),
      );
    } else if (task.type === "placeholder.scalar.function") {
      subInvents.push(
        invent(
          subFunctionDir,
          onNotification,
          {
            inventSpec: spec,
            parameters: subParameters,
            type: "scalar.function",
            input_schema: task.input_schema,
          },
          { parent: qualityFn.name, taskIndex: i, ...continuation },
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

    const subQualityFn = await readQualityFunctionFromFilesystem(
      subFunctionDir,
      continuation.gitHubBackend,
    );
    if (!subQualityFn) continue;

    // Assert sub-function has no placeholder tasks remaining
    if (hasPlaceholderTasks(subQualityFn.function.function)) continue;

    const orc =
      await continuation.gitHubBackend.getOwnerRepositoryCommit(subFunctionDir);
    if (!orc) continue;

    replacePlaceholderTask(tasks, i, task, orc);
    replaced = true;
  }

  if (replaced) {
    writeFunctionToFilesystem(
      dir,
      qualityFn.function.function as Functions.RemoteFunction,
    );
    await continuation.gitHubBackend.pushFinal({
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
