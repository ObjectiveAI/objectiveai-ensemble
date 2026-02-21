import { basename } from "path";
import { State } from "../state/state";
import { AgentStepFn, getAgentStepFn } from "../agent";
import { Parameters, ParametersBuilder, buildParameters } from "../parameters";
import { Functions } from "objectiveai";
import {
  readQualityFunctionFromFilesystem,
  writeInitialStateToFilesystem,
  writeFinalStateToFilesystem,
  writeFunctionToFilesystem,
  writeParentTokenToFilesystem,
  findChildByToken,
  inventDir,
  QualityFunction,
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

type InventOptionsBase =
  | {
      inventSpec: string;
      parameters: ParametersBuilder;
    }
  | {
      name: string;
    };

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
  onNotification: (notification: Notification) => void,
  options: InventOptions,
  continuation?: {
    parentToken?: string;
    path: number[];
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
              throw new Error("Agent required");
            })(),
        );
        return [agent, gitHubBackend ?? DefaultGitHubBackend];
      })();
  const gitHubToken = continuation
    ? continuation.gitHubToken
    : (getGitHubToken() ??
      (() => {
        throw new Error("GitHubToken required");
      })());
  const gitAuthorName = continuation
    ? continuation.gitAuthorName
    : (getGitAuthorName() ??
      (() => {
        throw new Error("GitAuthorName required");
      })());
  const gitAuthorEmail = continuation
    ? continuation.gitAuthorEmail
    : (getGitAuthorEmail() ??
      (() => {
        throw new Error("GitAuthorEmail required");
      })());

  const path = continuation?.path ?? [];
  const parentToken = continuation?.parentToken;
  const owner = await gitHubBackend.getAuthenticatedUser(gitHubToken);

  // Determine dir — may need stage1
  let dir: string | null = null;
  if ("name" in options) {
    dir = inventDir(owner, options.name);
  } else if (parentToken) {
    dir = findChildByToken(owner, parentToken);
  }

  let qualityFn: QualityFunction | null;
  try {
    // Maybe stage1
    let state: State | undefined;
    let agentState: unknown;
    if (dir === null) {
      if ("name" in options) {
        throw new Error(
          `Function directory not found for name: ${options.name}`,
        );
      }
      const result = await stage1(
        owner,
        options,
        parentToken,
        path,
        onNotification,
        agent,
        gitHubBackend,
        gitHubToken,
        gitAuthorName,
        gitAuthorEmail,
      );
      dir = result.dir;
      state = result.state;
      agentState = result.agentState;
      if (result.reThrow) throw result.reThrow;
    }

    // Try to read quality function — skip stage2 if already complete
    qualityFn = await readQualityFunctionFromFilesystem(dir, gitHubBackend);

    // Maybe stage2
    if (!qualityFn) {
      if (!state) {
        if ("name" in options) {
          throw new Error(
            `Function at ${dir} is not a quality function and cannot be resumed without inventSpec`,
          );
        }
        // mode 2 resume: child dir exists but not quality — reconstruct state
        state = new State(
          {
            parameters: buildParameters(options.parameters),
            inventSpec: options.inventSpec,
            gitHubToken,
            owner,
            ...("type" in options
              ? {
                  type: options.type,
                  ...(options.type === "vector.function"
                    ? {
                        input_schema: options.input_schema,
                        output_length: options.output_length,
                        input_split: options.input_split,
                        input_merge: options.input_merge,
                      }
                    : { input_schema: options.input_schema }),
                }
              : {}),
          },
          gitHubBackend,
        );
        state.forceSetName(basename(dir));
      }
      await stage2(
        dir,
        state,
        agentState,
        path,
        onNotification,
        agent,
        gitHubBackend,
        gitHubToken,
        gitAuthorName,
        gitAuthorEmail,
      );
      qualityFn = await readQualityFunctionFromFilesystem(dir, gitHubBackend);
      if (!qualityFn) {
        throw new Error("stage2 failed to produce quality function");
      }
    }
  } catch (err) {
    // If dir was set, filesystem was written — emit done with error
    if (dir !== null) {
      const name = basename(dir);
      const message = err instanceof Error ? err.message : "Unknown error";
      onNotification({
        path,
        name,
        message: { role: "done", error: message },
      });
    }
    throw err;
  }

  // Emit done — covers both "stage2 just finished" and "both stages skipped"
  onNotification({
    path,
    name: qualityFn.name,
    message: { role: "done" },
  });

  // Always stage3
  await stage3(
    dir,
    owner,
    qualityFn,
    path,
    onNotification,
    agent,
    gitHubBackend,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
  );
}

