import { execSync } from "child_process";
import { readFileSync } from "fs";
import { Command } from "commander";
import { Claude } from "./index";
import {
  resolveApiBase,
  resolveApiKey,
  resolveGitUserName,
  resolveGitUserEmail,
  resolveGhToken,
  resolveAgentUpstream,
  resolveClaudeModel,
  checkConfig,
  isGitAvailable,
  isGhAvailable,
  ResolvedValue,
  CLAUDE_MODEL_KEYS,
  type ClaudeModelKey,
} from "./agentOptions";
import { setConfigValue, ConfigJson } from "./config";
import { printBanner } from "./banner";
import { getClaudeSupportedModels, validateClaudeModel, validateClaudeModels } from "./claude/supportedModels";
import {
  validateInputSchema,
  isValidVectorInputSchema,
} from "./tools/function/inputSchema";
import { readType } from "./tools/function/type";

const claudeModelConfigs = [
  { key: "claudeSpecModel" as ClaudeModelKey, flag: "--claude-spec-model", label: "Claude Spec Model", desc: "Model for SPEC.md generation" },
  { key: "claudeNameModel" as ClaudeModelKey, flag: "--claude-name-model", label: "Claude Name Model", desc: "Model for name generation" },
  { key: "claudeTypeModel" as ClaudeModelKey, flag: "--claude-type-model", label: "Claude Type Model", desc: "Model for type selection" },
  { key: "claudeInputSchemaModel" as ClaudeModelKey, flag: "--claude-input-schema-model", label: "Claude Input Schema Model", desc: "Model for input schema generation" },
  { key: "claudeEssayModel" as ClaudeModelKey, flag: "--claude-essay-model", label: "Claude Essay Model", desc: "Model for ESSAY.md generation" },
  { key: "claudeEssayTasksModel" as ClaudeModelKey, flag: "--claude-essay-tasks-model", label: "Claude Essay Tasks Model", desc: "Model for ESSAY_TASKS.md generation" },
  { key: "claudePlanModel" as ClaudeModelKey, flag: "--claude-plan-model", label: "Claude Plan Model", desc: "Model for plan step" },
  { key: "claudeInventModel" as ClaudeModelKey, flag: "--claude-invent-model", label: "Claude Invent Model", desc: "Model for invent loop" },
  { key: "claudeAmendModel" as ClaudeModelKey, flag: "--claude-amend-model", label: "Claude Amend Model", desc: "Model for amend loop" },
];

// If spawned by a parent agent, exit when the parent dies.
const parentPid = process.env.OBJECTIVEAI_PARENT_PID
  ? parseInt(process.env.OBJECTIVEAI_PARENT_PID, 10)
  : undefined;
if (parentPid) {
  const watchdog = setInterval(() => {
    try {
      process.kill(parentPid, 0);
    } catch {
      clearInterval(watchdog);
      process.exit(1);
    }
  }, 3000);
  watchdog.unref();
}

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const UNDERLINE = "\x1b[4m";
const RESET = "\x1b[0m";

function statusLabel(ok: boolean, label: string): string {
  return ok ? `${GREEN}${label}${RESET}` : `${RED}${label}${RESET}`;
}

/**
 * Validate --input-schema CLI arg. Returns the (possibly updated) type.
 * - Parses JSON and validates against InputSchemaSchema
 * - Cross-validates against the effective type (from function.json or CLI flag)
 * - If type is unknown and schema is only valid for scalar, returns "scalar.function"
 */
