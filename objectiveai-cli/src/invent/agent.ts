import { Tool } from "../tool";
import { Result } from "../result";

export interface AgentStep {
  prompt: string;
  tools: Tool[];
}

export type AgentStepFn = (step: AgentStep) => Promise<void>;

export async function runAgentStep(
  agent: AgentStepFn,
  step: AgentStep,
  isDone: () => Result<string>,
  maxRetries: number,
): Promise<void> {
  await agent(step);

  for (let i = 0; i < maxRetries; i++) {
    const result = isDone();
    if (result.ok) return;

    await agent({
      ...step,
      prompt:
        step.prompt +
        `\n\nThe following error occurred: ${result.error}\n\nPlease try again.`,
    });
  }

  const finalResult = isDone();
  if (!finalResult.ok) {
    throw new Error(
      `Agent step failed after ${maxRetries} retries: ${finalResult.error}`,
    );
  }
}
