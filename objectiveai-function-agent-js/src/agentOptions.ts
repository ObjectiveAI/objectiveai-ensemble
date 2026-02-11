import { execSync } from "child_process";
import { createFileLogger } from "./logging";

export type LogFn = (...args: unknown[]) => void;

export interface AgentOptions {
  name?: string;
  spec?: string;
  apiBase: string;
  apiKey: string;
  sessionId?: string;
  log: LogFn;
  depth: number;
  instructions?: string;
  gitUserName: string;
  gitUserEmail: string;
  ghToken: string;
}

function readEnv(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name]?.trim() || undefined : undefined;
}

function getGitConfig(key: string): string | undefined {
  try {
    return execSync(`git config ${key}`, { encoding: "utf-8", stdio: "pipe" }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export function makeAgentOptions(options: Partial<AgentOptions> = {}): AgentOptions {
  const apiBase =
    options.apiBase ??
    readEnv("OBJECTIVEAI_API_BASE") ??
    "https://api.objective-ai.io";

  const apiKey =
    options.apiKey ??
    readEnv("OBJECTIVEAI_API_KEY");
  if (!apiKey) {
    throw new Error("API key is required. Set OBJECTIVEAI_API_KEY or pass apiKey.");
  }

  const log = options.log ?? createFileLogger().log;
  const depth = options.depth ?? 0;

  const gitUserName =
    options.gitUserName ??
    readEnv("GIT_AUTHOR_NAME") ??
    readEnv("GIT_COMMITTER_NAME") ??
    getGitConfig("user.name");
  if (!gitUserName) {
    throw new Error("Git user name is required. Set GIT_AUTHOR_NAME, configure git config user.name, or pass gitUserName.");
  }

  const gitUserEmail =
    options.gitUserEmail ??
    readEnv("GIT_AUTHOR_EMAIL") ??
    readEnv("GIT_COMMITTER_EMAIL") ??
    getGitConfig("user.email");
  if (!gitUserEmail) {
    throw new Error("Git user email is required. Set GIT_AUTHOR_EMAIL, configure git config user.email, or pass gitUserEmail.");
  }

  const ghToken =
    options.ghToken ??
    readEnv("GH_TOKEN");
  if (!ghToken) {
    throw new Error("GitHub token is required. Set GH_TOKEN or pass ghToken.");
  }

  return {
    ...options,
    apiBase,
    apiKey,
    log,
    depth,
    gitUserName,
    gitUserEmail,
    ghToken,
  };
}
