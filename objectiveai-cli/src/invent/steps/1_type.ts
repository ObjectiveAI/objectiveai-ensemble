import { Tool } from "src/tool";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export function stepType<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState> {
  return runAgentStep(
    agent,
    {
      prompt:
        "You are an inventor creating a new ObjectiveAI Function. " +
        'ObjectiveAI Functions are for ranking multiple input items ("vector.function"), or for scoring a single input item ("scalar.function"). ' +
        "Select the appropriate type based on InventSpec and what the expected input is.",
      tools: [
        state.getInventSpecTool(),
        state.setFunctionTypeTool() as unknown as Tool,
      ],
    },
    () => state.getFunctionType(),
    maxRetries,
    agentState,
  );
}
