import { AgentOptions } from "../../agentOptions";
import { createFileLogger } from "../../logging";
import { init } from "../../init";
import { learnSubmodule } from "./learnSubmodule";
import { learnExamples } from "./learnExamples";
import { spec } from "./spec";
import { createFunctionTypeJson } from "./functionType";
import { createGitHubNameJson } from "./githubName";
import { essay } from "./essay";
import { essayTasks } from "./essayTasks";
import { handleOpenIssues } from "./handleOpenIssues";

// Runs init and steps 1-8
export async function prepare(
  options: AgentOptions = {},
): Promise<string | undefined> {
  const log = options.log ?? createFileLogger().log;

  // Initialize the workspace
  log("=== Initializing workspace ===");
  await init({ spec: options.spec, apiBase: options.apiBase });

  // Run preparation steps, passing sessionId between them
  let sessionId = options.sessionId;

  log("=== Step 1: Learning about ObjectiveAI ===");
  sessionId = await learnSubmodule(log, sessionId);

  log("=== Step 2: Learning from examples ===");
  sessionId = await learnExamples(log, sessionId);

  log("=== Step 3: Reading/Creating SPEC.md ===");
  sessionId = await spec(log, sessionId);

  log("=== Step 4: Creating function/type.json ===");
  sessionId = await createFunctionTypeJson(log, sessionId);

  log("=== Step 5: Creating github/name.json ===");
  sessionId = await createGitHubNameJson(log, sessionId);

  log("=== Step 6: Reading/Creating ESSAY.md ===");
  sessionId = await essay(log, sessionId);

  log("=== Step 7: Reading/Creating ESSAY_TASKS.md ===");
  sessionId = await essayTasks(log, sessionId);

  log("=== Step 8: Handling open issues ===");
  sessionId = await handleOpenIssues(log, sessionId);

  return sessionId;
}
