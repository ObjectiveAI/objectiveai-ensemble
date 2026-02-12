import { Functions, ObjectiveAI } from "objectiveai";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { Result } from "./result";
import { readFunction, validateFunction } from "./function/function";
import { buildProfile, readProfile, validateProfile } from "./profile";
import { readExampleInputs, validateExampleInputs } from "./inputs";

function clearDir(dir: string): void {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir)) {
    unlinkSync(join(dir, file));
  }
}

export async function runNetworkTests(
  apiBase?: string,
  apiKey?: string,
): Promise<Result<undefined>> {
  const client = new ObjectiveAI({
    ...(apiBase && { apiBase }),
    ...(apiKey && { apiKey }),
  });

  // Read and validate function
  const fnRaw = readFunction();
  if (!fnRaw.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to read function.json: ${fnRaw.error}`,
    };
  }
  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Function validation failed: ${funcResult.error}`,
    };
  }
  const func = funcResult.value;

  // Build and validate profile
  const buildResult = buildProfile();
  if (!buildResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Failed to build profile: ${buildResult.error}`,
    };
  }
  const profileRaw = readProfile();
  if (!profileRaw.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to read profile.json: ${profileRaw.error}`,
    };
  }
  const profileResult = validateProfile(profileRaw.value);
  if (!profileResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Profile validation failed: ${profileResult.error}`,
    };
  }
  const profile = profileResult.value;

  // Read and validate inputs
  const file = readExampleInputs();
  if (!file.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Unable to read inputs.json: ${file.error}`,
    };
  }
  const inputsResult = validateExampleInputs(file.value, fnRaw.value);
  if (!inputsResult.ok) {
    return {
      ok: false,
      value: undefined,
      error: `Inputs validation failed: ${inputsResult.error}`,
    };
  }
  const inputs = inputsResult.value;

  // Clear and prepare output directories
  const defaultDir = join("network_tests", "default");
  const swissSystemDir = join("network_tests", "swisssystem");
  clearDir(defaultDir);
  clearDir(swissSystemDir);
  mkdirSync(defaultDir, { recursive: true });
  mkdirSync(swissSystemDir, { recursive: true });

  // Execute function for each input (default strategy)
  try {
    const promises = inputs.map(({ value }) =>
      Functions.Executions.inlineFunctionInlineProfileCreate(client, {
        input: value,
        function: func,
        profile: profile,
        from_rng: true,
      }),
    );
    const results = await Promise.all(promises);
    for (let i = 0; i < inputs.length; i++) {
      const result = results[i];
      writeFileSync(join(defaultDir, `${i}.json`), JSON.stringify(result));
      if (result.error !== null) {
        return {
          ok: false,
          value: undefined,
          error: `Default strategy: execution failed for input [${i}]: ${JSON.stringify(result.error)}`,
        };
      }
      if (result.tasks_errors) {
        return {
          ok: false,
          value: undefined,
          error: `Default strategy: task errors for input [${i}]`,
        };
      }
    }
  } catch (e) {
    return {
      ok: false,
      value: undefined,
      error: `Default strategy: ${(e as Error).message}`,
    };
  }

  // Vector functions: also test swiss_system strategy
  if (func.type === "vector.function") {
    try {
      const promises = inputs.map(({ value }) =>
        Functions.Executions.inlineFunctionInlineProfileCreate(client, {
          input: value,
          function: func,
          profile: profile,
          from_rng: true,
          strategy: { type: "swiss_system", pool: 2 },
        }),
      );
      const results = await Promise.all(promises);
      for (let i = 0; i < inputs.length; i++) {
        const result = results[i];
        writeFileSync(
          join(swissSystemDir, `${i}.json`),
          JSON.stringify(result),
        );
        if (result.error !== null) {
          return {
            ok: false,
            value: undefined,
            error: `SwissSystem strategy: execution failed for input [${i}]: ${JSON.stringify(result.error)}`,
          };
        }
        if (result.tasks_errors) {
          return {
            ok: false,
            value: undefined,
            error: `SwissSystem strategy: task errors for input [${i}]`,
          };
        }
      }
    } catch (e) {
      return {
        ok: false,
        value: undefined,
        error: `SwissSystem strategy: ${(e as Error).message}`,
      };
    }
  }

  return { ok: true, value: undefined, error: undefined };
}

export function readDefaultNetworkTest(index: number): Result<unknown> {
  const filePath = join("network_tests", "default", `${index}.json`);
  if (!existsSync(filePath)) {
    return {
      ok: false,
      value: undefined,
      error: `File not found: ${filePath}`,
    };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync(filePath, "utf-8")),
      error: undefined,
    };
  } catch (e) {
    return {
      ok: false,
      value: undefined,
      error: `Failed to parse ${filePath}: ${(e as Error).message}`,
    };
  }
}

export function readSwissSystemNetworkTest(index: number): Result<unknown> {
  const filePath = join("network_tests", "swisssystem", `${index}.json`);
  if (!existsSync(filePath)) {
    return {
      ok: false,
      value: undefined,
      error: `File not found: ${filePath}`,
    };
  }
  try {
    return {
      ok: true,
      value: JSON.parse(readFileSync(filePath, "utf-8")),
      error: undefined,
    };
  } catch (e) {
    return {
      ok: false,
      value: undefined,
      error: `Failed to parse ${filePath}: ${(e as Error).message}`,
    };
  }
}