function validateCliInputSchema(
  inputSchemaStr: string | undefined,
  cliType: "scalar.function" | "vector.function" | undefined,
): "scalar.function" | "vector.function" | undefined {
  if (!inputSchemaStr) return cliType;

  let parsed: unknown;
  try {
    parsed = JSON.parse(inputSchemaStr);
  } catch {
    console.error("--input-schema must be valid JSON");
    process.exit(1);
  }

  const result = validateInputSchema({ input_schema: parsed });
  if (!result.ok) {
    console.error(`--input-schema is not a valid input schema: ${result.error}`);
    process.exit(1);
  }

  const validForVector = isValidVectorInputSchema(result.value);

  // Determine effective type: CLI flag > function.json
  let effectiveType = cliType;
  if (!effectiveType) {
    const fnType = readType();
    if (fnType.ok && typeof fnType.value === "string") {
      effectiveType = fnType.value as "scalar.function" | "vector.function";
    }
  }

  if (effectiveType === "vector.function" && !validForVector) {
    console.error(
      "--input-schema is not valid for vector.function: must be an array or an object with at least one array property",
    );
    process.exit(1);
  }

  // If type is unknown and schema is only valid for scalar, pre-set type
  if (!effectiveType && !validForVector) {
    return "scalar.function";
  }

  return cliType;
}

const program = new Command();

program
  .name("objectiveai")
  .description("ObjectiveAI")
  .action(() => {
    printBanner();

    const git = isGitAvailable();
    const gh = isGhAvailable();
    const apiKey = resolveApiKey();
    const gitUserName = resolveGitUserName();
    const gitUserEmail = resolveGitUserEmail();
    const ghToken = resolveGhToken();

    const anyConfigMissing = !apiKey.value || !gitUserName.value || !gitUserEmail.value || !ghToken.value;

    console.log(`${BOLD}Status${RESET}\n`);
    console.log(anyConfigMissing
      ? `  ${RED}${UNDERLINE}config${RESET}${RED}  missing values  ${DIM}(run objectiveai config)${RESET}`
      : `  ${GREEN}${UNDERLINE}config${RESET}${GREEN}  all values set${RESET}`);
    console.log(git
      ? `  ${GREEN}${UNDERLINE}git${RESET}${GREEN}     installed${RESET}`
      : `  ${RED}${UNDERLINE}git${RESET}${RED}     not installed${RESET}`);
    console.log(gh
      ? `  ${GREEN}${UNDERLINE}gh${RESET}${GREEN}      installed${RESET}`
      : `  ${RED}${UNDERLINE}gh${RESET}${RED}      not installed${RESET}`);

    console.log(`\n${BOLD}Commands${RESET}\n`);
    console.log("  objectiveai invent [spec]   Invent a new function");
    console.log("  objectiveai amend [spec]    Amend an existing function");
    console.log("  objectiveai config          Show configuration details");
    console.log("  objectiveai dryrun          Preview the dashboard with simulated agents");
    console.log("");
  });

const inventCmd = program
  .command("invent")
  .description("Invent a new ObjectiveAI Function")
  .argument("[spec]", "Optional spec string for SPEC.md")
  .option("--name <name>", "Function name for name.txt")
  .option("--depth <n>", "Depth level (0=vector, >0=function tasks)", parseInt)
  .option("--api-base <url>", "API base URL")
  .option("--api-key <key>", "ObjectiveAI API key")
  .option("--git-user-name <name>", "Git author/committer name")
  .option("--git-user-email <email>", "Git author/committer email")
  .option("--gh-token <token>", "GitHub token for gh CLI")
  .option("--agent-upstream <upstream>", "Agent upstream (default: claude)")
  .option("--width <n>", "Exact number of tasks (sets both min and max)", parseInt)
  .option("--min-width <n>", "Minimum number of tasks", parseInt)
  .option("--max-width <n>", "Maximum number of tasks", parseInt)
  .option("--scalar", "Set function type to scalar.function")
  .option("--vector", "Set function type to vector.function")
  .option("--input-schema <json>", "Input schema JSON string")
  .option("--spec-file <path>", "Read spec from file instead of CLI arg")
  .option("--input-schema-file <path>", "Read input schema JSON from file instead of CLI arg")
  .option("--mutable-input-schema", "Allow editing input schema in the main loop");
