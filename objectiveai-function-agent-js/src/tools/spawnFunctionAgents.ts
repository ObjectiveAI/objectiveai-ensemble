import { ChildProcess, execSync, spawn } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
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
  apiBase?: string,
  apiKey?: string,
): Promise<SpawnResult> {
  const subdir = join("agent_functions", name);

  mkdirSync(subdir, { recursive: true });

  return new Promise<SpawnResult>((resolve) => {
    const args = ["invent", spec, "--name", name, "--depth", String(childDepth)];
    if (apiBase) args.push("--api-base", apiBase);
    if (apiKey) args.push("--api-key", apiKey);

    const child = spawn(
      "objectiveai-function-agent",
      args,
      {
        cwd: subdir,
        stdio: ["inherit", "pipe", "pipe"],
        shell: true,
      },
    );

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
  apiBase?: string,
  apiKey?: string,
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
      if (child.killed) continue;
      try {
        // On Windows with shell: true, kill the process tree
        if (process.platform === "win32" && child.pid) {
          execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
        } else {
          child.kill("SIGKILL");
        }
      } catch {}
    }
  };

  // Kill children on every possible parent exit path
  const onExit = () => killAll();
  const onSignal = (signal: string) => {
    killAll();
    process.exit(1);
  };
  const onError = () => {
    killAll();
    process.exit(1);
  };

  process.on("exit", onExit);
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  process.on("uncaughtException", onError);
  process.on("unhandledRejection", onError);

  const removeListeners = () => {
    process.removeListener("exit", onExit);
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
    process.removeListener("uncaughtException", onError);
    process.removeListener("unhandledRejection", onError);
  };

  try {
    const results = await Promise.all(
      params.map((param) =>
        runAgentInSubdir(param.name, param.spec, childDepth, childProcesses, apiBase, apiKey),
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
    killAll();
    removeListeners();
  }
}
