export type LogFn = (...args: unknown[]) => void;

export interface AgentOptions {
  spec?: string;
  apiBase?: string;
  sessionId?: string;
  log?: LogFn;
}
