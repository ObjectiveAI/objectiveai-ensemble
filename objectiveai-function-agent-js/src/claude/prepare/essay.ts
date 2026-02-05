import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { promptResources } from "../promptResources";
import { allowedTools } from "../allowedTools";

// Step 6 - Read or Create ESSAY.md
export async function essay(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Check if ESSAY.md exists and is non-empty
  const essayPath = "ESSAY.md";
  const essayNonEmpty = (() => {
    if (!existsSync(essayPath)) {
      writeFileSync(essayPath, "");
      return false;
    }
    const content = readFileSync(essayPath, "utf-8").trim();
    return content.length > 0;
  })();

  const stream = (() => {
    if (essayNonEmpty) {
      return query({
        prompt: "Read ESSAY.md to understand the ObjectiveAI Function essay.",
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
          ]) +
          "Create ESSAY.md describing the ObjectiveAI Function you are building." +
          " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
          " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
          " This essay will guide the development of the function and underpins its philosophy.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });
    }
  })();

  // Agent reads or creates ESSAY.md
  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  // Ensure that ESSAY.md is non-empty
  let retry = 1;
  while (!existsSync(essayPath) || !readFileSync(essayPath, "utf-8").trim()) {
    if (retry > 3) {
      throw new Error("ESSAY.md is empty after essay phase");
    } else {
      const stream = query({
        prompt:
          "ESSAY.md is empty after your essay phase." +
          " Create ESSAY.md describing the ObjectiveAI Function you are building." +
          " Explore the purpose, inputs, outputs, and use-cases of the function in detail." +
          " Explore, in great detail, the various qualities, values, and sentiments that must be evaluated by the function." +
          " This essay will guide the development of the function and underpins its philosophy.",
        options: {
          allowedTools: allowedTools([
            { kind: "write-edit", value: "ESSAY.md" },
          ]),
          disallowedTools: ["AskUserQuestion"],
          permissionMode: "dontAsk",
          resume: sessionId,
        },
      });

      // Agent retries ESSAY.md creation
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
