export * from "./specMcp";
export * from "./nameMcp";
export * from "./essayMcp";
export * from "./essayTasksMcp";

import { AgentOptions, LogFn } from "../../agentOptions";
import { ToolState } from "../../tools/claude/toolState";
import { specMcp } from "./specMcp";
import { nameMcp } from "./nameMcp";
import { essayMcp } from "./essayMcp";
import { essayTasksMcp } from "./essayTasksMcp";

async function runStep(
  state: ToolState,
  log: LogFn,
  sessionId: string | undefined,
  fn: (sessionId?: string) => Promise<string | undefined>,
): Promise<string | undefined> {
  try {
    return await fn(sessionId);
  } catch (e) {
    if (!state.anyStepRan) {
      log("Session may be invalid, retrying without session...");
      return await fn(undefined);
    } else {
      throw e;
    }
  }
}

// Runs init and steps 1-4
export async function prepare(
  state: ToolState,
  options: AgentOptions,
): Promise<string | undefined> {
  const log = options.log;

  // Run preparation steps, passing sessionId between them
  let sessionId = options.sessionId;

  log("=== Step 1: SPEC.md ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    specMcp(state, log, sid, options.spec),
  );

  log("=== Step 2: name.txt ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    nameMcp(state, log, sid, options.name),
  );

  log("=== Step 3: ESSAY.md ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    essayMcp(state, log, sid),
  );

  log("=== Step 4: ESSAY_TASKS.md ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    essayTasksMcp(state, log, sid),
  );

  return sessionId;
}