async function stage1(
  owner: string,
  options: Exclude<InventOptions, { name: string }>,
  parentToken: string | undefined,
  path: number[],
  onNotification: (notification: Notification) => void,
  agent: AgentStepFn,
  gitHubBackend: GitHubBackend,
  gitHubToken: string,
  gitAuthorName: string,
  gitAuthorEmail: string,
): Promise<{
  dir: string;
  state: State;
  agentState: unknown;
  reThrow: unknown;
}> {
  const {
    parameters: parametersBuilder,
    inventSpec,
    ...stateOptions
  } = options;
  const parameters = buildParameters(parametersBuilder);

  const state = new State(
    {
      parameters,
      inventSpec,
      gitHubToken,
      owner,
      ...stateOptions,
    },
    gitHubBackend,
  );

  const boundOnNotification = (message: NotificationMessage) =>
    onNotification({ path, message });
  let agentState = await stepType(state, agent, boundOnNotification);
  agentState = await stepName(state, agent, boundOnNotification, agentState);

  const name = state.getName().value!;
  const dir = inventDir(owner, name);
  // Dir already created by setName — just write files
  writeInitialStateToFilesystem(dir, parameters);
  if (parentToken) {
    writeParentTokenToFilesystem(dir, parentToken);
  }

  let reThrow: unknown;
  try {
    await gitHubBackend.pushInitial({
      dir,
      name,
      gitHubToken,
      gitAuthorName,
      gitAuthorEmail,
      message: "initial commit",
    });
  } catch (err) {
    reThrow = err;
  }

  return { dir, state, agentState, reThrow };
}

async function stage2(
  dir: string,
  state: State,
  agentState: unknown,
  path: number[],
  onNotification: (notification: Notification) => void,
  agent: AgentStepFn,
  gitHubBackend: GitHubBackend,
  gitHubToken: string,
  gitAuthorName: string,
  gitAuthorEmail: string,
): Promise<void> {
  const name = state.getName().value!;
  const boundOnNotification = (message: NotificationMessage) =>
    onNotification({ path, name, message });

  agentState = await stepEssay(state, agent, boundOnNotification, agentState);
  agentState = await stepFields(state, agent, boundOnNotification, agentState);
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

  writeFinalStateToFilesystem(dir, state, state.parameters);
  await gitHubBackend.pushFinal({
    dir,
    gitHubToken,
    gitAuthorName,
    gitAuthorEmail,
    message: `implement ${name}`,
    description: state.getDescription().value!,
  });
}

async function stage3(
  dir: string,
  owner: string,
  qualityFn: QualityFunction,
  path: number[],
  onNotification: (notification: Notification) => void,
  agent: AgentStepFn,
  gitHubBackend: GitHubBackend,
  gitHubToken: string,
  gitAuthorName: string,
  gitAuthorEmail: string,
): Promise<void> {
  if (isDirty(dir)) {
    await gitHubBackend.pushFinal({
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

  const subParameters: Parameters = {
    ...qualityFn.parameters,
    depth: qualityFn.parameters.depth - 1,
  };

  const tasks = qualityFn.function.function.tasks;
  const subInvents: Promise<void>[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const entry = specs[i];
    if (entry === null || entry === undefined) continue;

    const task = tasks[i];
    const childPath = [...path, i];

    if (task.type === "placeholder.vector.function") {
      subInvents.push(
        invent(
          onNotification,
          {
            inventSpec: entry.spec,
            parameters: subParameters,
            type: "vector.function",
            input_schema: task.input_schema,
            output_length: task.output_length,
            input_split: task.input_split,
            input_merge: task.input_merge,
          },
          {
            parentToken: entry.token,
            path: childPath,
            agent,
            gitHubBackend,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail,
          },
        ),
      );
    } else if (task.type === "placeholder.scalar.function") {
      subInvents.push(
        invent(
          onNotification,
          {
            inventSpec: entry.spec,
            parameters: subParameters,
            type: "scalar.function",
            input_schema: task.input_schema,
          },
          {
            parentToken: entry.token,
            path: childPath,
            agent,
            gitHubBackend,
            gitHubToken,
            gitAuthorName,
            gitAuthorEmail,
          },
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

    const entry = specs[i];
    if (entry === null || entry === undefined) continue;

    // Find the child dir by token
    const childDir = findChildByToken(owner, entry.token);
    if (!childDir) continue;

    const subQualityFn = await readQualityFunctionFromFilesystem(
      childDir,
      gitHubBackend,
    );
    if (!subQualityFn) continue;

    // Assert sub-function has no placeholder tasks remaining
    if (hasPlaceholderTasks(subQualityFn.function.function)) continue;

    const orc = await gitHubBackend.getOwnerRepositoryCommit(childDir);
    if (!orc) continue;

    replacePlaceholderTask(tasks, i, task, orc);
    replaced = true;
  }

  if (replaced) {
    writeFunctionToFilesystem(
      dir,
      qualityFn.function.function as Functions.RemoteFunction,
    );
    await gitHubBackend.pushFinal({
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
