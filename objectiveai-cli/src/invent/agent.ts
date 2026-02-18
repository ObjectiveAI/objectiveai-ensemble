import { Tool } from "../tool";
import { Result } from "../result";
import { AgentUpstream } from "src/upstream";

export interface AgentStep {
  prompt: string;
  tools: Tool[];
}

export type AgentStepFn<TState = unknown> = (
  step: AgentStep,
  state: TState | undefined,
) => Promise<TState>;

export async function runAgentStep<TState>(
  agent: AgentStepFn<TState>,
  step: AgentStep,
  isDone: () => Result<string>,
  maxRetries: number,
  state?: TState,
): Promise<TState> {
  state = await agent(step, state);

  for (let i = 0; i < maxRetries; i++) {
    const result = isDone();
    if (result.ok) return state;

    state = await agent(
      {
        ...step,
        prompt:
          step.prompt +
          `\n\nThe following error occurred: ${result.error}\n\nPlease try again.`,
      },
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

export function getAgentStepFn(agentUpstream: AgentUpstream): AgentStepFn {
  throw new Error("Not implemented yet");
}
