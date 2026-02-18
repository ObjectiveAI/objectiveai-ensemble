import {
  BranchScalarState,
  BranchVectorState,
  LeafScalarState,
  LeafVectorState,
} from "../../state";
import { State } from "../../state/state";
import { AgentStepFn, runAgentStep } from "../agent";
import { Tool } from "../../tool";
import { NotificationMessage } from "../../notification";

export function stepBody<TState>(
  state: State,
  agent: AgentStepFn<TState>,
  onNotification: (notification: NotificationMessage) => void,
  agentState?: TState,
  maxRetries = 5,
): Promise<TState | undefined> {
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
        prompt:
          "Create the Tasks for your Vector Function.\n\n" +
          "## Task Structure\n\n" +
          `Create ${tasksStr} placeholder tasks based on your EssayTasks. ` +
          "Each task defines a sub-function which will be automatically invented after you finish. " +
          "Some tasks may have the same `input_schema` as the parent, and some may contain only a subset so as to evaluate a specific aspect of the input.\n" +
          "You can mix two types of placeholder tasks:\n" +
          "- **Unmapped vector tasks** (`placeholder.vector.function`): " +
          "Ranks the input items provided to the task relative to each other. " +
          "Use `AppendVectorTask` to create these.\n" +
          "- **Mapped scalar tasks** (`placeholder.scalar.function` with `map`): " +
          "Iterate over input items via `input_maps` and score each one individually. " +
          "Use `AppendScalarTask` to create these.\n\n" +
          "**Constraints:**\n" +
          "- At most 50% of tasks can be mapped scalar tasks\n\n" +
          "**TaskSpec:**\n" +
          "- First, write a detailed `spec` for the task, describing what the sub-function should evaluate. " +
          "This is a plain language description that will guide the child agent inventing the sub-function." +
          (state.parameters.depth > 1
            ? " The sub-function will also have its own sub-functions. " +
              "The spec should include any instructions that should also be propagated down to the child agent's own child agents, if any are needed.\n\n"
            : "\n\n") +
          "**Vector Task Guidelines:**\n" +
          "- After creating the InputSchema for the task, create an OutputLength Starlark Expression. " +
          "This expression is provided with an `input` matching the task's InputSchema and should evaluate to the number of items being ranked.\n" +
          "- Then, create an InputSplit Starlark Expression. " +
          "This expression is provided with the same `input` and should evaluate to an array of valid inputs, which, on their own, are valid inputs to the task. " +
          "So, if the input is an array, the InputSplit expression should convert it into an array of 1-length arrays. " +
          "Or, if the input is an object with at least 1 array field, the InputSplit expression should convert it into an array of objects with the field containing rankable items being 1-length arrays.\n" +
          "- Finally, create an InputMerge Starlark Expression. " +
          "This expression is provided with an `input` which is an array of valid inputs to the task. " +
          "This expression should re-combine the provided inputs back into the original input format for the task.\n\n" +
          "**Mapped Scalar Task Guidelines:**\n" +
          "- Define an InputMap Starlark Expression which converts the parent input into an array of items to be individually scored.\n\n" +
          "**Task Guidelines:**\n" +
          "- `skip` expressions conditionally skip tasks for certain conditions. " +
          "This is typically used to skip tasks which evaluate some optional field on the parent input.\n" +
          "- `input` expressions derive the task input from the parent input.\n" +
          "- `output` expressions transform the raw sub-function output into an output which would be a valid output for the parent function. " +
          "Typically, for vector tasks, just yield the sub-function output directly. " +
          "Typically, for mapped scalar tasks, just L1-normalize the sub-function scores to make them sum to 1.\n\n" +
          "## Expression Context\n\n" +
          "- `input` — always present, the function input, or the task input, depending\n" +
          "- `map` — present in mapped scalar tasks, the current element from input_maps\n" +
          "- `output` — present in task output expressions, the raw sub-function result\n\n" +
          "## Finishing\n\n" +
          "1. Use CheckFunction to validate — fix any errors and retry until it passes\n" +
          "2. Re-read the InventSpec. It is the universal source of truth — never contradict it.",
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
      onNotification,
      agentState,
    );
  } else if (inner instanceof BranchScalarState) {
    return runAgentStep(
      agent,
      {
        prompt:
          "Create the Tasks for your Scalar Function.\n\n" +
          "## Task Structure\n\n" +
          `Create ${tasksStr} placeholder tasks based on your EssayTasks. ` +
          "Each task defines a sub-function which will be automatically invented after you finish. " +
          "Some tasks may have the same `input_schema` as the parent, and some may contain only a subset so as to evaluate a specific aspect of the input.\n\n" +
          "**TaskSpec:**\n" +
          "- First, write a detailed `spec` for the task, describing what the sub-function should evaluate. " +
          "This is a plain language description that will guide the child agent inventing the sub-function." +
          (state.parameters.depth > 1
            ? " The sub-function will also have its own sub-functions. " +
              "The spec should include any instructions that should also be propagated down to the child agent's own child agents, if any are needed.\n\n"
            : "\n\n") +
          "**Task Guidelines:**\n" +
          "- `skip` expressions conditionally skip tasks for certain conditions. " +
          "This is typically used to skip tasks which evaluate some optional field on the parent input.\n" +
          "- `input` expressions derive the task input from the parent input.\n" +
          "- `output` expressions transform the raw sub-function output into an output which would be a valid output for the parent function. " +
          "Typically, just re-yield the sub-function output directly.\n\n" +
          "## Expression Context\n\n" +
          "- `input` — always present, the function input, or the task input, depending\n" +
          "- `output` — present in task output expressions, the raw sub-function result\n\n" +
          "## Finishing\n\n" +
          "1. Use CheckFunction to validate — fix any errors and retry until it passes\n" +
          "2. Re-read the InventSpec. It is the universal source of truth — never contradict it.",
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
      onNotification,
      agentState,
    );
  } else if (inner instanceof LeafVectorState) {
    return runAgentStep(
      agent,
      {
        prompt:
          "Create the Tasks for your Vector Function.\n\n" +
          "## Task Structure\n\n" +
          `Create ${tasksStr} vector completion tasks based on your EssayTasks. ` +
          "Each task defines a prompt for an LLM as well as possible responses for the assistant to reply with. " +
          "The ObjectiveAI system will return a vector of scores evaluating which response the LLM is most likely to reply with. " +
          "These probabilities form the fundamental basis for how the Function ranks items.\n\n" +
          "### Messages\n\n" +
          "`messages` is a prompt comprising the conversation thus far. " +
          "Each message contains a role, and an array of content parts. " +
          "Typically, messages will be a single user message. " +
          "Sometimes, it is a fixed message. " +
          "Other times, it contains context from the input. " +
          "But it never contains the items to be ranked.\n\n" +
          "### Responses\n\n" +
          "`responses` is an array of potential responses the LLM could reply with. " +
          "Each response is an array of content parts.\n\n" +
          "## Structure\n\n" +
          "Be clever in how you structure `messages` and `responses`. " +
          "Do not ask the LLM to directly evaluate items. " +
          "Instead, make the items into real responses that an assistant would actually reply with in a conversation. " +
          "For messages, do not structure it like 'Which item is best?' " +
          "Instead, structure it like 'What would a good item look like?' and make the responses the items being ranked. " +
          "If ranking search results, for example, the message would be the search query, and the responses would be the search results as-is. " +
          "If ranking dating profiles, for example, the message would be 'Generate the profile of someone I should date' and the responses would be the profiles.\n\n" +
          "### Multimodal Content\n\n" +
          "Multimodal content parts can be used in both `messages` and `responses`. " +
          "Put contextual multimodal content in `messages`, and put multimodal content which is being ranked into `responses`. " +
          "Never use `str()` on multimodal content — this breaks the system, and makes it unintelligible to the LLM, ruining the rankings.\n\n" +
          "### Key Design Principles\n\n" +
          "- Some tasks may rank a subset of the parent input. " +
          "Other tasks may rank the entire parent input. " +
          "Some tasks may contain partial context, and others may contain full context. " +
          "Tasks should not be identical to each other. They should vary - be creative in how they vary, feel free to use multiple messages in some cases.\n" +
          "- `output` expressions transform the raw vector completion output into an output which would be a valid output for the parent function. " +
          "Typically, just re-yield the scores from the vector completion output directly.\n" +
          "- `skip` expressions conditionally skip tasks for certain conditions. " +
          "This is typically used to skip tasks which use some optional field(s) on the parent input.\n" +
          "- Ensure that each task ranks items in the same order. " +
          "This is critical for the ObjectiveAI system to be able to combine the rankings from different tasks together into a single ranking.\n\n" +
          "### Expression Context\n\n" +
          "- `input` — always present, the function input\n" +
          "- `output` — present in task output expressions; for vector completion tasks this is a VectorCompletionOutput\n\n" +
          "## Finishing\n\n" +
          "1. Use CheckFunction to validate — fix any errors and retry until it passes\n" +
          "2. Re-read the InventSpec. It is the universal source of truth — never contradict it.",
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
      onNotification,
      agentState,
    );
  } else if (inner instanceof LeafScalarState) {
    return runAgentStep(
      agent,
      {
        prompt:
          "Create the Tasks for your Scalar Function.\n\n" +
          "## Task Structure\n\n" +
          `Create ${tasksStr} vector completion tasks based on your EssayTasks. ` +
          "Each task defines a prompt for an LLM as well as possible responses for the assistant to reply with. " +
          "The ObjectiveAI system will return a vector of scores evaluating which response the LLM is most likely to reply with. " +
          "These probabilities form the fundamental basis for how the Function scores the input.\n\n" +
          "### Messages\n\n" +
          "`messages` is a prompt comprising the conversation thus far. " +
          "Each message contains a role, and an array of content parts. " +
          "Typically, messages will be a single user message. " +
          "It contains context from the input.\n\n" +
          "### Responses\n\n" +
          "`responses` is an array of potential responses the LLM could reply with. " +
          "Each response is an array of content parts. " +
          "Typically, the responses are fixed potential replies that the assistant could reply with. " +
          "Sometimes, they contain context from the input, sometimes the same content across all responses, but the responses are never all identical to each other.\n\n" +
          "## Structure\n\n" +
          "Be clever in how you structure `messages` and `responses`. " +
          "Do not ask the LLM to directly score the input. " +
          "Instead, make the input into real responses that an assistant would actually reply with in a conversation. " +
          "For example, if asking for the quality of a joke, the message could be 'How funny is this joke: {joke}?' and the responses could be 'hilarious', 'pretty funny', and 'not funny at all'.\n\n" +
          "Each response should correspond to some score. " +
          "These scores should be normalized such that an equalized response vector (e.g. [0.33,0.33,0.33]) would yield a final score of 0.5.\n\n" +
          "### Multimodal Content\n\n" +
          "Multimodal content parts can be used in both `messages` and `responses`. " +
          "Typically, it goes into `messages`, but sometimes it can go into `responses`. " +
          "Never use `str()` on multimodal content — this breaks the system, and makes it unintelligible to the LLM, ruining the scores.\n\n" +
          "### Key Design Principles\n\n" +
          "- Some tasks may score a subset of the parent input. " +
          "Other tasks may score the entire parent input. " +
          "Some tasks may contain partial context, and others may contain full context.\n" +
          "- Tasks should not be identical to each other. They should vary - be creative in how they vary, feel free to use multiple messages in some cases.\n" +
          "- `output` expressions transform the raw vector completion output into a scalar score in [0, 1] for the parent function. " +
          "Typically, just multiply the score for each response by its corresponding score value, and then sum these together to get a final score in [0, 1].\n" +
          "- `skip` expressions conditionally skip tasks for certain conditions. " +
          "This is typically used to skip tasks which use some optional field(s) on the parent input.\n\n" +
          "### Expression Context\n\n" +
          "- `input` — always present, the function input\n" +
          "- `output` — present in task output expressions; for vector completion tasks this is a VectorCompletionOutput\n\n" +
          "## Finishing\n\n" +
          "1. Use CheckFunction to validate — fix any errors and retry until it passes\n" +
          "2. Re-read the InventSpec. It is the universal source of truth — never contradict it.",
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
      onNotification,
      agentState,
    );
  } else {
    throw new Error("Unknown function type");
  }
}
