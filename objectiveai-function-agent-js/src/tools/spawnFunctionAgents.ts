import { ChildProcess, execSync, spawn } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
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

function ghEnv(ghToken: string): NodeJS.ProcessEnv {
  return { ...process.env, GH_TOKEN: ghToken };
}

export function getGitHubOwner(ghToken: string): string | null {
  try {
    return execSync("gh api user --jq .login", {
      encoding: "utf-8",
      stdio: "pipe",
      env: ghEnv(ghToken),
    }).trim();
  } catch {
    return null;
  }
}

export function repoExists(owner: string, name: string, ghToken: string): boolean {
  try {
    execSync(`gh repo view ${owner}/${name}`, {
      stdio: "ignore",
      env: ghEnv(ghToken),
    });
    return true;
  } catch {
    return false;
  }
}

const OVERWRITE_FILES = [
  "SPEC.md",
  "ESSAY.md",
  "ESSAY_TASKS.md",
  "README.md",
];

function clearForOverwrite(dir: string): void {
  for (const file of OVERWRITE_FILES) {
    const path = join(dir, file);
    if (existsSync(path)) {
      rmSync(path);
    }
  }

  // Clear description from function.json
  const functionPath = join(dir, "function.json");
  if (existsSync(functionPath)) {
    try {
      const fn = JSON.parse(readFileSync(functionPath, "utf-8"));
      if (typeof fn === "object" && fn !== null) {
        delete fn.description;
        writeFileSync(functionPath, JSON.stringify(fn, null, 2));
      }
    } catch {}
  }
}

function getCurrentDepth(): number {
  if (!existsSync("parameters.json")) {
    return 0;
  }
  const content = readFileSync("parameters.json", "utf-8");
  const params = JSON.parse(content) as { depth: number };
  return params.depth ?? 0;
}

interface RunAgentOptions {
  apiBase?: string;
  apiKey?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  ghToken?: string;
  minWidth?: number;
  maxWidth?: number;
}

function runAgentInSubdir(
  name: string,
  spec: string,
  childDepth: number,
  childProcesses: ChildProcess[],
  opts?: RunAgentOptions,
): Promise<SpawnResult> {
  const subdir = join("agent_functions", name);

  mkdirSync(subdir, { recursive: true });

  // Write spec to SPEC.md before spawning so it doesn't need to be a CLI arg.
  // Long spec strings with special characters get mangled by shell escaping on Windows.
  writeFileSync(join(subdir, "SPEC.md"), spec, "utf-8");

  return new Promise<SpawnResult>((resolve) => {
    const args = ["invent", "--name", name, "--depth", String(childDepth)];
    if (opts?.apiBase) args.push("--api-base", opts.apiBase);
    if (opts?.apiKey) args.push("--api-key", opts.apiKey);
    if (opts?.gitUserName) args.push("--git-user-name", opts.gitUserName);
    if (opts?.gitUserEmail) args.push("--git-user-email", opts.gitUserEmail);
    if (opts?.ghToken) args.push("--gh-token", opts.ghToken);
    if (opts?.minWidth) args.push("--min-width", String(opts.minWidth));
    if (opts?.maxWidth) args.push("--max-width", String(opts.maxWidth));

    const child = spawn(
      "objectiveai-function-agent",
      args,
      {
        cwd: subdir,
        stdio: ["inherit", "pipe", "pipe"],
        shell: true,
        env: {
          ...process.env,
          OBJECTIVEAI_PARENT_PID: String(process.pid),
          ...(opts?.ghToken && { GH_TOKEN: opts.ghToken }),
        },
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
  opts?: RunAgentOptions,
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
        clearForOverwrite(dir);
      } catch (err) {
        return {
          ok: false,
          value: undefined,
          error: `Failed to clear ${dir} for overwrite: ${err}.`,
        };
      }
    }
  }

  // Check for existing directories (non-overwrite only)
  for (const param of params) {
    if (param.overwrite) continue;
    const dir = join("agent_functions", param.name);
    if (existsSync(dir) && statSync(dir).isDirectory()) {
      return {
        ok: false,
        value: undefined,
        error: `agent_functions/${param.name} already exists. Set "overwrite": true to replace it, or use a different name.`,
      };
    }
  }

  // Check that no repos already exist on GitHub (non-overwrite only)
  const nonOverwriteParams = params.filter((p) => !p.overwrite);
  if (nonOverwriteParams.length > 0 && opts?.ghToken) {
    const owner = getGitHubOwner(opts.ghToken);
    if (owner) {
      for (const param of nonOverwriteParams) {
        if (repoExists(owner, param.name, opts.ghToken)) {
          return {
            ok: false,
            value: undefined,
            error: `Repository ${owner}/${param.name} already exists on GitHub. Choose a different name.`,
          };
        }
      }
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
        runAgentInSubdir(param.name, param.spec, childDepth, childProcesses, opts),
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
