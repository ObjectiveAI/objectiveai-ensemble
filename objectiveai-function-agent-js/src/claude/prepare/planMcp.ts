import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";
import { consumeStream } from "../../logging";
import { makeWritePlan } from "../../tools/claude/plan";
import { makeReadSpec } from "../../tools/claude/spec";
import { makeReadName } from "../../tools/claude/name";
import { makeReadEssay } from "../../tools/claude/essay";
import { makeReadEssayTasks } from "../../tools/claude/essayTasks";
import {
  makeListExampleFunctions,
  makeReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { makeReadFunctionSchema } from "../../tools/claude/function";
import { ToolState } from "../../tools/claude/toolState";
import { getPlanPath } from "../planIndex";

export async function planMcp(
  state: ToolState,
  log: LogFn,
  sessionId?: string,
  instructions?: string,
): Promise<string | undefined> {
  const planPath = getPlanPath(state.writePlanIndex);

  const tools = [
    makeReadSpec(state),
    makeReadName(state),
    makeReadEssay(state),
    makeReadEssayTasks(state),
    makeWritePlan(state),
    makeListExampleFunctions(state),
    makeReadExampleFunction(state),
    makeReadFunctionSchema(state),
  ];
  const mcpServer = createSdkMcpServer({ name: "plan", tools });

  let prompt =
    `Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the function type, and example functions to understand the context.` +
    ` Then write your implementation plan to \`${planPath}\` (plan index ${state.writePlanIndex}). Include:` +
    `\n- The input schema structure and field descriptions` +
    `\n- Whether any input maps are needed for mapped task execution` +
    `\n- What the function definition will look like` +
    `\n- What expressions need to be written` +
    `\n- What test inputs will cover edge cases and diverse scenarios`;

  if (instructions) {
    prompt += `\n\n## Extra Instructions\n\n${instructions}`;
  }

  sessionId = await consumeStream(
    query({
      prompt,
      options: {
        tools: [],
        mcpServers: { plan: mcpServer },
        allowedTools: ["mcp__plan__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: sessionId,
      },
    }),
    log,
    sessionId,
  );

  return sessionId;
}
