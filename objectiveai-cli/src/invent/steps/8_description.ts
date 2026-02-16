import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepDescription(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  if (state.getDescription().ok && state.getReadme().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => {
      const desc = state.getDescription();
      if (!desc.ok) return desc;
      return state.getReadme();
    },
    maxRetries,
  );
}
