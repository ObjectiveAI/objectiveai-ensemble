import { ChildProcess, execSync, spawn } from "child_process";
import { writeFileSync } from "fs";
import { join } from "path";
import { Result } from "./result";
import { AmendFunctionAgentsParams } from "../amendFunctionAgentsParams";
import { parseEvent, prefixEvent } from "../events";
import { RunAgentOptions, getGitHubOwner, repoExists } from "./spawnFunctionAgents";
import { appendAmendment } from "./markdown";

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

type AmendResult = AgentResult | AgentError;

function runAmendInSubdir(
  name: string,
  overwriteInputSchema: Record<string, unknown> | undefined,
  childProcesses: ChildProcess[],
  opts?: RunAgentOptions,
): Promise<AmendResult> {
  const subdir = join("agent_functions", name);

  return new Promise<AmendResult>((resolve) => {
    const args = ["amend"];
    if (opts?.apiBase) args.push("--api-base", opts.apiBase);
    if (opts?.apiKey) args.push("--api-key", opts.apiKey);
    if (opts?.gitUserName) args.push("--git-user-name", opts.gitUserName);
    if (opts?.gitUserEmail) args.push("--git-user-email", opts.gitUserEmail);
    if (opts?.ghToken) args.push("--gh-token", opts.ghToken);
    if (opts?.minWidth) args.push("--min-width", String(opts.minWidth));
    if (opts?.maxWidth) args.push("--max-width", String(opts.maxWidth));
    if (overwriteInputSchema) {
      writeFileSync(
        join(subdir, ".tmp.input-schema.json"),
        JSON.stringify(overwriteInputSchema, null, 2),
        "utf-8",
      );
      args.push("--input-schema", ".tmp.input-schema.json");
      args.push("--overwrite-input-schema");
    }

    const child = spawn(
      "objectiveai",
      args,
      {
        cwd: subdir,
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
        env: {
          ...process.env,
          OBJECTIVEAI_PARENT_PID: String(process.pid),
          OBJECTIVEAI_ROOT_CWD: process.env.OBJECTIVEAI_ROOT_CWD ?? process.cwd(),
          ...(opts?.ghToken && { GH_TOKEN: opts.ghToken }),
        },
      },
    );

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

      // Emit done event
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

export async function amendFunctionAgents(
  params: AmendFunctionAgentsParams,
  opts?: RunAgentOptions,
): Promise<Result<AmendResult[]>> {
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

  // Verify all agents have completed invent (repo exists on GitHub)
  if (opts?.ghToken) {
    const owner = getGitHubOwner(opts.ghToken);
    if (owner) {
      const missing: string[] = [];
      for (const param of params) {
        if (!repoExists(owner, param.name, opts.ghToken)) {
          missing.push(param.name);
        }
      }
      if (missing.length > 0) {
        return {
          ok: false,
          value: undefined,
          error: `Cannot amend agents that haven't completed invent: ${missing.join(", ")}. Repository must exist on GitHub first.`,
        };
      }
    }
  }

  // Append amendments to each child's SPEC.md
  const originalCwd = process.cwd();
  for (const param of params) {
    const dir = join("agent_functions", param.name);
    try {
      process.chdir(dir);
      appendAmendment(param.spec);
    } finally {
      process.chdir(originalCwd);
    }
  }

  const childProcesses: ChildProcess[] = [];
  const killAll = () => {
    for (const child of childProcesses) {
      if (child.killed) continue;
      try {
        if (process.platform === "win32" && child.pid) {
          execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" });
        } else {
          child.kill("SIGKILL");
        }
      } catch {}
    }
  };

  const onExit = () => killAll();
  const onSignal = () => {
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
        runAmendInSubdir(param.name, param.overwriteInputSchema, childProcesses, opts),
      ),
    );
    return { ok: true, value: results, error: undefined };
  } catch (e) {
    killAll();
    return {
      ok: false,
      value: undefined,
      error: `Amend failed: ${(e as Error).message}`,
    };
  } finally {
    killAll();
    removeListeners();
  }
}
