import { Tool } from "../tool";
import { Result } from "../result";
import { NotificationMessage } from "../notification";
import z from "zod";
import { GitHubBackend } from "src/github";
import { mock } from "./mock";

export const MockAgentUpstreamSchema = z.literal("mock");
export type MockAgentUpstream = z.infer<typeof MockAgentUpstreamSchema>;

export const ClaudeAgentUpstreamSchema = z.literal("claude");
export type ClaudeAgentUpstream = z.infer<typeof ClaudeAgentUpstreamSchema>;

export const AgentUpstreamSchema = z.union([
  MockAgentUpstreamSchema,
  ClaudeAgentUpstreamSchema,
]);
export type AgentUpstream = z.infer<typeof AgentUpstreamSchema>;

export interface AgentStep {
  prompt: string;
  tools: Tool[];
}

export type AgentStepFn<TState = unknown> = (
  step: AgentStep,
  state: TState | undefined,
) => AsyncGenerator<NotificationMessage, TState>;

export async function runAgentStep<TState>(
  agent: AgentStepFn<TState>,
  step: AgentStep,
  isDone: () => Result<string>,
  maxRetries: number,
  onNotification: (notification: NotificationMessage) => void,
  state?: TState,
): Promise<TState> {
  state = await runAgentStepOne(agent, step, onNotification, state);

  for (let i = 0; i < maxRetries; i++) {
    const result = isDone();
    if (result.ok) return state;

    state = await runAgentStepOne(
      agent,
      {
        ...step,
        prompt:
          step.prompt +
          `\n\nThe following error occurred: ${result.error}\n\nPlease try again.`,
      },
      onNotification,
      state,
    );
  }

  const finalResult = isDone();
  if (!finalResult.ok) {
    throw new Error(
      `Agent step failed after ${maxRetries} retries: ${finalResult.error}`,
    );
  }
  return state;
}

async function runAgentStepOne<TState>(
  agent: AgentStepFn<TState>,
  step: AgentStep,
  onNotification: (notification: NotificationMessage) => void,
  state?: TState,
): Promise<TState> {
  const generator = agent(step, state);
  while (true) {
    const { done, value } = await generator.next();
    if (done) {
      return value;
    }
    onNotification(value);
  }
}

export function getAgentStepFn(
  agentUpstream: AgentUpstream,
): [AgentStepFn, GitHubBackend | null] {
  if (agentUpstream === "mock") {
    return mock();
  } else if (agentUpstream === "claude") {
    throw new Error("Not implemented yet");
  } else {
    const _exhaustiveCheck: never = agentUpstream;
    return _exhaustiveCheck;
  }
}
