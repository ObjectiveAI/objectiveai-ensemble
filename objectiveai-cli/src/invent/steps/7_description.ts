import { BranchScalarState, BranchVectorState } from "../../state";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../../agent";
import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";

export function stepDescription<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState> {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");

  return runAgentStep(
    agent,
    {
      prompt:
        "First, create a 1-paragraph description of the Function you've invented. " +
        "Then, create a comprehensive README for the Function, describing its input, output, use-cases, and what all it evaluates.",
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.getNameTool(),
        state.getInventEssayTool(),
        inner.getInputSchemaTool(),
        state.getInventEssayTasksTool(),
        inner.getTasksLengthTool(),
        inner.getTaskTool() as unknown as Tool,
        ...(inner instanceof BranchVectorState ||
        inner instanceof BranchScalarState
          ? [inner.getTaskSpecTool() as unknown as Tool]
          : []),
        state.setDescriptionTool() as unknown as Tool,
        state.setReadmeTool() as unknown as Tool,
      ],
    },
    () => {
      const desc = state.getDescription();
      if (!desc.ok) return desc;
      return state.getReadme();
    },
    maxRetries,
    onNotification,
    agentState,
  );
}
