import { execSync } from "child_process";
import { Command } from "commander";
import { Claude } from "./index";
import {
  resolveApiBase,
  resolveApiKey,
  resolveGitUserName,
  resolveGitUserEmail,
  resolveGhToken,
  resolveAgentUpstream,
  checkConfig,
  isGitAvailable,
  isGhAvailable,
  ResolvedValue,
} from "./agentOptions";
import { setConfigValue, ConfigJson } from "./config";
import { printBanner } from "./banner";

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
const RESET = "\x1b[0m";

function statusLabel(ok: boolean, label: string): string {
  return ok ? `${GREEN}${label}${RESET}` : `${RED}${label}${RESET}`;
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
      ? `  ${RED}config: missing values${RESET}  ${DIM}(run objectiveai config)${RESET}`
      : `  ${GREEN}config: all values set${RESET}`);
    console.log(git
      ? `  ${GREEN}git: installed${RESET}`
      : `  ${RED}git: not installed${RESET}`);
    console.log(gh
      ? `  ${GREEN}gh: installed${RESET}`
      : `  ${RED}gh: not installed${RESET}`);

    console.log(`\n${BOLD}Commands${RESET}\n`);
    console.log("  objectiveai invent [spec]   Invent a new function");
    console.log("  objectiveai amend [spec]    Amend an existing function");
    console.log("  objectiveai config          Show configuration details");
    console.log("  objectiveai dryrun          Preview the dashboard with simulated agents");
    console.log("");
  });

program
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
  .action(async (spec: string | undefined, opts: Record<string, string | number | undefined>) => {
    const partialOpts = {
      spec,
      name: opts.name as string | undefined,
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
    checkConfig(partialOpts);
    await Claude.invent(partialOpts);
  });

program
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
  .action(async (spec: string | undefined, opts: Record<string, string | number | undefined>) => {
    const partialOpts = {
      spec,
      name: opts.name as string | undefined,
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
    checkConfig(partialOpts);
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

function formatRow(label: string, resolved: ResolvedValue, secret = false): string {
  if (!resolved.value) {
    return `${RED}  ${label}: (not set)${RESET}`;
  }
  const display = secret ? mask(resolved.value) : resolved.value;
  return `${GREEN}  ${label}: ${display} ${DIM}(${resolved.source})${RESET}`;
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
    console.log(`${GREEN}  Current value: ${display} ${DIM}(${resolved.source})${RESET}`);
  } else {
    console.log(`${RED}  Current value: (not set)${RESET}`);
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
    console.log(formatRow("ObjectiveAI API Base", apiBase));
    console.log(formatRow("ObjectiveAI API Key", apiKey, true));
    console.log(formatRow("Git User Name", gitUserName));
    console.log(formatRow("Git User Email", gitUserEmail));
    console.log(formatRow("GitHub Token", ghToken, true));
    console.log(formatRow("Agent Upstream", agentUpstream));

    console.log(`\n${BOLD}Configuration Sources${RESET} (highest to lowest priority)\n`);
    console.log("  1. CLI flags (--api-key, --gh-token, etc.)");
    console.log("  2. Environment variables (OBJECTIVEAI_API_KEY, GH_TOKEN, etc.)");
    console.log("  3. .objectiveai/config.json (project)");
    console.log("  4. ~/.objectiveai/config.json (user)");
    console.log("  5. git config (user.name, user.email)");

    console.log(`\n${BOLD}Commands${RESET}\n`);
    console.log("  objectiveai config apiBase      Show ObjectiveAI API base URL");
    console.log("  objectiveai config apiKey       Show ObjectiveAI API key");
    console.log("  objectiveai config gitUserName  Show git user name");
    console.log("  objectiveai config gitUserEmail Show git user email");
    console.log("  objectiveai config ghToken      Show GitHub token");
    console.log("  objectiveai config agentUpstream Show agent upstream");
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

program.parse(process.argv);
