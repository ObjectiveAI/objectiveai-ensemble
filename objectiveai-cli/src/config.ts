import { readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { AgentUpstream, AgentUpstreamSchema } from "./agent";
import type { Config as MockConfig } from "./agent/mock";

interface ConfigJson {
  gitHubToken?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
  agent?: string;
  agentMockNotificationDelayMs?: number;
}

function readConfigFile(dir: string): ConfigJson | undefined {
  try {
    const raw = readFileSync(join(dir, ".objectiveai", "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function getValue<K extends keyof ConfigJson>(
  env: string | undefined,
  key: K,
  deserialize?: (env: string) => NonNullable<ConfigJson[K]>,
): NonNullable<ConfigJson[K]> | null {
  if (env)
    return deserialize ? deserialize(env) : (env as NonNullable<ConfigJson[K]>);
  const project = readConfigFile(process.cwd());
  if (project?.[key] !== undefined)
    return project[key] as NonNullable<ConfigJson[K]>;
  const user = readConfigFile(homedir());
  if (user?.[key] !== undefined) return user[key] as NonNullable<ConfigJson[K]>;
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
  const raw = getValue(process.env.OBJECTIVEAI_AGENT, "agent");
  if (raw === null) return null;
  const parsed = AgentUpstreamSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

export function getAgentMockConfig(): MockConfig | null {
  const raw = getValue(
    process.env.OBJECTIVEAI_AGENT_MOCK_NOTIFICATION_DELAY_MS,
    "agentMockNotificationDelayMs",
  );
  if (raw === null) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return { notificationDelayMs: n };
}
