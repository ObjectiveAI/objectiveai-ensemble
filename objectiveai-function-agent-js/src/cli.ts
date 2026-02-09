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

function parseArgs(): {
  command?: string;
  spec?: string;
  name?: string;
  depth?: number;
  apiBase?: string;
  apiKey?: string;
  instructions?: string;
} {
  const args = process.argv.slice(2);
  let command: string | undefined;
  let spec: string | undefined;
  let name: string | undefined;
  let depth: number | undefined;
  let apiBase: string | undefined;
  let apiKey: string | undefined;
  let instructions: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--depth=")) {
      depth = parseInt(arg.slice(8), 10);
    } else if (arg === "--depth") {
      depth = parseInt(args[++i], 10);
    } else if (arg.startsWith("--name=")) {
      name = arg.slice(7);
    } else if (arg === "--name") {
      name = args[++i];
    } else if (arg.startsWith("--api-base=")) {
      apiBase = arg.slice(11);
    } else if (arg === "--api-base") {
      apiBase = args[++i];
    } else if (arg.startsWith("--api-key=")) {
      apiKey = arg.slice(10);
    } else if (arg === "--api-key") {
      apiKey = args[++i];
    } else if (arg.startsWith("--instructions=")) {
      instructions = arg.slice(15);
    } else if (arg === "--instructions") {
      instructions = args[++i];
    } else if (!command) {
      command = arg;
    } else if (!spec) {
      spec = arg;
    }
  }

  return { command, spec, name, depth, apiBase, apiKey, instructions };
}

async function main(): Promise<void> {
  const { command, spec, name, depth, apiBase, apiKey, instructions } = parseArgs();

  switch (command) {
    case "invent":
      await Claude.invent({ spec, name, depth, apiBase, apiKey, instructions });
      break;
    default:
      console.log("Usage: objectiveai-function-agent invent [spec] [options]");
      console.log("");
      console.log("Options:");
      console.log("  [spec]              Optional spec string for SPEC.md");
      console.log("  --name NAME         Function name for name.txt");
      console.log("  --depth N           Depth level (0=vector, >0=function tasks)");
      console.log("  --api-base URL      API base URL");
      console.log("  --api-key KEY       ObjectiveAI API key");
      console.log("  --instructions TEXT  Extra instructions for the invent agent");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
