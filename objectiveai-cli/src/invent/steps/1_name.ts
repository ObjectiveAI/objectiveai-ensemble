import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepName(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  if (state.getName().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => state.getName(),
    maxRetries,
  );
}
