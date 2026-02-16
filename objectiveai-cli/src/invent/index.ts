import { join } from "path";
import { mkdirSync } from "fs";
import { State } from "../state/state";
import { AgentStepFn } from "./agent";
import { Parameters, ParametersBuilder, buildParameters } from "../parameters";
import { Functions } from "objectiveai";
import { readQualityFunctionFromFilesystem, writeState } from "../fs";
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

  writeState(dir, state, buildParameters(parameters));
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

    if (task.type === "placeholder.vector.function") {
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

  await Promise.all(subInvents);
}
