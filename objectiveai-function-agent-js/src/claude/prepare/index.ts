export * from "./specMcp";
export * from "./nameMcp";
export * from "./essayMcp";
export * from "./essayTasksMcp";
export * from "./planMcp";

import { AgentOptions } from "../../agentOptions";
import { createFileLogger } from "../../logging";
import { specMcp } from "./specMcp";
import { nameMcp } from "./nameMcp";
import { essayMcp } from "./essayMcp";
import { essayTasksMcp } from "./essayTasksMcp";
import { planMcp } from "./planMcp";

// Runs init and steps 1-5
export async function prepare(
  options: AgentOptions = {},
): Promise<string | undefined> {
  const log = options.log ?? createFileLogger().log;

  // Run preparation steps, passing sessionId between them
  let sessionId = options.sessionId;

  log("=== Step 1: SPEC.md ===");
  sessionId = await specMcp(log, sessionId, options.spec);

  log("=== Step 2: name.txt ===");
  sessionId = await nameMcp(log, sessionId, options.name);

  log("=== Step 3: ESSAY.md ===");
  sessionId = await essayMcp(log, sessionId);

  log("=== Step 4: ESSAY_TASKS.md ===");
  sessionId = await essayTasksMcp(log, sessionId);

  log("=== Step 5: Plan ===");
  sessionId = await planMcp(log, sessionId);

  return sessionId;
}
