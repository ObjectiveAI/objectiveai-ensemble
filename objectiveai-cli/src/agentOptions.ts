import { execSync } from "child_process";
import { createFileLogger } from "./logging";
import { readSession } from "./tools/session";
import { getConfig, getMergedConfig, ConfigJson } from "./config";
import type { AgentEvent } from "./events";

export type LogFn = (...args: unknown[]) => void;

export interface AgentOptions {
  name?: string;
  spec?: string;
  apiBase: string;
  apiKey: string;
  sessionId?: string;
  log: LogFn;
  depth: number;
  minWidth: number;
  maxWidth: number;
  gitUserName: string;
  gitUserEmail: string;
  ghToken: string;
  agentUpstream: string;
  onChildEvent?: (evt: AgentEvent) => void;
}

let _gitAvailable: boolean | undefined;
let _ghAvailable: boolean | undefined;

export function isGitAvailable(): boolean {
  if (_gitAvailable === undefined) {
    try {
      execSync("git --version", { encoding: "utf-8", stdio: "pipe" });
      _gitAvailable = true;
    } catch {
      _gitAvailable = false;
    }
  }
  return _gitAvailable;
}

export function isGhAvailable(): boolean {
  if (_ghAvailable === undefined) {
    try {
      execSync("gh --version", { encoding: "utf-8", stdio: "pipe" });
      _ghAvailable = true;
    } catch {
      _ghAvailable = false;
    }
  }
  return _ghAvailable;
}

function readEnv(name: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[name]?.trim() || undefined : undefined;
}

function getGitConfig(key: string): string | undefined {
  if (!isGitAvailable()) return undefined;
  try {
    return execSync(`git config ${key}`, { encoding: "utf-8", stdio: "pipe" }).trim() || undefined;
  } catch {
    return undefined;
  }
}

export interface ResolvedValue {
  value: string | undefined;
  source: string;
}

function configSource(key: keyof ConfigJson, config?: ConfigJson): string {
  if (config) return "config";
  const { project, user } = getMergedConfig();
  if (project[key] !== undefined) return "project";
  if (user[key] !== undefined) return "user config";
  return "config";
}

export function resolveApiBase(override?: string, config?: ConfigJson): ResolvedValue {
  const cfg = config ?? getConfig();
  if (override) return { value: override, source: "flag" };
  const env = readEnv("OBJECTIVEAI_API_BASE");
  if (env) return { value: env, source: "env OBJECTIVEAI_API_BASE" };
  if (cfg.apiBase) return { value: cfg.apiBase, source: configSource("apiBase", config) };
  return { value: "https://api.objective-ai.io", source: "default" };
}

export function resolveApiKey(override?: string, config?: ConfigJson): ResolvedValue {
  const cfg = config ?? getConfig();
  if (override) return { value: override, source: "flag" };
  const env = readEnv("OBJECTIVEAI_API_KEY");
  if (env) return { value: env, source: "env OBJECTIVEAI_API_KEY" };
  if (cfg.apiKey) return { value: cfg.apiKey, source: configSource("apiKey", config) };
  return { value: undefined, source: "not set" };
}

export function resolveGitUserName(override?: string, config?: ConfigJson): ResolvedValue {
  const cfg = config ?? getConfig();
  if (override) return { value: override, source: "flag" };
  const authorName = readEnv("GIT_AUTHOR_NAME");
  if (authorName) return { value: authorName, source: "env GIT_AUTHOR_NAME" };
  const committerName = readEnv("GIT_COMMITTER_NAME");
  if (committerName) return { value: committerName, source: "env GIT_COMMITTER_NAME" };
  if (cfg.gitUserName) return { value: cfg.gitUserName, source: configSource("gitUserName", config) };
  const gitCfg = getGitConfig("user.name");
  if (gitCfg) return { value: gitCfg, source: "git config" };
  return { value: undefined, source: "not set" };
}

export function resolveGitUserEmail(override?: string, config?: ConfigJson): ResolvedValue {
  const cfg = config ?? getConfig();
  if (override) return { value: override, source: "flag" };
  const authorEmail = readEnv("GIT_AUTHOR_EMAIL");
  if (authorEmail) return { value: authorEmail, source: "env GIT_AUTHOR_EMAIL" };
  const committerEmail = readEnv("GIT_COMMITTER_EMAIL");
  if (committerEmail) return { value: committerEmail, source: "env GIT_COMMITTER_EMAIL" };
  if (cfg.gitUserEmail) return { value: cfg.gitUserEmail, source: configSource("gitUserEmail", config) };
  const gitCfg = getGitConfig("user.email");
  if (gitCfg) return { value: gitCfg, source: "git config" };
  return { value: undefined, source: "not set" };
}

