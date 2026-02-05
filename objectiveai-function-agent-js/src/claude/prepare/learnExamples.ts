import { query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";

// Step 2 - Learn from examples
export async function learnExamples(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Query
  const stream = query({
    prompt:
      "1. Read `examples/examples.json` to see the root function-profile pairs\n" +
      "2. For each pair, open and study:\n" +
      "- `examples/functions/{owner}/{repository}/{commit}/function.json`\n" +
      "- `examples/profiles/{owner}/{repository}/{commit}/profile.json`\n" +
      "3. If any function contains sub-tasks, open those sub-function files\n" +
      "4. If any profile contains sub-profiles, open those sub-profile files",
    options: {
      allowedTools: [
        "Bash(ls*)",
        "Bash(cd)",
        "Bash(cat)",
        "Bash(diff)",
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

  // Agent learns from examples
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  // Return session ID for resuming
  return sessionId;
}