for (const cfg of claudeModelConfigs) {
  inventCmd.option(`${cfg.flag} <model>`, cfg.desc);
}
inventCmd.action(async (spec: string | undefined, opts: Record<string, string | number | boolean | undefined>) => {
    if (opts.scalar && opts.vector) {
      console.error("Cannot use both --scalar and --vector");
      process.exit(1);
    }
    if (opts.specFile) {
      spec = readFileSync(opts.specFile as string, "utf-8");
    }
    let type: "scalar.function" | "vector.function" | undefined =
      opts.scalar ? "scalar.function" : opts.vector ? "vector.function" : undefined;
    let inputSchemaStr = opts.inputSchema as string | undefined;
    if (opts.inputSchemaFile) {
      inputSchemaStr = readFileSync(opts.inputSchemaFile as string, "utf-8");
    }
    type = validateCliInputSchema(inputSchemaStr, type);
    const partialOpts: Record<string, unknown> = {
      spec,
      name: opts.name as string | undefined,
      type,
      inputSchema: inputSchemaStr,
      mutableInputSchema: !!opts.mutableInputSchema,
      depth: opts.depth as number | undefined,
      minWidth: (opts.width as number | undefined) ?? (opts.minWidth as number | undefined),
      maxWidth: (opts.width as number | undefined) ?? (opts.maxWidth as number | undefined),
      apiBase: opts.apiBase as string | undefined,
      apiKey: opts.apiKey as string | undefined,
      gitUserName: opts.gitUserName as string | undefined,
      gitUserEmail: opts.gitUserEmail as string | undefined,
      ghToken: opts.ghToken as string | undefined,
      agentUpstream: opts.agentUpstream as string | undefined,
    };
    for (const cfg of claudeModelConfigs) {
      if (opts[cfg.key]) partialOpts[cfg.key] = opts[cfg.key] as string;
    }
    checkConfig(partialOpts);
    const upstream = resolveAgentUpstream(opts.agentUpstream as string | undefined).value;
    if (upstream === "claude") {
      await validateClaudeModels(partialOpts);
    }
    await Claude.invent(partialOpts);
  });

const amendCmd = program
  .command("amend")
  .description("Amend an existing ObjectiveAI Function")
  .argument("[spec]", "Amendment spec to append to SPEC.md")
  .option("--name <name>", "Function name for name.txt")
  .option("--depth <n>", "Depth level (0=vector, >0=function tasks)", parseInt)
  .option("--api-base <url>", "API base URL")
  .option("--api-key <key>", "ObjectiveAI API key")
  .option("--git-user-name <name>", "Git author/committer name")
  .option("--git-user-email <email>", "Git author/committer email")
  .option("--gh-token <token>", "GitHub token for gh CLI")
  .option("--agent-upstream <upstream>", "Agent upstream (default: claude)")
  .option("--width <n>", "Exact number of tasks (sets both min and max)", parseInt)
  .option("--min-width <n>", "Minimum number of tasks", parseInt)
  .option("--max-width <n>", "Maximum number of tasks", parseInt)
  .option("--scalar", "Set function type to scalar.function")
  .option("--vector", "Set function type to vector.function")
  .option("--input-schema <json>", "Input schema JSON string")
  .option("--input-schema-file <path>", "Read input schema JSON from file instead of CLI arg")
  .option("--mutable-input-schema", "Allow editing input schema in the main loop")
  .option("--overwrite-input-schema", "Overwrite existing input schema with --input-schema value");
