import { ChildProcess, execSync, spawn } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import { join } from "path";
import { Result } from "./result";
import { SpawnFunctionAgentsParams } from "../spawnFunctionAgentsParams";
import { AgentEvent, parseEvent, prefixEvent } from "../events";

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

export function repoExists(
  owner: string,
  name: string,
  ghToken: string,
): boolean {
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

function getCurrentDepth(): number {
  if (!existsSync("parameters.json")) {
    return 0;
  }
  const content = readFileSync("parameters.json", "utf-8");
  const params = JSON.parse(content) as { depth: number };
  return params.depth ?? 0;
}

export interface RunAgentOptions {
  apiBase?: string;
  apiKey?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  ghToken?: string;
  minWidth?: number;
  maxWidth?: number;
  onChildEvent?: (evt: AgentEvent) => void;
  activeChildren?: Map<string, import("stream").Writable>;
}

function runAgentInSubdir(
  name: string,
  spec: string,
  type: "scalar.function" | "vector.function",
  inputSchema: Record<string, unknown>,
  childDepth: number,
  childProcesses: ChildProcess[],
  opts?: RunAgentOptions,
): Promise<SpawnResult> {
  const subdir = join("agent_functions", name);

  mkdirSync(subdir, { recursive: true });

  // Write spec and input schema to temp files before spawning so they don't
  // need to be CLI args. JSON with special characters gets mangled by shell
  // escaping on Windows. These .tmp.* files are gitignored.
  writeFileSync(join(subdir, ".tmp.spec.md"), spec, "utf-8");
  writeFileSync(
    join(subdir, ".tmp.input-schema.json"),
    JSON.stringify(inputSchema, null, 2),
    "utf-8",
  );

  return new Promise<SpawnResult>((resolve) => {
    const args = ["invent", "--name", name, "--depth", String(childDepth)];
    if (opts?.apiBase) args.push("--api-base", opts.apiBase);
    if (opts?.apiKey) args.push("--api-key", opts.apiKey);
    if (opts?.gitUserName) args.push("--git-user-name", opts.gitUserName);
    if (opts?.gitUserEmail) args.push("--git-user-email", opts.gitUserEmail);
    if (opts?.ghToken) args.push("--gh-token", opts.ghToken);
    if (opts?.minWidth) args.push("--min-width", String(opts.minWidth));
    if (opts?.maxWidth) args.push("--max-width", String(opts.maxWidth));
    if (type === "scalar.function") args.push("--scalar");
    if (type === "vector.function") args.push("--vector");
    args.push("--spec-file", ".tmp.spec.md");
    args.push("--input-schema-file", ".tmp.input-schema.json");

    const child = spawn("objectiveai", args, {
      cwd: subdir,
      stdio: ["pipe", "pipe", "pipe"],
      shell: true,
      env: {
        ...process.env,
        OBJECTIVEAI_PARENT_PID: String(process.pid),
        OBJECTIVEAI_ROOT_CWD: process.env.OBJECTIVEAI_ROOT_CWD ?? process.cwd(),
        ...(opts?.ghToken && { GH_TOKEN: opts.ghToken }),
      },
    });

    childProcesses.push(child);

    // Register child stdin for messaging
    if (child.stdin && opts?.activeChildren) {
      opts.activeChildren.set(name, child.stdin);
    }

    // Emit start event
    opts?.onChildEvent?.({ event: "start", path: name });

    // Parse JSON events from child stdout
    let stdoutBuffer = "";
    child.stdout?.on("data", (data: Buffer) => {
      if (!opts?.onChildEvent) return;
      stdoutBuffer += data.toString();
      const lines = stdoutBuffer.split("\n");
      // Keep the last incomplete line in the buffer
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const evt = parseEvent(line);
        if (evt) {
          opts.onChildEvent!(prefixEvent(evt, name));
        }
      }
    });

    let stderrBuffer = "";
    child.stderr?.on("data", (data: Buffer) => {
      stderrBuffer += data.toString();
    });

    child.on("close", (code) => {
      // Unregister child stdin
      opts?.activeChildren?.delete(name);

      // Flush remaining stdout buffer
      if (opts?.onChildEvent && stdoutBuffer.trim()) {
        const evt = parseEvent(stdoutBuffer);
        if (evt) {
          opts.onChildEvent(prefixEvent(evt, name));
        }
      }

      // Emit done event (always, even on crash)
      opts?.onChildEvent?.({ event: "done", path: name });

      if (code !== 0) {
        const stderr = stderrBuffer.trim();
        const detail = stderr
          ? stderr
          : `See ${subdir}/logs/ for details.`;
        resolve({
          name,
          error: `Agent exited with code ${code}. ${detail}`,
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

  // Check that no repos already exist on GitHub
  if (opts?.ghToken) {
    const owner = getGitHubOwner(opts.ghToken);
    if (owner) {
      for (const param of params) {
        if (repoExists(owner, param.name, opts.ghToken)) {
          return {
            ok: false,
            value: undefined,
            error: `Repository ${owner}/${param.name} already exists on GitHub. Choose a different name, or use AmendFunctionAgents to modify the existing function.`,
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
        runAgentInSubdir(
          param.name,
          param.spec,
          param.type,
          param.inputSchema,
          childDepth,
          childProcesses,
          opts,
        ),
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
