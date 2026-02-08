import { existsSync, readFileSync, writeFileSync } from "fs";
import { Result } from "./result";

export function readName(): Result<string> {
  if (!existsSync("name.txt")) {
    return { ok: false, value: undefined, error: "name.txt is missing" };
  }
  return { ok: true, value: readFileSync("name.txt", "utf-8"), error: undefined };
}

export function writeName(content: string): Result<undefined> {
  writeFileSync("name.txt", content);
  return { ok: true, value: undefined, error: undefined };
}
