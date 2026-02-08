export type LogFn = (...args: unknown[]) => void;

export interface AgentOptions {
  name?: string;
  spec?: string;
  apiBase?: string;
  sessionId?: string;
  log?: LogFn;
  depth?: number;
}
