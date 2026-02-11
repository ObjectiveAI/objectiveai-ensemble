import { AgentOptions, makeAgentOptions } from "../agentOptions";
import { init } from "../init";
import { prepare } from "./prepare";
import { inventMcp } from "./invent";
import { makeToolState } from "../tools/claude/toolState";
import { getNextPlanIndex } from "./planIndex";

export * from "./prepare";
export * from "./invent";

export async function invent(partialOptions: Partial<AgentOptions> = {}): Promise<void> {
  const options = makeAgentOptions(partialOptions);
  const nextPlanIndex = getNextPlanIndex();
  const toolState = makeToolState({
    apiBase: options.apiBase,
    apiKey: options.apiKey,
    readPlanIndex: nextPlanIndex,
    writePlanIndex: nextPlanIndex,
    gitUserName: options.gitUserName,
    gitUserEmail: options.gitUserEmail,
    ghToken: options.ghToken,
  });

  options.log("=== Initializing workspace ===");
  await init(options);

  options.log("=== Preparing ===");
  const sessionId = await prepare(toolState, options);

  options.log("=== Inventing ===");
  await inventMcp(toolState, { ...options, sessionId });
}
