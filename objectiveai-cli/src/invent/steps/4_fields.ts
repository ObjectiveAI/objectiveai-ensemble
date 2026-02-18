import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";
import { BranchVectorState } from "../../state/branchVectorState";
import { LeafVectorState } from "../../state/leafVectorState";
import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";

export function stepFields<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState | undefined> {
  const inner = state.inner;
  if (!inner) throw new Error("Function type not set");
  if (inner.checkFields().ok) {
    return Promise.resolve(agentState);
  }
  const isVector =
    inner instanceof BranchVectorState || inner instanceof LeafVectorState;

  if (isVector) {
    return runAgentStep(
      agent,
      {
        prompt:
          "Create the InputSchema for your Vector Function. " +
          "Ensure that it adheres to the specifications outlined in your InventSpec and is consistent with the qualities and values described in your essay. " +
          "Read the QualityVectorFunctionInputSchema for guidance on what a valid input schema looks like. " +
          "Next, create an OutputLength Starlark Expression. " +
          "This expression is provided with an `input` matching the InputSchema and should evaluate to the number of items being ranked. " +
          "Next, create an InputSplit Starlark Expression. " +
          "This expression is provided with the same `input` and should evaluate to an array of valid inputs, which, on their own, are valid inputs to the function. " +
          "So, if the input is an array, the InputSplit expression should convert it into an array of 1-length arrays. " +
          "Or, if the input is an object with at least 1 array field, the InputSplit expression should convert it into an array of objects with the field containing rankable items being 1-length arrays. " +
          "Finally, create an InputMerge Starlark Expression. " +
          "This expression is provided with an `input` which is an array of valid inputs. " +
          "This expression should re-combine the provided inputs back into the original input format. " +
          "Use `CheckFields` to validate your schema and expressions prior to finishing.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.setInputSchemaTool() as unknown as Tool,
          inner.setOutputLengthTool() as unknown as Tool,
          inner.setInputMergeTool() as unknown as Tool,
          inner.setInputSplitTool() as unknown as Tool,
          inner.checkFieldsTool() as unknown as Tool,
          inner.getInputSchemaTool(),
          inner.getOutputLengthTool(),
          inner.getInputMergeTool(),
          inner.getInputSplitTool(),
          ...inner.getSchemaTools(),
        ],
      },
      () => inner.checkFields(),
      maxRetries,
      onNotification,
      agentState,
    );
  } else {
    return runAgentStep(
      agent,
      {
        prompt:
          "Create the InputSchema for your Scalar Function. " +
          "Ensure that it adheres to the specifications outlined in your InventSpec and is consistent with the essay you wrote describing your function. " +
          "Read the InputSchemaSchema for guidance on what a valid input schema looks like. " +
          "Use `CheckFields` to validate your schema prior to finishing.",
        tools: [
          state.getInventSpecTool(),
          state.getFunctionTypeTool(),
          state.getNameTool(),
          state.getInventEssayTool(),
          inner.setInputSchemaTool() as unknown as Tool,
          inner.checkFieldsTool() as unknown as Tool,
          inner.getInputSchemaTool(),
          ...inner.getSchemaTools(),
        ],
      },
      () => inner.checkFields(),
      maxRetries,
      onNotification,
      agentState,
    );
  }
}
