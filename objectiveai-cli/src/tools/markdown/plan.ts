import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { Result } from "../result";

export function readPlan(index: number): Result<string> {
  const path = `plans/${index}.md`;
  if (!existsSync(path)) {
    return { ok: false, value: undefined, error: `${path} is missing` };
  }
  return { ok: true, value: readFileSync(path, "utf-8"), error: undefined };
}

export function writePlan(index: number, content: string): Result<undefined> {
  mkdirSync("plans", { recursive: true });
  writeFileSync(`plans/${index}.md`, content);
  return { ok: true, value: undefined, error: undefined };
}

export function getLatestPlanIndex(): Result<number> {
  if (!existsSync("plans")) {
    return { ok: false, value: undefined, error: "plans/ directory does not exist" };
  }
  const files = readdirSync("plans");
  const indices = files
    .filter((f) => /^\d+\.md$/.test(f))
    .map((f) => parseInt(f.replace(".md", ""), 10))
    .filter((n) => !isNaN(n));
  if (indices.length === 0) {
    return { ok: false, value: undefined, error: "No plan files found" };
  }
  return { ok: true, value: Math.max(...indices), error: undefined };
}
