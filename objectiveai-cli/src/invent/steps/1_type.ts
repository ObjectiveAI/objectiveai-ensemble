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
    {
      prompt:
        "You are an inventor creating a new ObjectiveAI Function. " +
        'ObjectiveAI Functions are for ranking multiple input items ("vector.function"), or for scoring a single input item ("scalar.function"). ' +
        "Select the appropriate type based on InventSpec and what the expected input is.",
      tools: [state.getInventSpecTool(), state.setFunctionTypeTool()],
    },
    () => state.getFunctionType(),
    maxRetries,
  );
}
