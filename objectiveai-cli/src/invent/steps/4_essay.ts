import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepEssay(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  if (state.getInventEssay().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => state.getInventEssay(),
    maxRetries,
  );
}