export function resolveGhToken(override?: string, config?: ConfigJson): ResolvedValue {
  const cfg = config ?? getConfig();
  if (override) return { value: override, source: "flag" };
  const env = readEnv("GH_TOKEN");
  if (env) return { value: env, source: "env GH_TOKEN" };
  if (cfg.ghToken) return { value: cfg.ghToken, source: configSource("ghToken", config) };
  return { value: undefined, source: "not set" };
}

export function resolveAgentUpstream(override?: string, config?: ConfigJson): ResolvedValue {
  const cfg = config ?? getConfig();
  if (override) return { value: override, source: "flag" };
  const env = readEnv("OBJECTIVEAI_AGENT_UPSTREAM");
  if (env) return { value: env, source: "env OBJECTIVEAI_AGENT_UPSTREAM" };
  if (cfg.agentUpstream) return { value: cfg.agentUpstream, source: configSource("agentUpstream", config) };
  return { value: "claude", source: "default" };
}

export function checkConfig(options: Partial<AgentOptions> = {}): void {
  const problems: string[] = [];

  if (!isGitAvailable()) {
    problems.push("\x1b[31m  - git is not installed\x1b[0m");
  }
  if (!isGhAvailable()) {
    problems.push("\x1b[31m  - gh (GitHub CLI) is not installed\x1b[0m");
  }

  const config = getConfig();
  const missing: { label: string; configKey: string }[] = [];

  if (!resolveApiKey(options.apiKey, config).value) {
    missing.push({ label: "ObjectiveAI API Key", configKey: "apiKey" });
  }
  if (!resolveGitUserName(options.gitUserName, config).value) {
    missing.push({ label: "Git User Name", configKey: "gitUserName" });
  }
  if (!resolveGitUserEmail(options.gitUserEmail, config).value) {
    missing.push({ label: "Git User Email", configKey: "gitUserEmail" });
  }
  if (!resolveGhToken(options.ghToken, config).value) {
    missing.push({ label: "GitHub Token", configKey: "ghToken" });
  }

  for (const m of missing) {
    problems.push(`\x1b[31m  - ${m.label} is not set\x1b[0m`);
  }

  if (problems.length > 0) {
    console.error("\n\x1b[31m  Missing requirements:\x1b[0m\n");
    for (const p of problems) {
      console.error(p);
    }
    if (missing.length > 0) {
      console.error("\n  Set with:\n");
      for (const m of missing) {
        console.error(`  objectiveai config ${m.configKey} <value>`);
      }
    }
    console.error("\n  Run \x1b[1mobjectiveai config\x1b[0m to see all options.\n");
    process.exit(1);
  }
}

export function makeAgentOptions(options: Partial<AgentOptions> = {}): AgentOptions {
  const config = getConfig();

  const apiBase = resolveApiBase(options.apiBase, config).value!;

  const apiKeyResult = resolveApiKey(options.apiKey, config);
  if (!apiKeyResult.value) {
    throw new Error("API key is required. Set OBJECTIVEAI_API_KEY or pass apiKey.");
  }
  const apiKey = apiKeyResult.value;

  const log = options.log ?? createFileLogger().log;
  const depth = options.depth ?? 0;

  const rawMin = options.minWidth && options.minWidth > 0 ? Math.round(options.minWidth) : undefined;
  const rawMax = options.maxWidth && options.maxWidth > 0 ? Math.round(options.maxWidth) : undefined;
  let minWidth: number;
  let maxWidth: number;
  if (rawMin && rawMax) {
    minWidth = rawMin;
    maxWidth = rawMax;
  } else if (rawMin) {
    minWidth = rawMin;
    maxWidth = Math.max(10, minWidth);
  } else if (rawMax) {
    maxWidth = rawMax;
    minWidth = Math.min(5, maxWidth);
  } else {
    minWidth = 5;
    maxWidth = 10;
  }

  const gitUserNameResult = resolveGitUserName(options.gitUserName, config);
  if (!gitUserNameResult.value) {
    throw new Error("Git user name is required. Set GIT_AUTHOR_NAME, configure git config user.name, or pass gitUserName.");
  }
  const gitUserName = gitUserNameResult.value;

  const gitUserEmailResult = resolveGitUserEmail(options.gitUserEmail, config);
  if (!gitUserEmailResult.value) {
    throw new Error("Git user email is required. Set GIT_AUTHOR_EMAIL, configure git config user.email, or pass gitUserEmail.");
  }
  const gitUserEmail = gitUserEmailResult.value;

  const ghTokenResult = resolveGhToken(options.ghToken, config);
  if (!ghTokenResult.value) {
    throw new Error("GitHub token is required. Set GH_TOKEN or pass ghToken.");
  }
  const ghToken = ghTokenResult.value;

  const agentUpstream = resolveAgentUpstream(options.agentUpstream, config).value!;

  const sessionId = options.sessionId ?? readSession();

  return {
    ...options,
    apiBase,
    apiKey,
    sessionId,
    log,
    depth,
    minWidth,
    maxWidth,
    gitUserName,
    gitUserEmail,
    ghToken,
    agentUpstream,
  };
}
