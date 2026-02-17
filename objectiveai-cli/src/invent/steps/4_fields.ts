import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";
import { BranchVectorState } from "../../state/branchVectorState";
import { LeafVectorState } from "../../state/leafVectorState";

export async function stepFields(
  state: State,
  agent: AgentStepFn,
  maxRetries = 5,
): Promise<void> {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");

  const isVector =
    inner instanceof BranchVectorState || inner instanceof LeafVectorState;

  if (isVector) {
    if (inner.checkFields().ok) return;

    await runAgentStep(
      agent,
      { prompt: "", tools: [] },
      () => inner.checkFields(),
      maxRetries,
    );
  } else {
    if (inner.checkFields().ok) return;

    await runAgentStep(
      agent,
      { prompt: "", tools: [] },
      () => inner.checkFields(),
      maxRetries,
    );
  }
}
