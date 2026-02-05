import { Claude } from "./index";

function parseArgs(): { command?: string; spec?: string; depth?: number } {
  const args = process.argv.slice(2);
  let command: string | undefined;
  let spec: string | undefined;
  let depth: number | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--depth=")) {
      depth = parseInt(arg.slice(8), 10);
    } else if (arg === "--depth") {
      depth = parseInt(args[++i], 10);
    } else if (!command) {
      command = arg;
    } else if (!spec) {
      spec = arg;
    }
  }

  return { command, spec, depth };
}

async function main(): Promise<void> {
  const { command, spec, depth } = parseArgs();

  switch (command) {
    case "invent":
      await Claude.invent({ spec, depth });
      break;
    case "handle-issues":
      await Claude.handleIssues({ spec });
      break;
    default:
      console.log("Usage: objectiveai-function-agent <command> [spec] [--depth N]");
      console.log("");
      console.log("Commands:");
      console.log("  invent         Create a new ObjectiveAI Function");
      console.log("  handle-issues  Handle GitHub issues on an existing function");
      console.log("");
      console.log("Options:");
      console.log("  [spec]         Optional spec string for SPEC.md");
      console.log("  --depth N      Depth level (0=vector, >0=function tasks)");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
