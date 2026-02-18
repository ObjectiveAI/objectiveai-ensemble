import { BranchVectorState, LeafVectorState } from "../../state";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../../agent";
import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";

export function stepEssay<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState> {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  const isVector =
    inner instanceof BranchVectorState || inner instanceof LeafVectorState;

  const minWidth =
    state.parameters.depth > 0
      ? state.parameters.branchMinWidth
      : state.parameters.leafMinWidth;
  const maxWidth =
    state.parameters.depth > 0
      ? state.parameters.branchMaxWidth
      : state.parameters.leafMaxWidth;
  const tasksStr =
    minWidth === maxWidth
      ? `${minWidth}`
      : `between ${minWidth} and ${maxWidth}`;

  if (isVector) {
    return runAgentStep(
      agent,
      {
        prompt:
          "Write a non-technical essay describing the Vector Function you are building. " +
          "Explore the purpose, inputs, and use-cases of the function in detail. " +
          "Explore the qualities and values that must be evaluated in order to properly rank items relative to one another. " +
          `There should be ${tasksStr} qualities or values. ` +
          "This essay will guide the development of the Vector Function and underpins its philosophy.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.setInventEssayTool() as unknown as Tool,
        ],
      },
      () => state.getInventEssay(),
      maxRetries,
      onNotification,
      agentState,
    );
  } else {
    return runAgentStep(
      agent,
      {
        prompt:
          "Write a non-technical essay describing the Scalar Function you are building. " +
          "Explore the purpose, input, and use-cases of the function in detail. " +
          "Explore the qualities and values that must be evaluated for the input. " +
          `There should be ${tasksStr} qualities or values. ` +
          "This essay will guide the development of the Scalar Function and underpins its philosophy.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.setInventEssayTool() as unknown as Tool,
        ],
      },
      () => state.getInventEssay(),
      maxRetries,
      onNotification,
      agentState,
    );
  }
}
