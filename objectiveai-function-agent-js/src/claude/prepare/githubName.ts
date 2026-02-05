import { query } from "@anthropic-ai/claude-agent-sdk";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { LogFn } from "../../agentOptions";
import { promptResources } from "../promptResources";
import { allowedTools } from "../allowedTools";

// Step 5 - Create github/name.json (if needed)
export async function createGitHubNameJson(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  // Check if github/name.json exists and is non-empty
  const githubNamePath = "github/name.json";
  const githubNameNonEmpty = () => {
    if (!existsSync(githubNamePath)) {
      writeFileSync(githubNamePath, "");
      return false;
    }
    let content = readFileSync(githubNamePath, "utf-8").trim();
    if (!content || content === "null") {
      return false;
    }
    // Remove surrounding quotes if both present
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1);
    }
    return content.length > 0;
  };

  if (!githubNameNonEmpty()) {
    const stream = query({
      prompt:
        promptResources([
          "OBJECTIVEAI_INDEX.md",
          "SPEC.md",
          "function/type.json",
        ]) +
        "Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n" +
        '**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n' +
        "- Use all lowercase\n" +
        "- Use dashes (`-`) to separate words if there's more than one",
      options: {
        allowedTools: allowedTools([
          { kind: "write-edit", value: "github/name.json" },
        ]),
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Agent creates github/name.json
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
  }

  let retry = 1;
  while (!githubNameNonEmpty()) {
    if (retry > 10) {
      throw new Error(
        "github/name.json is empty after createGitHubNameJson phase",
      );
    }
    const stream = query({
      prompt:
        "github/name.json is empty after your createGitHubNameJson phase." +
        " Create github/name.json specifying the GitHub repository name for the ObjectiveAI Function.\n" +
        '**Do NOT include "objectiveai" or "function" or "scalar" or "vector" in the name.** Name it like you would name a function:\n' +
        "- Use all lowercase\n" +
        "- Use dashes (`-`) to separate words if there's more than one",
      options: {
        allowedTools: allowedTools([
          { kind: "write-edit", value: "github/name.json" },
        ]),
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    });

    // Agent retries github/name.json creation
    for await (const message of stream) {
      if (message.type === "system" && message.subtype === "init") {
        sessionId = message.session_id;
      }
      log(message);
    }
    retry += 1;
  }

  // Return session ID for resuming
  return sessionId;
}