for (const cfg of claudeModelConfigs) {
  amendCmd.option(`${cfg.flag} <model>`, cfg.desc);
}
amendCmd.action(async (spec: string | undefined, opts: Record<string, string | number | boolean | undefined>) => {
    if (opts.scalar && opts.vector) {
      console.error("Cannot use both --scalar and --vector");
      process.exit(1);
    }
    let type: "scalar.function" | "vector.function" | undefined =
      opts.scalar ? "scalar.function" : opts.vector ? "vector.function" : undefined;
    let inputSchemaStr = opts.inputSchema as string | undefined;
    if (opts.inputSchemaFile) {
      inputSchemaStr = readFileSync(opts.inputSchemaFile as string, "utf-8");
    }
    type = validateCliInputSchema(inputSchemaStr, type);
    const partialOpts: Record<string, unknown> = {
      spec,
      name: opts.name as string | undefined,
      type,
      inputSchema: inputSchemaStr,
      mutableInputSchema: !!opts.mutableInputSchema,
      overwriteInputSchema: !!opts.overwriteInputSchema,
      depth: opts.depth as number | undefined,
      minWidth: (opts.width as number | undefined) ?? (opts.minWidth as number | undefined),
      maxWidth: (opts.width as number | undefined) ?? (opts.maxWidth as number | undefined),
      apiBase: opts.apiBase as string | undefined,
      apiKey: opts.apiKey as string | undefined,
      gitUserName: opts.gitUserName as string | undefined,
      gitUserEmail: opts.gitUserEmail as string | undefined,
      ghToken: opts.ghToken as string | undefined,
      agentUpstream: opts.agentUpstream as string | undefined,
    };
    for (const cfg of claudeModelConfigs) {
      if (opts[cfg.key]) partialOpts[cfg.key] = opts[cfg.key] as string;
    }
    checkConfig(partialOpts);
    const upstream = resolveAgentUpstream(opts.agentUpstream as string | undefined).value;
    if (upstream === "claude") {
      await validateClaudeModels(partialOpts);
    }
    await Claude.amend(partialOpts);
  });

program
  .command("dryrun")
  .description("Preview the CLI dashboard with simulated agents")
  .action(async () => {
    await Claude.dryrun();
  });

// ── Config helpers ──────────────────────────────────────────────────

function mask(value: string): string {
  if (value.length <= 8) return "*".repeat(value.length);
  return value.slice(0, 4) + "*".repeat(value.length - 8) + value.slice(-4);
}

interface RowData {
  label: string;
  resolved: ResolvedValue;
  secret?: boolean;
}

function printRows(rows: RowData[]): void {
  const labelWidth = Math.max(...rows.map((r) => r.label.length));
  const displayValues = rows.map((r) => {
    if (!r.resolved.value) return "(not set)";
    return r.secret ? mask(r.resolved.value) : r.resolved.value;
  });
  const valueWidth = Math.max(...displayValues.map((v) => v.length));

  for (let i = 0; i < rows.length; i++) {
    const { label, resolved } = rows[i];
    const display = displayValues[i];
    const color = resolved.value ? GREEN : RED;
    const labelPad = " ".repeat(labelWidth - label.length);
    const source = resolved.value
      ? `  ${DIM}(${resolved.source})${RESET}`
      : "";
    console.log(
      `  ${color}${UNDERLINE}${label}${RESET}${color}` +
      `${labelPad}  ${display.padEnd(valueWidth)}` +
      source +
      RESET,
    );
  }
}

interface SourceEntry {
  label: string;
  key: string;  // matched against resolved.source
}

function showConfigDetail(
  label: string,
  resolved: ResolvedValue,
  description: string,
  sources: SourceEntry[],
  configKey: keyof ConfigJson,
  secret = false,
): void {
  printBanner();
  console.log(`${BOLD}${label}${RESET}\n`);
  console.log(`  ${description}\n`);

  if (resolved.value) {
    const display = secret ? mask(resolved.value) : resolved.value;
    console.log(`  ${GREEN}${UNDERLINE}current value${RESET}${GREEN}  ${display}  ${DIM}(${resolved.source})${RESET}`);
  } else {
    console.log(`  ${RED}${UNDERLINE}current value${RESET}${RED}  (not set)${RESET}`);
  }

  console.log(`\n${BOLD}Sources${RESET} (highest to lowest priority)\n`);
  for (let i = 0; i < sources.length; i++) {
    const active = resolved.value && resolved.source === sources[i].key;
    if (active) {
      console.log(`${GREEN}  ${i + 1}. ${sources[i].label}${RESET}`);
    } else {
      console.log(`${DIM}  ${i + 1}. ${sources[i].label}${RESET}`);
    }
  }

  console.log(`\n${BOLD}Set${RESET}\n`);
  console.log(`  objectiveai config ${configKey} <value>`);
  console.log(`  objectiveai config ${configKey} <value> --project`);
  console.log("");
}

// ── Validators ──────────────────────────────────────────────────────

function validateApiBase(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return "URL must use http or https protocol.";
    }
    return null;
  } catch {
    return "Invalid URL.";
  }
}

