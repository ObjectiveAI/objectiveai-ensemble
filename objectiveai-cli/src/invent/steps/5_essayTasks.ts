import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";

export function stepEssayTasks<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState> {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");

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

  return runAgentStep(
    agent,
    {
      prompt:
        "Write EssayTasks listing and describing the key tasks the Function must perform in order to fulfill the quality and value evaluations defined within the essay. " +
        " Each task is a non-technical plain language description of a task which will go into the function's `tasks` array." +
        ` There should be ${tasksStr} tasks.`,
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.getNameTool(),
        state.getInventEssayTool(),
        inner.getInputSchemaTool(),
        state.setInventEssayTasksTool() as unknown as Tool,
      ],
    },
    () => state.getInventEssayTasks(),
    maxRetries,
    onNotification,
    agentState,
  );
}
