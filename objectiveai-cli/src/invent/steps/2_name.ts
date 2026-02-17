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
    {
      prompt:
        "Select a name for your ObjectiveAI Function. " +
        'Do not include "ObjectiveAI" or "Function" in the name. ' +
        "Name it how you would name a function in code. " +
        "Use all lowercase and separate words with dashes.",
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.setNameTool(),
      ],
    },
    () => state.getName(),
    maxRetries,
  );
}
