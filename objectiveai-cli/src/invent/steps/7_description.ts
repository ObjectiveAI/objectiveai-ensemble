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

  const isBranch =
    inner instanceof BranchVectorState || inner instanceof BranchScalarState;

  // For branch functions, compute placeholder task indices and set them on state
  if (isBranch) {
    const tasks = inner.function.tasks ?? [];
    const indices: number[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (
        t.type === "placeholder.scalar.function" ||
        t.type === "placeholder.vector.function"
      ) {
        indices.push(i);
      }
    }
    state.setPlaceholderTaskIndices(indices);
  }

  let prompt =
    "First, create a 1-paragraph description of the Function you've invented. " +
    "Then, create a comprehensive README for the Function, describing its input, output, use-cases, and what all it evaluates.";

  if (isBranch) {
    const tasks = inner.function.tasks ?? [];
    const templateLines: string[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (
        t.type === "placeholder.scalar.function" ||
        t.type === "placeholder.vector.function"
      ) {
        templateLines.push(`https://github.com/{{ .Owner }}/{{ .Task${i} }}`);
      }
    }
    if (templateLines.length > 0) {
      prompt +=
        "\n\nYour README must include a link to each sub-function using the following template format:\n" +
        templateLines.join("\n") +
        "\nThese templates will be automatically replaced with the actual repository URLs after the sub-functions are invented.\n" +
        "You may also use {{ .Owner }} and {{ .TaskN }} anywhere else in the README and they will all be automatically replaced.";
    }
  }

  return runAgentStep(
    agent,
    {
      stepName: "description",
      prompt,
      tools: [
        state.getInventSpecTool(),
        state.getFunctionTypeTool(),
        state.getNameTool(),
        state.getInventEssayTool(),
        inner.getInputSchemaTool(),
        state.getInventEssayTasksTool(),
        inner.getTasksLengthTool(),
        inner.getTaskTool() as unknown as Tool,
        ...(isBranch ? [inner.getTaskSpecTool() as unknown as Tool] : []),
        state.setDescriptionTool() as unknown as Tool,
        state.setReadmeTool() as unknown as Tool,
      ],
    },
    state.parameters,
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
