import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { AgentUpstream, AgentUpstreamSchema } from "./agent";
import type { Config as MockConfig } from "./agent/mock";

export interface ConfigJson {
  gitHubToken?: string;
  gitAuthorName?: string;
  gitAuthorEmail?: string;
  agent?: string;
  agentMockNotificationDelayMs?: number;
  agentClaudeTypeModel?: string;
  agentClaudeNameModel?: string;
  agentClaudeEssayModel?: string;
  agentClaudeFieldsModel?: string;
  agentClaudeEssayTasksModel?: string;
  agentClaudeBodyModel?: string;
  agentClaudeDescriptionModel?: string;
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

// Home config file helpers (for the TUI config panel)

const homeConfigDir = () => join(homedir(), ".objectiveai");
const homeConfigPath = () => join(homeConfigDir(), "config.json");

export function readHomeConfig(): ConfigJson {
  try {
    return JSON.parse(readFileSync(homeConfigPath(), "utf-8"));
  } catch {
    return {};
  }
}

function writeHomeConfig(config: ConfigJson): void {
  const dir = homeConfigDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(homeConfigPath(), JSON.stringify(config, null, 2) + "\n");
}

export function setHomeConfigValue<K extends keyof ConfigJson>(
  key: K,
  value: NonNullable<ConfigJson[K]>,
): void {
  const config = readHomeConfig();
  config[key] = value;
  writeHomeConfig(config);
}

export function deleteHomeConfigValue(key: keyof ConfigJson): void {
  const config = readHomeConfig();
  delete config[key];
  writeHomeConfig(config);
}
