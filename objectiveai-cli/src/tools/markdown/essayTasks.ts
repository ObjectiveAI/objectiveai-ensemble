import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "../result";

export function readEssayTasks(): Result<string> {
  if (!existsSync("ESSAY_TASKS.md")) {
    return { ok: false, value: undefined, error: "ESSAY_TASKS.md is missing" };
  }
  return { ok: true, value: readFileSync("ESSAY_TASKS.md", "utf-8"), error: undefined };
}

export function writeEssayTasks(content: string): Result<undefined> {
  writeFileSync("ESSAY_TASKS.md", content);
  return { ok: true, value: undefined, error: undefined };
}
