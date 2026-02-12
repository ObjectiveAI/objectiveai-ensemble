import { existsSync, readFileSync, writeFileSync, appendFileSync } from "fs";
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

export function appendAmendment(content: string): number {
  const existing = existsSync("SPEC.md")
    ? readFileSync("SPEC.md", "utf-8")
    : "";

  // Count existing amendments to determine next index
  const matches = existing.match(/===AMENDMENT \d+===/g);
  const nextIndex = matches ? matches.length + 1 : 1;

  appendFileSync("SPEC.md", `\n===AMENDMENT ${nextIndex}===\n${content}`);
  return nextIndex;
}
