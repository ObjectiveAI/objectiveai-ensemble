import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { AgentUpstream, AgentUpstreamSchema } from "./agent";

interface ConfigJson {
  gitHubToken?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
  agentUpstream?: string;
}

function readConfigFile(dir: string): ConfigJson | undefined {
  try {
    const raw = readFileSync(join(dir, ".objectiveai", "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function getValue(
  env: string | undefined,
  key: keyof ConfigJson,
): string | null {
  if (env) return env;
  const project = readConfigFile(process.cwd());
  if (project?.[key]) return project[key];
  const user = readConfigFile(homedir());
  if (user?.[key]) return user[key];
  return null;
}

export function getGitHubToken(): string | null {
  return getValue(process.env.OBJECTIVEAI_GITHUB_TOKEN, "gitHubToken");
}

export function getGitAuthorName(): string | null {
  return getValue(process.env.OBJECTIVEAI_GIT_AUTHOR_NAME, "gitAuthorName");
}

export function getGitAuthorEmail(): string | null {
  return getValue(process.env.OBJECTIVEAI_GIT_AUTHOR_EMAIL, "gitAuthorEmail");
}

export function getAgentUpstream(): AgentUpstream | null {
  const raw = getValue(process.env.OBJECTIVEAI_AGENT_UPSTREAM, "agentUpstream");
  if (raw === null) return null;
  const parsed = AgentUpstreamSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}
