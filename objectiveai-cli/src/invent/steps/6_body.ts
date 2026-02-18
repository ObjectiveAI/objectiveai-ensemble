import {
  BranchScalarState,
  BranchVectorState,
  LeafScalarState,
  LeafVectorState,
} from "src/state";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";
import { Tool } from "src/tool";

export function stepBody<TState>(
  state: State,
  agent: AgentStepFn<TState>,
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

  if (inner instanceof BranchVectorState) {
    return runAgentStep(
      agent,
      {
        prompt: "",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          inner.getOutputLengthTool(),
          inner.getInputSplitTool(),
          inner.getInputMergeTool(),
          state.getInventEssayTasksTool(),
          inner.appendVectorTaskTool() as unknown as Tool,
          inner.appendScalarTaskTool() as unknown as Tool,
          inner.deleteTaskTool() as unknown as Tool,
          inner.editVectorTaskTool() as unknown as Tool,
          inner.editScalarTaskTool() as unknown as Tool,
          inner.editTaskSpecTool() as unknown as Tool,
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool() as unknown as Tool,
          inner.getTaskSpecTool() as unknown as Tool,
          ...inner.getSchemaTools(),
        ],
      },
      () => inner.checkFunction(),
      maxRetries,
      agentState,
    );
  } else if (inner instanceof BranchScalarState) {
    return runAgentStep(
      agent,
      {
        prompt: "",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          state.getInventEssayTasksTool(),
          inner.appendTaskTool() as unknown as Tool,
          inner.deleteTaskTool() as unknown as Tool,
          inner.editTaskTool() as unknown as Tool,
          inner.editTaskSpecTool() as unknown as Tool,
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool() as unknown as Tool,
          inner.getTaskSpecTool() as unknown as Tool,
          ...inner.getSchemaTools(),
        ],
      },
      () => inner.checkFunction(),
      maxRetries,
      agentState,
    );
  } else if (inner instanceof LeafVectorState) {
    return runAgentStep(
      agent,
      {
        prompt: "",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          inner.getOutputLengthTool(),
          inner.getInputSplitTool(),
          inner.getInputMergeTool(),
          state.getInventEssayTasksTool(),
          inner.appendTaskTool() as unknown as Tool,
          inner.deleteTaskTool() as unknown as Tool,
          inner.editTaskTool() as unknown as Tool,
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool() as unknown as Tool,
          ...inner.getSchemaTools(),
        ],
      },
      () => inner.checkFunction(),
      maxRetries,
      agentState,
    );
  } else if (inner instanceof LeafScalarState) {
    return runAgentStep(
      agent,
      {
        prompt: "",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.getInputSchemaTool(),
          state.getInventEssayTasksTool(),
          inner.appendTaskTool() as unknown as Tool,
          inner.deleteTaskTool() as unknown as Tool,
          inner.editTaskTool() as unknown as Tool,
          inner.checkFunctionTool(),
          inner.getTasksLengthTool(),
          inner.getTaskTool() as unknown as Tool,
          ...inner.getSchemaTools(),
        ],
      },
      () => inner.checkFunction(),
      maxRetries,
      agentState,
    );
  } else {
    throw new Error("Unknown function type");
  }
}
