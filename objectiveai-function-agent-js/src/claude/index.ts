import { AgentOptions } from "../agentOptions";
import { createFileLogger } from "../logging";
import { init } from "../init";
import { prepare } from "./prepare";
import { inventMcp } from "./invent";

export * from "./prepare";
export * from "./invent";

export async function invent(options: AgentOptions = {}): Promise<void> {
  const log = options.log ?? createFileLogger().log;
  options = { ...options, log };

  log("=== Initializing workspace ===");
  await init(options);

  log("=== Preparing ===");
  const sessionId = await prepare(options);

  log("=== Inventing ===");
  await inventMcp({ ...options, sessionId });
}