function validateApiKey(value: string): string | null {
  if (!/^apk[0-9a-f]{32}$/.test(value)) {
    return "Invalid API key. Expected format: apk followed by 32 hex characters (e.g. apk1234567890abcdef1234567890abcdef).";
  }
  return null;
}

function validateGitUserName(value: string): string | null {
  if (value.length === 0) {
    return "Git user name cannot be empty.";
  }
  return null;
}

function validateGitUserEmail(value: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Invalid email address.";
  }
  return null;
}

function validateGhToken(value: string): string | null {
  if (value.length === 0) {
    return "GitHub token cannot be empty.";
  }
  if (!isGhAvailable()) {
    return "gh (GitHub CLI) is not installed. Install it from https://cli.github.com to verify and use GitHub tokens.";
  }
  try {
    const result = execSync("gh api user --jq .login", {
      encoding: "utf-8",
      stdio: "pipe",
      env: { ...process.env, GH_TOKEN: value },
    }).trim();
    if (!result) {
      return "GitHub token is not valid (no user returned).";
    }
    return null;
  } catch {
    return "GitHub token is not valid (authentication failed).";
  }
}

function validateAgentUpstream(value: string): string | null {
  const validUpstreams = ["claude"];
  if (!validUpstreams.includes(value)) {
    return `Invalid agent upstream. Valid values: ${validUpstreams.join(", ")}`;
  }
  return null;
}

type Validator = (value: string) => string | null;

function setAndReport(
  configKey: keyof ConfigJson,
  value: string,
  project: boolean,
  validate: Validator,
): void {
  const error = validate(value);
  if (error) {
    console.error(`\n\x1b[31m  Error: ${error}\x1b[0m\n`);
    process.exit(1);
  }
  const path = setConfigValue(configKey, value, project);
  const where = project ? "project" : "user";
  console.log(`\n  Set ${configKey} in ${where} config (${path})\n`);
}

// ── Config command ──────────────────────────────────────────────────

const configCmd = program
  .command("config")
  .description("Display or set configuration values");

configCmd
  .action(() => {
    printBanner();

    const apiBase = resolveApiBase();
    const apiKey = resolveApiKey();
    const gitUserName = resolveGitUserName();
    const gitUserEmail = resolveGitUserEmail();
    const ghToken = resolveGhToken();
    const agentUpstream = resolveAgentUpstream();

    console.log(`${BOLD}Current Configuration${RESET}\n`);
    printRows([
      { label: "ObjectiveAI API Base", resolved: apiBase },
      { label: "ObjectiveAI API Key", resolved: apiKey, secret: true },
      { label: "Git User Name", resolved: gitUserName },
      { label: "Git User Email", resolved: gitUserEmail },
      { label: "GitHub Token", resolved: ghToken, secret: true },
      { label: "Agent Upstream", resolved: agentUpstream },
      ...claudeModelConfigs.map((cfg) => ({
        label: cfg.label,
        resolved: resolveClaudeModel(cfg.key),
      })),
    ]);

    console.log(`\n${BOLD}Configuration Sources${RESET} (highest to lowest priority)\n`);
    console.log("  1. CLI flags (--api-key, --gh-token, etc.)");
    console.log("  2. Environment variables (OBJECTIVEAI_API_KEY, GH_TOKEN, etc.)");
    console.log("  3. .objectiveai/config.json (project)");
    console.log("  4. ~/.objectiveai/config.json (user)");
    console.log("  5. git config (user.name, user.email)");

    const configCommands: [string, string][] = [
      ["apiBase", "Show ObjectiveAI API base URL"],
      ["apiKey", "Show ObjectiveAI API key"],
      ["gitUserName", "Show git user name"],
      ["gitUserEmail", "Show git user email"],
      ["ghToken", "Show GitHub token"],
      ["agentUpstream", "Show agent upstream"],
      ["claudeModels", "List available Claude models"],
      ...claudeModelConfigs.map((cfg): [string, string] => [cfg.key, `Show ${cfg.label.toLowerCase()}`]),
    ];
    const pad = Math.max(...configCommands.map(([k]) => k.length)) + 2;

    console.log(`\n${BOLD}Commands${RESET}\n`);
    for (const [key, desc] of configCommands) {
      console.log(`  objectiveai config ${key.padEnd(pad)} ${desc}`);
    }
    console.log("");
  });

