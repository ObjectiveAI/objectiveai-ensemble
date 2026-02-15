import { query, type ModelInfo } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AgentOptions } from "../agentOptions";
import { CLAUDE_MODEL_KEYS } from "../agentOptions";

interface CacheFile {
  timestamp: number;
  models: ModelInfo[];
}

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

let _memoryCache: ModelInfo[] | undefined;

function cachePath(): string {
  return join(homedir(), ".objectiveai", "claude-supported-models-cache.json");
}

function readCache(): ModelInfo[] | undefined {
  if (_memoryCache) return _memoryCache;

  const path = cachePath();
  if (!existsSync(path)) return undefined;

  try {
    const raw: CacheFile = JSON.parse(readFileSync(path, "utf-8"));
    if (Date.now() - raw.timestamp < CACHE_TTL) {
      _memoryCache = raw.models;
      return raw.models;
    }
  } catch {}

  return undefined;
}

function writeCache(models: ModelInfo[]): void {
  const dir = join(homedir(), ".objectiveai");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const data: CacheFile = { timestamp: Date.now(), models };
  writeFileSync(cachePath(), JSON.stringify(data, null, 2), "utf-8");
}

async function fetchFromSdk(): Promise<ModelInfo[]> {
  const q = query({ prompt: "" });
  const models = await q.supportedModels();
  return models;
}

export async function getClaudeSupportedModels(): Promise<ModelInfo[]> {
  const cached = readCache();
  if (cached) return cached;

  const models = await fetchFromSdk();
  _memoryCache = models;
  writeCache(models);
  return models;
}

export async function validateClaudeModel(
  value: string,
): Promise<string | null> {
  const models = await getClaudeSupportedModels();
  if (!models.some((m) => m.value === value)) {
    return `Unknown model "${value}". Supported: ${models.map((m) => m.value).join(", ")}`;
  }
  return null;
}

export async function validateClaudeModels(
  options: Partial<AgentOptions>,
): Promise<void> {
  const models = await getClaudeSupportedModels();
  const modelValues = new Set(models.map((m) => m.value));
  const errors: string[] = [];

  for (const key of CLAUDE_MODEL_KEYS) {
    const val = options[key];
    if (val && !modelValues.has(val)) {
      errors.push(`  ${key}: "${val}" is not a supported model`);
    }
  }

  if (errors.length > 0) {
    console.error("\n\x1b[31m  Invalid Claude models:\x1b[0m\n");
    for (const e of errors) {
      console.error(e);
    }
    console.error(
      `\n  Supported: ${[...modelValues].join(", ")}\n`,
    );
    process.exit(1);
  }
}
