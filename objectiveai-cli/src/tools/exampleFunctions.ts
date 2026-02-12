import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { Result } from "./result";

interface FunctionRef {
  owner: string;
  repository: string;
  commit: string;
}

export function listExampleFunctions(): Result<FunctionRef[]> {
  const path = join("examples", "examples.json");
  if (!existsSync(path)) {
    return { ok: false, value: undefined, error: "examples/examples.json does not exist" };
  }
  try {
    const content = JSON.parse(readFileSync(path, "utf-8"));
    if (!Array.isArray(content)) {
      return { ok: false, value: undefined, error: "examples/examples.json is not an array" };
    }
    return { ok: true, value: content, error: undefined };
  } catch (e) {
    return { ok: false, value: undefined, error: `Failed to parse examples/examples.json: ${(e as Error).message}` };
  }
}

export function readExampleFunction(owner: string, repository: string, commit: string): Result<unknown> {
  const path = join("examples", "functions", owner, repository, commit, "function.json");
  if (!existsSync(path)) {
    return { ok: false, value: undefined, error: `${path} does not exist` };
  }
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf-8")), error: undefined };
  } catch (e) {
    return { ok: false, value: undefined, error: `Failed to parse ${path}: ${(e as Error).message}` };
  }
}
