import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { promptResources } from "../promptResources";
import { allowedTools } from "../allowedTools";

// Step 7 - Read or Create ESSAY_TASKS.md
export async function essayTasks(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Check if ESSAY_TASKS.md exists and is non-empty
  const essayTasksPath = "ESSAY_TASKS.md";
  const essayTasksNonEmpty = (() => {
    if (!existsSync(essayTasksPath)) {
      writeFileSync(essayTasksPath, "");
      return false;
    }
    const content = readFileSync(essayTasksPath, "utf-8").trim();
    return content.length > 0;
  })();

  const stream = (() => {
    if (essayTasksNonEmpty) {
      return query({
        prompt: "Read ESSAY_TASKS.md to understand the Function's tasks.",
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
          promptResources([
            "OBJECTIVEAI_INDEX.md",
            "SPEC.md",
            "function/type.json",
            "github/name.json",
            "ESSAY.md",
          ]) +
          "Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
          " Each task is a plain language description of a task which will go into the function's `tasks` array.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY_TASKS.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent reads or creates ESSAY_TASKS.md
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  // Ensure that ESSAY_TASKS.md is non-empty
  let retry = 1;
  while (
    !existsSync(essayTasksPath) ||
    !readFileSync(essayTasksPath, "utf-8").trim()
  ) {
    if (retry > 3) {
      throw new Error("ESSAY_TASKS.md is empty after essayTasks phase");
    } else {
      const stream = query({
        prompt:
          "ESSAY_TASKS.md is empty after your essayTasks phase." +
          " Create ESSAY_TASKS.md listing and describing the key tasks the ObjectiveAI Function must perform in order to fulfill the quality, value, and sentiment evaluations defined within ESSAY.md." +
          " Each task is a plain language description of a task which will go into the function's `tasks` array.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY_TASKS.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries ESSAY_TASKS.md creation
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
