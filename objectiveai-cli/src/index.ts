export * as Claude from "./claude";
export * as Tools from "./tools";
export * from "./agentOptions";
export * from "./exampleInput";
export * from "./init";
export * from "./logging";
export * from "./spawnFunctionAgentsParams";

import type { AgentOptions } from "./agentOptions";
import { resolveAgentUpstream } from "./agentOptions";
import * as ClaudeModule from "./claude";
import { dryrun } from "./claude/dryrun";

export async function invent(
  partialOptions: Partial<AgentOptions> = {},
): Promise<void> {
  const { agentUpstream } = partialOptions as any;
  const resolvedUpstream = resolveAgentUpstream(agentUpstream).value;

  if (resolvedUpstream === "claude") {
    return ClaudeModule.invent(partialOptions);
  }
  throw new Error(`Unknown agent upstream: ${resolvedUpstream}`);
}

export async function amend(
  partialOptions: Partial<AgentOptions> = {},
): Promise<void> {
  const { agentUpstream } = partialOptions as any;
  const resolvedUpstream = resolveAgentUpstream(agentUpstream).value;

  if (resolvedUpstream === "claude") {
    return ClaudeModule.amend(partialOptions);
  }
  throw new Error(`Unknown agent upstream: ${resolvedUpstream}`);
}

export { dryrun };
