import { Functions } from "objectiveai";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "../result";
import { readTasks, validateTasks } from "../function/tasks";

// Default profile for vector completion tasks
export const defaultVectorCompletionTaskProfile: Functions.VectorCompletionTaskProfile =
  {
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

export function readProfile(): Result<unknown> {
  if (!existsSync("profile.json")) {
    return { ok: false, value: undefined, error: "profile.json is missing" };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync("profile.json", "utf-8")),
      error: undefined,
    };
  } catch {
    return {
      ok: false,
      value: undefined,
      error: "profile.json is not valid JSON",
    };
  }
}

export function readProfileSchema(): typeof Functions.RemoteProfileSchema {
  return Functions.RemoteProfileSchema;
}

export function validateProfile(
  value: unknown,
): Result<Functions.RemoteProfile> {
  const parsed = Functions.RemoteProfileSchema.safeParse(value);
  if (!parsed.success) {
    return { ok: false, value: undefined, error: parsed.error.message };
  }
  return { ok: true, value: parsed.data, error: undefined };
}

export function checkProfile(): Result<undefined> {
  const raw = readProfile();
  if (!raw.ok) {
    return { ok: false, value: undefined, error: raw.error };
  }
  const result = validateProfile(raw.value);
  if (!result.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Profile is invalid: ${result.error}`,
    };
  }
  return { ok: true, value: undefined, error: undefined };
}

export function buildProfile(): Result<undefined> {
  const raw = readTasks();
  if (!raw.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to build profile: ${raw.error}`,
    };
  }

  const tasksResult = validateTasks({ tasks: raw.value });
  if (!tasksResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to build profile: tasks are invalid: ${tasksResult.error}`,
    };
  }

  const profileTasks: Functions.TaskProfile[] = [];

  for (const task of tasksResult.value) {
    if (task.type === "vector.completion") {
      profileTasks.push(defaultVectorCompletionTaskProfile);
    } else if (
      task.type === "scalar.function" ||
      task.type === "vector.function"
    ) {
      profileTasks.push({
        owner: task.owner,
        repository: task.repository,
        commit: task.commit,
      });
    }
  }

  const numTasks = profileTasks.length;
  const weights = numTasks > 0 ? profileTasks.map(() => 1 / numTasks) : [];

  const profile: Functions.RemoteProfile = {
    description: "Default profile",
    tasks: profileTasks,
    profile: weights,
  };

  writeFileSync("profile.json", JSON.stringify(profile, null, 2));
  return { ok: true, value: undefined, error: undefined };
}
