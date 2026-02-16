import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepEssayTasks(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  if (state.getInventEssayTasks().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => state.getInventEssayTasks(),
    maxRetries,
  );
}
