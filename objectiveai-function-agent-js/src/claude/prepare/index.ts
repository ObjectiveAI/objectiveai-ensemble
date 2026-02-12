export * from "./specMcp";
export * from "./nameMcp";
export * from "./essayMcp";
export * from "./essayTasksMcp";

import { AgentOptions } from "../../agentOptions";
import { ToolState } from "../../tools/claude/toolState";
import { specMcp } from "./specMcp";
import { nameMcp } from "./nameMcp";
import { essayMcp } from "./essayMcp";
import { essayTasksMcp } from "./essayTasksMcp";

// Runs init and steps 1-4
export async function prepare(
  state: ToolState,
  options: AgentOptions,
): Promise<string | undefined> {
  const log = options.log;

  // Run preparation steps, passing sessionId between them
  let sessionId = options.sessionId;

  log("=== Step 1: SPEC.md ===");
  sessionId = await specMcp(state, log, sessionId, options.spec);

  log("=== Step 2: name.txt ===");
  sessionId = await nameMcp(state, log, sessionId, options.name);

  log("=== Step 3: ESSAY.md ===");
  sessionId = await essayMcp(state, log, sessionId);

  log("=== Step 4: ESSAY_TASKS.md ===");
  sessionId = await essayTasksMcp(state, log, sessionId);

  return sessionId;
}
