import { ChildProcess, execSync, spawn } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  statSync,
} from "fs";

import { join } from "path";
import { Result } from "./result";
import { SpawnFunctionAgentsParams } from "../spawnFunctionAgentsParams";

interface AgentResult {
  name: string;
  owner: string;
  repository: string;
  commit: string;
}

interface AgentError {
  name: string;
  error: string;
}

type SpawnResult = AgentResult | AgentError;

function getCurrentDepth(): number {
  if (!existsSync("parameters.json")) {
    return 0;
  }
  const content = readFileSync("parameters.json", "utf-8");
  const params = JSON.parse(content) as { depth: number };
  return params.depth ?? 0;
}

function runAgentInSubdir(
  name: string,
  spec: string,
  childDepth: number,
  childProcesses: ChildProcess[],
): Promise<SpawnResult> {
  const subdir = join("agent_functions", name);

  mkdirSync(subdir, { recursive: true });

  const runnerScript = `
import { Claude } from "@objectiveai/function-agent";

async function main(): Promise<void> {
  await Claude.invent({ name: ${JSON.stringify(name)}, spec: ${JSON.stringify(spec)}, depth: ${childDepth} });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;

  const runnerPath = join(subdir, "_runner.ts");
  writeFileSync(runnerPath, runnerScript);

  return new Promise<SpawnResult>((resolve) => {
    const child = spawn("npx", ["ts-node", "_runner.ts"], {
      cwd: subdir,
      stdio: ["inherit", "pipe", "pipe"],
      shell: true,
    });

    childProcesses.push(child);

    child.stdout?.on("data", () => {});
    child.stderr?.on("data", () => {});

    child.on("close", (code) => {
      if (code !== 0) {
        resolve({
          name,
          error: `Agent exited with code ${code}. See ${subdir}/logs/ for details.`,
        });
        return;
      }

      try {
        const remote = execSync("git remote get-url origin", {
          cwd: subdir,
          encoding: "utf-8",
        }).trim();

        const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        const owner = match?.[1] ?? "unknown";
        const repository = match?.[2] ?? name;

        const commit = execSync("git rev-parse HEAD", {
          cwd: subdir,
          encoding: "utf-8",
        }).trim();

        resolve({ name, owner, repository, commit });
      } catch (err) {
        resolve({ name, error: `Failed to extract result: ${err}` });
      }
    });

    child.on("error", (err) => {
      resolve({ name, error: `Failed to spawn agent: ${err.message}` });
    });
  });
}

export async function spawnFunctionAgents(
  params: SpawnFunctionAgentsParams,
): Promise<Result<SpawnResult[]>> {
  if (params.length === 0) {
    return { ok: false, value: undefined, error: "params array is empty" };
  }

  // Check for duplicate names
  const names = params.map((p) => p.name);
  const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
  if (duplicates.length > 0) {
    return {
      ok: false,
      value: undefined,
      error: `Duplicate names: ${[...new Set(duplicates)].join(", ")}`,
    };
  }

  // Process overwrites first
  for (const param of params) {
    const dir = join("agent_functions", param.name);
    if (param.overwrite && existsSync(dir)) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch (err) {
        return {
          ok: false,
          value: undefined,
          error: `Failed to delete ${dir}: ${err}. If this error persists, make a new function with a different name instead.`,
        };
      }
    }
  }

  // Check for existing directories
  for (const param of params) {
    const dir = join("agent_functions", param.name);
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      return {
        ok: false,
        value: undefined,
        error: `agent_functions/${param.name} already exists. Set "overwrite": true to replace it, or use a different name.`,
      };
    }
  }

  const currentDepth = getCurrentDepth();
  const childDepth = Math.max(0, currentDepth - 1);

  const childProcesses: ChildProcess[] = [];
  const killAll = () => {
    for (const child of childProcesses) {
      if (!child.killed && child.pid) {
        try {
          process.kill(child.pid);
        } catch {}
      }
    }
  };

  const onExit = () => killAll();
  process.on("exit", onExit);

  try {
    const results = await Promise.all(
      params.map((param) =>
        runAgentInSubdir(param.name, param.spec, childDepth, childProcesses),
      ),
    );
    return { ok: true, value: results, error: undefined };
  } catch (e) {
    killAll();
    return {
      ok: false,
      value: undefined,
      error: `Spawn failed: ${(e as Error).message}`,
    };
  } finally {
    process.removeListener("exit", onExit);
  }
}
