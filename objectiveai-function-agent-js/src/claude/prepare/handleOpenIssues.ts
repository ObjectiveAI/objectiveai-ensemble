import { query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";
import { promptResources } from "../promptResources";

// Step 8 - Handle open issues (optional)
export async function handleOpenIssues(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Check if there are open issues
  const { hasOpenIssues } = await import("../../github");
  if (!hasOpenIssues()) {
    return sessionId;
  }

  // Query - have the assistant fetch and handle open issues
  const stream = query({
    prompt:
      promptResources([
        "OBJECTIVEAI_INDEX.md",
        "SPEC.md",
        "function/type.json",
        "github/name.json",
        "ESSAY.md",
        "ESSAY_TASKS.md",
        "ts-node fetchOpenIssues.ts",
      ]) +
      "There are open issues on this repository that need your attention.\n" +
      "1. Run `ts-node fetchOpenIssues.ts` to see all open issues with their comments.\n" +
      "2. Review each issue.",
    options: {
      allowedTools: [
        "Bash(ls*)",
        "Bash(cd)",
        "Bash(cat)",
        "Bash(diff)",
        "Bash(ts-node fetchOpenIssues.ts)",
        "Bash(npx ts-node fetchOpenIssues.ts)",
        "Glob",
        "Grep",
        "Read",
        "WebFetch",
        "WebSearch",
      ],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId,
    },
  });

  // Agent handles open issues
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  // Return session ID for resuming
  return sessionId;
}
