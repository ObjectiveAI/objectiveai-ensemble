import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepType(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  if (state.getFunctionType().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => state.getFunctionType(),
    maxRetries,
  );
}
