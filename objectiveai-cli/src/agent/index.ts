import { Tool } from "../tool";
import { Result } from "../result";
import { NotificationMessage } from "../notification";
import { Parameters } from "../parameters";
import z from "zod";
import { GitHubBackend } from "../github";
import { mock } from "./mock";
import { claude } from "./claude";

export const MockAgentUpstreamSchema = z.literal("mock");
export type MockAgentUpstream = z.infer<typeof MockAgentUpstreamSchema>;

export const ClaudeAgentUpstreamSchema = z.literal("claude");
export type ClaudeAgentUpstream = z.infer<typeof ClaudeAgentUpstreamSchema>;

export const AgentUpstreamSchema = z.union([
  MockAgentUpstreamSchema,
  ClaudeAgentUpstreamSchema,
]);
export type AgentUpstream = z.infer<typeof AgentUpstreamSchema>;

export const StepNameSchema = z.union([
  z.literal("type"),
  z.literal("name"),
  z.literal("essay"),
  z.literal("fields"),
  z.literal("essay_tasks"),
  z.literal("body"),
  z.literal("description"),
]);
export type StepName = z.infer<typeof StepNameSchema>;

export interface AgentStep {
  stepName: StepName;
  prompt: string;
  tools: Tool[];
}

export type AgentStepFn<TState = unknown> = (
  step: AgentStep,
  state: TState | undefined,
  parameters: Parameters,
) => AsyncGenerator<NotificationMessage, TState>;

export async function runAgentStep<TState>(
  agent: AgentStepFn<TState>,
  step: AgentStep,
  parameters: Parameters,
  isDone: () => Result<string>,
  maxRetries: number,
  onNotification: (notification: NotificationMessage) => void,
  state?: TState,
): Promise<TState> {
  state = await runAgentStepOne(agent, step, parameters, onNotification, state);

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
      parameters,
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
  parameters: Parameters,
  onNotification: (notification: NotificationMessage) => void,
  state?: TState,
): Promise<TState> {
  const generator = agent(step, state, parameters);
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
    return claude() as [AgentStepFn, null];
  } else {
    const _exhaustiveCheck: never = agentUpstream;
    return _exhaustiveCheck;
  }
}
