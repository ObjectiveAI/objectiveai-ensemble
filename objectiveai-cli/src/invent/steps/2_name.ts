import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../../agent";

export function stepName<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState> {
  return runAgentStep(
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
        state.setNameTool() as unknown as Tool,
      ],
    },
    () => state.getName(),
    maxRetries,
    onNotification,
    agentState,
  );
}
