import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { allowedTools } from "../allowedTools";

// Step 1 - Learn about ObjectiveAI and ObjectiveAI Functions
export async function learnSubmodule(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Check if OBJECTIVEAI_INDEX.md exists and is non-empty
  const indexPath = "OBJECTIVEAI_INDEX.md";
  const indexNonEmpty = (() => {
    if (!existsSync(indexPath)) {
      writeFileSync(indexPath, "");
      return false;
    }
    const content = readFileSync(indexPath, "utf-8").trim();
    return content.length > 0;
  })();

  const stream = (() => {
    if (indexNonEmpty) {
      return query({
        prompt:
          "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository." +
          " Learn about ObjectiveAI and ObjectiveAI Functions." +
          " Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are." +
          " First, read OBJECTIVEAI_INDEX.md." +
          " Then, read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to.",
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
          "You are an ObjectiveAI Function Agent, in charge of a single ObjectiveAI Function and associated GitHub repository." +
          " Learn about ObjectiveAI and ObjectiveAI Functions." +
          " Investigate the 'objectiveai' folder to familiarize yourself with what ObjectiveAI Functions are." +
          " Read key files in `objectiveai/objectiveai-rs`, `objectiveai/objectiveai-api`, `objectiveai/objectiveai-js`, and `objectiveai/objectiveai-rs-wasm-js` and any other interesting files they import or link to." +
          " Create OBJECTIVEAI_INDEX.md with links to files and your learnings.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "OBJECTIVEAI_INDEX.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent learns about ObjectiveAI and ObjectiveAI Functions
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  // Ensure that learning produced an index (or pre-existing index is valid)
  let retry = 1;
  while (!existsSync(indexPath) || !readFileSync(indexPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("OBJECTIVEAI_INDEX.md is empty after learn phase");
    } else {
      const stream = query({
        prompt:
          "OBJECTIVEAI_INDEX.md is empty after your learn phase." +
          " Create OBJECTIVEAI_INDEX.md with links to files and your learnings about ObjectiveAI and ObjectiveAI Functions.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "OBJECTIVEAI_INDEX.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries learning about ObjectiveAI and ObjectiveAI Functions
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