configCmd
  .command("apiBase")
  .description("Show or set ObjectiveAI API base URL")
  .argument("[value]", "URL to set")
  .option("--project", "Write to project config instead of user config")
  .action((value: string | undefined, opts: { project?: boolean }) => {
    if (value) {
      setAndReport("apiBase", value, !!opts.project, validateApiBase);
    } else {
      showConfigDetail(
        "ObjectiveAI API Base",
        resolveApiBase(),
        "Base URL for the ObjectiveAI API. Used for all API requests.",
        [
          { label: "CLI flag: --api-base <url>", key: "flag" },
          { label: "Environment variable: OBJECTIVEAI_API_BASE", key: "env OBJECTIVEAI_API_BASE" },
          { label: ".objectiveai/config.json (project)", key: "project" },
          { label: "~/.objectiveai/config.json (user)", key: "user config" },
          { label: "Default: https://api.objective-ai.io", key: "default" },
        ],
        "apiBase",
      );
    }
  });

configCmd
  .command("apiKey")
  .description("Show or set ObjectiveAI API key")
  .argument("[value]", "API key to set (apk + 32 hex chars)")
  .option("--project", "Write to project config instead of user config")
  .action((value: string | undefined, opts: { project?: boolean }) => {
    if (value) {
      setAndReport("apiKey", value, !!opts.project, validateApiKey);
    } else {
      showConfigDetail(
        "ObjectiveAI API Key",
        resolveApiKey(),
        "API key for authenticating with the ObjectiveAI API. Format: apk followed by 32 hex characters.",
        [
          { label: "CLI flag: --api-key <key>", key: "flag" },
          { label: "Environment variable: OBJECTIVEAI_API_KEY", key: "env OBJECTIVEAI_API_KEY" },
          { label: ".objectiveai/config.json (project)", key: "project" },
          { label: "~/.objectiveai/config.json (user)", key: "user config" },
        ],
        "apiKey",
        true,
      );
    }
  });

configCmd
  .command("gitUserName")
  .description("Show or set git user name")
  .argument("[value]", "Git user name to set")
  .option("--project", "Write to project config instead of user config")
  .action((value: string | undefined, opts: { project?: boolean }) => {
    if (value) {
      setAndReport("gitUserName", value, !!opts.project, validateGitUserName);
    } else {
      showConfigDetail(
        "Git User Name",
        resolveGitUserName(),
        "Name used for git commits when creating and publishing functions.",
        [
          { label: "CLI flag: --git-user-name <name>", key: "flag" },
          { label: "Environment variable: GIT_AUTHOR_NAME", key: "env GIT_AUTHOR_NAME" },
          { label: "Environment variable: GIT_COMMITTER_NAME", key: "env GIT_COMMITTER_NAME" },
          { label: ".objectiveai/config.json (project)", key: "project" },
          { label: "~/.objectiveai/config.json (user)", key: "user config" },
          { label: "git config user.name", key: "git config" },
        ],
        "gitUserName",
      );
    }
  });

configCmd
  .command("gitUserEmail")
  .description("Show or set git user email")
  .argument("[value]", "Git user email to set")
  .option("--project", "Write to project config instead of user config")
  .action((value: string | undefined, opts: { project?: boolean }) => {
    if (value) {
      setAndReport("gitUserEmail", value, !!opts.project, validateGitUserEmail);
    } else {
      showConfigDetail(
        "Git User Email",
        resolveGitUserEmail(),
        "Email used for git commits when creating and publishing functions.",
        [
          { label: "CLI flag: --git-user-email <email>", key: "flag" },
          { label: "Environment variable: GIT_AUTHOR_EMAIL", key: "env GIT_AUTHOR_EMAIL" },
          { label: "Environment variable: GIT_COMMITTER_EMAIL", key: "env GIT_COMMITTER_EMAIL" },
          { label: ".objectiveai/config.json (project)", key: "project" },
          { label: "~/.objectiveai/config.json (user)", key: "user config" },
          { label: "git config user.email", key: "git config" },
        ],
        "gitUserEmail",
      );
    }
  });

