export * from "./specMcp";
export * from "./nameMcp";
export * from "./typeMcp";
export * from "./inputSchemaMcp";
export * from "./essayMcp";
export * from "./essayTasksMcp";

import { AgentOptions, LogFn } from "../../agentOptions";
import { ToolState } from "../../tools/claude/toolState";
import { specMcp } from "./specMcp";
import { nameMcp } from "./nameMcp";
import { typeMcp } from "./typeMcp";
import { inputSchemaMcp } from "./inputSchemaMcp";
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

// Runs init and steps 1-6
export async function prepare(
  state: ToolState,
  options: AgentOptions,
): Promise<string | undefined> {
  const log = options.log;

  // Run preparation steps, passing sessionId between them
  let sessionId = options.sessionId;

  log("=== Step 1: SPEC.md ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    specMcp(state, log, sid, options.spec, options.claudeSpecModel),
  );

  log("=== Step 2: name.txt ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    nameMcp(state, log, sid, options.name, options.claudeNameModel),
  );

  log("=== Step 3: type ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    typeMcp(state, log, sid, options.type, options.claudeTypeModel),
  );

  log("=== Step 4: input_schema ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    inputSchemaMcp(state, log, sid, options.inputSchema, options.claudeInputSchemaModel),
  );

  log("=== Step 5: ESSAY.md ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    essayMcp(state, log, sid, options.claudeEssayModel),
  );

  log("=== Step 6: ESSAY_TASKS.md ===");
  sessionId = await runStep(state, log, sessionId, (sid) =>
    essayTasksMcp(state, log, sid, options.claudeEssayTasksModel),
  );

  return sessionId;
}
