import { Functions } from "objectiveai";
import { existsSync, readFileSync, writeFileSync } from "fs";

// Default profile for vector completion tasks
export const defaultVectorCompletionTaskProfile: Functions.VectorCompletionTaskProfile = {
  ensemble: {
    llms: [
      {
        count: 1,
        model: "openai/gpt-4.1-nano",
        output_mode: "json_schema",
      },
      {
        count: 1,
        model: "google/gemini-2.5-flash-lite",
        output_mode: "json_schema",
      },
      {
        count: 1,
        model: "deepseek/deepseek-v3.2",
        output_mode: "instruction",
        top_logprobs: 20,
      },
      {
        count: 1,
        model: "openai/gpt-4o-mini",
        output_mode: "json_schema",
        top_logprobs: 20,
      },
      {
        count: 1,
        model: "x-ai/grok-4.1-fast",
        output_mode: "json_schema",
        reasoning: {
          enabled: false,
        },
      },
    ],
  },
  profile: [1, 1, 1, 1, 1],
};

// Read JSON file, return null if it doesn't exist
function readJsonFile(path: string): unknown {
  if (!existsSync(path)) {
    return null;
  }
  const content = readFileSync(path, "utf-8");
  return JSON.parse(content);
}

export interface FunctionFields {
  type?: unknown;
  description?: unknown;
  input_maps?: unknown;
  input_schema?: unknown;
  tasks?: unknown;
  output?: unknown;
  output_length?: unknown;
  input_split?: unknown;
  input_merge?: unknown;
}

export function buildFunction(fields?: FunctionFields): Record<string, unknown> {
  const func: Record<string, unknown> = {};

  // Use provided fields or read from files
  const type = fields?.type ?? readJsonFile("function/type.json");
  const description = fields?.description ?? readJsonFile("function/description.json");
  const inputMaps = fields?.input_maps ?? readJsonFile("function/input_maps.json");
  const inputSchema = fields?.input_schema ?? readJsonFile("function/input_schema.json");
  const tasks = fields?.tasks ?? readJsonFile("function/tasks.json");
  const output = fields?.output ?? readJsonFile("function/output.json");
  const outputLength = fields?.output_length ?? readJsonFile("function/output_length.json");
  const inputSplit = fields?.input_split ?? readJsonFile("function/input_split.json");
  const inputMerge = fields?.input_merge ?? readJsonFile("function/input_merge.json");

  if (type !== null) func.type = type;
  if (description !== null) func.description = description;
  if (inputMaps !== null) func.input_maps = inputMaps;
  if (inputSchema !== null) func.input_schema = inputSchema;
  if (tasks !== null) func.tasks = tasks;
  if (output !== null) func.output = output;
  if (outputLength !== null) func.output_length = outputLength;
  if (inputSplit !== null) func.input_split = inputSplit;
  if (inputMerge !== null) func.input_merge = inputMerge;

  return func;
}

export function writeFunctionJson(fields?: FunctionFields, path = "function.json"): void {
  const func = buildFunction(fields);
  writeFileSync(path, JSON.stringify(func, null, 2));
}

export interface ProfileOptions {
  name?: string | null;
  tasks?: Functions.Task[] | null;
  vectorCompletionTaskProfile?: Functions.VectorCompletionTaskProfile;
}

export function buildProfile(options: ProfileOptions = {}): Functions.RemoteProfile {
  const {
    vectorCompletionTaskProfile = defaultVectorCompletionTaskProfile,
  } = options;

  // Use provided values or read from files
  const name = options.name ?? readJsonFile("github/name.json") as string | null;
  const tasks = options.tasks ?? readJsonFile("function/tasks.json") as Functions.Task[] | null;

  const profileTasks: Functions.TaskProfile[] = [];

  if (tasks) {
    for (const task of tasks) {
      if (task.type === "vector.completion") {
        profileTasks.push(vectorCompletionTaskProfile);
      } else if (
        task.type === "scalar.function" ||
        task.type === "vector.function"
      ) {
        const funcTask = task as
          | Functions.ScalarFunctionTask
          | Functions.VectorFunctionTask;
        profileTasks.push({
          owner: funcTask.owner,
          repository: funcTask.repository,
          commit: funcTask.commit,
        });
      }
    }
  }

  return {
    description: `Default profile for ${name ?? ""}`,
    tasks: profileTasks,
  };
}

export function writeProfileJson(options: ProfileOptions = {}, path = "profile.json"): void {
  const profile = buildProfile(options);
  writeFileSync(path, JSON.stringify(profile, null, 2));
}
