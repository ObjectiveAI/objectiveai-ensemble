import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepPlan(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  if (state.getInventPlan().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => state.getInventPlan(),
    maxRetries,
  );
}
