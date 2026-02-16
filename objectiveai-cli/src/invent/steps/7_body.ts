import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export async function stepBody(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  if (inner.checkFunction().ok) return;

  await runAgentStep(
    agent,
    { prompt: "", tools: [] },
    () => inner.checkFunction(),
    maxRetries,
  );
}
