import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { allowedTools } from "../allowedTools";

// Step 3 - Read or Create SPEC.md
export async function spec(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Check if SPEC.md exists and is non-empty
  const specPath = "SPEC.md";
  const specNonEmpty = (() => {
    if (!existsSync(specPath)) {
      writeFileSync(specPath, "");
      return false;
    }
    const content = readFileSync(specPath, "utf-8").trim();
    return content.length > 0;
  })();

  const stream = (() => {
    if (specNonEmpty) {
      return query({
        prompt:
          "Read SPEC.md to understand the ObjectiveAI Function specification.",
        options: {
          allowedTools: allowedTools([]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    } else {
      return query({
        prompt:
          "Create SPEC.md specifying the ObjectiveAI Function to be built." +
          " Think deeply about what function to invent:\n" +
          "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
          "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
          "Be creative and describe a function with plain language.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "SPEC.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent reads or creates SPEC.md
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  // Ensure that SPEC.md is non-empty
  let retry = 1;
  while (!existsSync(specPath) || !readFileSync(specPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("SPEC.md is empty after spec phase");
    } else {
      const stream = query({
        prompt:
          "SPEC.md is empty after your spec phase." +
          " Create SPEC.md specifying the ObjectiveAI Function to be built." +
          " Think deeply about what function to invent:\n" +
          "- **Scalar Function**: For scoring (outputs a single number in [0, 1])\n" +
          "- **Vector Function**: For ranking (outputs scores for multiple items that sum to ~1)\n\n" +
          "Be creative and describe a function with plain language.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "SPEC.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries SPEC.md creation
      for await (const message of stream) {
        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }
        log(message);
      }
      retry += 1;
    }
  }

  // Return session ID for resuming
  return sessionId;
}
