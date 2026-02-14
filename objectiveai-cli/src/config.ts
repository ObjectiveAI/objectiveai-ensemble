import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname, resolve } from "path";
import { homedir } from "os";

export interface ConfigJson {
  apiBase?: string;
  apiKey?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  ghToken?: string;
  agentUpstream?: string;
  claudeSpecModel?: string;
  claudeNameModel?: string;
  claudeTypeModel?: string;
  claudeInputSchemaModel?: string;
  claudeEssayModel?: string;
  claudeEssayTasksModel?: string;
  claudePlanModel?: string;
  claudeInventModel?: string;
  claudeAmendModel?: string;
}

function readConfigFile(dir: string): ConfigJson | undefined {
  try {
    const raw = readFileSync(join(dir, ".objectiveai", "config.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * Walk from CWD up to the root CWD (inclusive), collecting configs (closest first).
 * Root CWD is the original parent process's working directory, passed via
 * OBJECTIVEAI_ROOT_CWD. If not set, this is the root process and only CWD is checked.
 */
function collectAncestorConfigs(): ConfigJson[] {
  const configs: ConfigJson[] = [];
  const cwd = resolve(process.cwd());
  const rootCwd = process.env.OBJECTIVEAI_ROOT_CWD
    ? resolve(process.env.OBJECTIVEAI_ROOT_CWD)
    : cwd;

  let dir = cwd;
  const seen = new Set<string>();
  while (!seen.has(dir)) {
    seen.add(dir);
    const cfg = readConfigFile(dir);
    if (cfg) configs.push(cfg);
    if (dir === rootCwd) break;
    dir = dirname(dir);
  }
  return configs;
}

export interface MergedConfig {
  merged: ConfigJson;
  project: ConfigJson;
  user: ConfigJson;
}

let _merged: MergedConfig | undefined;
let _configLoaded = false;

export function getMergedConfig(): MergedConfig {
  if (!_configLoaded) {
    const ancestors = collectAncestorConfigs();
    const user = readConfigFile(homedir()) ?? {};
    // Project config: merge ancestors (farthest first so closest wins)
    const project: ConfigJson = {};
    for (let i = ancestors.length - 1; i >= 0; i--) {
      Object.assign(project, ancestors[i]);
    }
    // Final merge: user home is lowest priority, project is highest.
    const merged = { ...user, ...project };
    _merged = { merged, project, user };
    _configLoaded = true;
  }
  return _merged!;
}

export function getConfig(): ConfigJson {
  return getMergedConfig().merged;
}

export function setConfigValue(key: keyof ConfigJson, value: string, project: boolean): string {
  const dir = project ? process.cwd() : homedir();
  const configDir = join(dir, ".objectiveai");
  const configPath = join(configDir, "config.json");

  let existing: ConfigJson = {};
  try {
    existing = JSON.parse(readFileSync(configPath, "utf-8"));
  } catch {}

  existing[key] = value;

  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  writeFileSync(configPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");

  // Invalidate cache
  _configLoaded = false;
  _merged = undefined;

  return configPath;
}
