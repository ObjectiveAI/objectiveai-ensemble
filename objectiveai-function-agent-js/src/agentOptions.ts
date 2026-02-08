export type LogFn = (...args: unknown[]) => void;

export interface AgentOptions {
  name?: string;
  spec?: string;
  apiBase?: string;
  apiKey?: string;
  sessionId?: string;
  log?: LogFn;
  depth?: number;
}