configCmd
  .command("ghToken")
  .description("Show or set GitHub token")
  .argument("[value]", "GitHub token to set")
  .option("--project", "Write to project config instead of user config")
  .action((value: string | undefined, opts: { project?: boolean }) => {
    if (value) {
      setAndReport("ghToken", value, !!opts.project, validateGhToken);
    } else {
      showConfigDetail(
        "GitHub Token",
        resolveGhToken(),
        "GitHub personal access token. Used for creating repositories and pushing function code via the gh CLI.",
        [
          { label: "CLI flag: --gh-token <token>", key: "flag" },
          { label: "Environment variable: GH_TOKEN", key: "env GH_TOKEN" },
          { label: ".objectiveai/config.json (project)", key: "project" },
          { label: "~/.objectiveai/config.json (user)", key: "user config" },
        ],
        "ghToken",
        true,
      );
    }
  });

configCmd
  .command("agentUpstream")
  .description("Show or set agent upstream")
  .argument("[value]", "Agent upstream to set (e.g. claude)")
  .option("--project", "Write to project config instead of user config")
  .action((value: string | undefined, opts: { project?: boolean }) => {
    if (value) {
      setAndReport("agentUpstream", value, !!opts.project, validateAgentUpstream);
    } else {
      showConfigDetail(
        "Agent Upstream",
        resolveAgentUpstream(),
        "Upstream agent provider for function generation and amendment.",
        [
          { label: "CLI flag: --agent-upstream <upstream>", key: "flag" },
          { label: "Environment variable: OBJECTIVEAI_AGENT_UPSTREAM", key: "env OBJECTIVEAI_AGENT_UPSTREAM" },
          { label: ".objectiveai/config.json (project)", key: "project" },
          { label: "~/.objectiveai/config.json (user)", key: "user config" },
          { label: "Default: claude", key: "default" },
        ],
        "agentUpstream",
      );
    }
  });

configCmd
  .command("claudeModels")
  .description("List available Claude models")
  .action(async () => {
    printBanner();
    console.log(`${BOLD}Available Claude Models${RESET}\n`);
    try {
      const models = await getClaudeSupportedModels();
      for (const m of models) {
        console.log(`  ${GREEN}${m.value}${RESET}`);
        console.log(`${DIM}    ${m.displayName} — ${m.description}${RESET}`);
      }
      console.log("");
    } catch (e) {
      console.error(`\n${RED}  Failed to fetch models: ${e instanceof Error ? e.message : e}${RESET}\n`);
      process.exit(1);
    }
  });

// ── Claude model config subcommands ─────────────────────────────────

for (const cfg of claudeModelConfigs) {
  configCmd
    .command(cfg.key)
    .description(`Show or set ${cfg.label.toLowerCase()}`)
    .argument("[value]", "Model name to set")
    .option("--project", "Write to project config instead of user config")
    .action(async (value: string | undefined, opts: { project?: boolean }) => {
      if (value) {
        const error = await validateClaudeModel(value);
        if (error) {
          console.error(`\n\x1b[31m  Error: ${error}\x1b[0m\n`);
          process.exit(1);
        }
        const path = setConfigValue(cfg.key, value, !!opts.project);
        const where = opts.project ? "project" : "user";
        console.log(`\n  Set ${cfg.key} in ${where} config (${path})\n`);
      } else {
        showConfigDetail(
          cfg.label,
          resolveClaudeModel(cfg.key),
          `${cfg.desc}. Leave unset to use the default Claude model.`,
          [
            { label: `CLI flag: ${cfg.flag} <model>`, key: "flag" },
            { label: ".objectiveai/config.json (project)", key: "project" },
            { label: "~/.objectiveai/config.json (user)", key: "user config" },
            { label: "Default: (not set, uses SDK default)", key: "not set" },
          ],
          cfg.key,
        );
      }
    });
}

program.parse(process.argv);
