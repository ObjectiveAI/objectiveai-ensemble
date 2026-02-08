import { execSync } from "child_process";
import { existsSync, readdirSync, statSync } from "fs";
import { Result } from "./result";

interface AgentFunctionInfo {
  name: string;
  owner: string;
  repository: string;
  commit: string;
  path: string;
}

export function listAgentFunctions(): Result<AgentFunctionInfo[]> {
  const dir = "agent_functions";
  if (!existsSync(dir)) {
    return { ok: true, value: [], error: undefined };
  }

  const entries = readdirSync(dir);
  const results: AgentFunctionInfo[] = [];

  for (const entry of entries) {
    const subPath = `${dir}/${entry}`;
    if (!statSync(subPath).isDirectory() || entry.startsWith(".")) continue;

    let commit: string;
    try {
      commit = execSync("git rev-parse HEAD", {
        cwd: subPath,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();
    } catch {
      continue;
    }

    let owner = "";
    let repository = "";
    try {
      const remote = execSync("git remote get-url origin", {
        cwd: subPath,
        encoding: "utf-8",
        stdio: "pipe",
      }).trim();
      const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      owner = match?.[1] ?? "";
      repository = match?.[2] ?? "";
    } catch {}

    results.push({ name: entry, owner, repository, commit, path: subPath });
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, value: results, error: undefined };
}

export function readAgentFunction(name: string): Result<AgentFunctionInfo> {
  const subPath = `agent_functions/${name}`;
  if (!existsSync(subPath) || !statSync(subPath).isDirectory()) {
    return { ok: false, value: undefined, error: `agent_functions/${name} does not exist` };
  }

  let commit: string;
  try {
    commit = execSync("git rev-parse HEAD", {
      cwd: subPath,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
  } catch {
    return { ok: false, value: undefined, error: `Failed to get commit for agent_functions/${name}` };
  }

  let owner = "";
  let repository = "";
  try {
    const remote = execSync("git remote get-url origin", {
      cwd: subPath,
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    owner = match?.[1] ?? "";
    repository = match?.[2] ?? "";
  } catch {}

  return { ok: true, value: { name, owner, repository, commit, path: subPath }, error: undefined };
}
