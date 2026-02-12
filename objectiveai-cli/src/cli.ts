import { Command } from "commander";
import { Claude } from "./index";

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

const program = new Command();

program
  .name("objectiveai")
  .description("ObjectiveAI CLI");

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
  .option("--width <n>", "Exact number of tasks (sets both min and max)", parseInt)
  .option("--min-width <n>", "Minimum number of tasks", parseInt)
  .option("--max-width <n>", "Maximum number of tasks", parseInt)
  .action(async (spec: string | undefined, opts: Record<string, string | number | undefined>) => {
    await Claude.invent({
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
    });
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
  .option("--width <n>", "Exact number of tasks (sets both min and max)", parseInt)
  .option("--min-width <n>", "Minimum number of tasks", parseInt)
  .option("--max-width <n>", "Maximum number of tasks", parseInt)
  .action(async (spec: string | undefined, opts: Record<string, string | number | undefined>) => {
    await Claude.amend({
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
    });
  });

program
  .command("dryrun")
  .description("Preview the CLI dashboard with simulated agents")
  .action(async () => {
    await Claude.dryrun();
  });

program.parse(process.argv);
