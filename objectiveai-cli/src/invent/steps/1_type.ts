import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../../agent";

export function stepType<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState | undefined> {
  if (state.getFunctionType().ok) {
    return Promise.resolve(agentState);
  }
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
    state.parameters,
    () => state.getFunctionType(),
    maxRetries,
    onNotification,
    agentState,
  );
}
