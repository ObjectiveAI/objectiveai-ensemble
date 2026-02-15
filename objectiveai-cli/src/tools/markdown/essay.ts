import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "../result";

export function readEssay(): Result<string> {
  if (!existsSync("ESSAY.md")) {
    return { ok: false, value: undefined, error: "ESSAY.md is missing" };
  }
  return { ok: true, value: readFileSync("ESSAY.md", "utf-8"), error: undefined };
}

export function writeEssay(content: string): Result<undefined> {
  writeFileSync("ESSAY.md", content);
  return { ok: true, value: undefined, error: undefined };
}
