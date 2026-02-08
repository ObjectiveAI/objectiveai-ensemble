import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "../result";

export function readSpec(): Result<string> {
  if (!existsSync("SPEC.md")) {
    return { ok: false, value: undefined, error: "SPEC.md is missing" };
  }
  return { ok: true, value: readFileSync("SPEC.md", "utf-8"), error: undefined };
}

export function writeSpec(content: string): Result<undefined> {
  writeFileSync("SPEC.md", content);
  return { ok: true, value: undefined, error: undefined };
}
