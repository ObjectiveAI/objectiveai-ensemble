import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "../result";

export function readReadme(): Result<string> {
  if (!existsSync("README.md")) {
    return { ok: false, value: undefined, error: "README.md is missing" };
  }
  return { ok: true, value: readFileSync("README.md", "utf-8"), error: undefined };
}

export function writeReadme(content: string): Result<undefined> {
  writeFileSync("README.md", content);
  return { ok: true, value: undefined, error: undefined };
}
