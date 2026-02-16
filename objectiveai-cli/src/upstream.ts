import z from "zod";

export const ClaudeAgentUpstreamSchema = z.literal("claude");
export type ClaudeAgentUpstream = z.infer<typeof ClaudeAgentUpstreamSchema>;

export const AgentUpstreamSchema = z.union([ClaudeAgentUpstreamSchema]);
export type AgentUpstream = z.infer<typeof AgentUpstreamSchema>;
