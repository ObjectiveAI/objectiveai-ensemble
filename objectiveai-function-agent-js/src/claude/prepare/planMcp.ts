import { createSdkMcpServer, query } from "@anthropic-ai/claude-agent-sdk";
import { LogFn } from "../../agentOptions";
import { makeReadPlan, makeWritePlan } from "../../tools/claude/plan";
import { ReadSpec } from "../../tools/claude/spec";
import { ReadName } from "../../tools/claude/name";
import { ReadEssay } from "../../tools/claude/essay";
import { ReadEssayTasks } from "../../tools/claude/essayTasks";
import {
  ListExampleFunctions,
  ReadExampleFunction,
} from "../../tools/claude/exampleFunctions";
import { ReadFunctionSchema } from "../../tools/claude/function";
import { getNextPlanIndex, getPlanPath } from "../planIndex";

export async function planMcp(
  log: LogFn,
  sessionId?: string,
): Promise<string | undefined> {
  const nextPlanIndex = getNextPlanIndex();
  const planPath = getPlanPath(nextPlanIndex);

  const tools = [
    ReadSpec,
    ReadName,
    ReadEssay,
    ReadEssayTasks,
    makeReadPlan(nextPlanIndex),
    makeWritePlan(nextPlanIndex),
    ListExampleFunctions,
    ReadExampleFunction,
    ReadFunctionSchema,
  ];
  const mcpServer = createSdkMcpServer({ name: "plan", tools });

  const prompt =
    `Read SPEC.md, name.txt, ESSAY.md, ESSAY_TASKS.md, the function type, and example functions to understand the context.` +
    ` Then write your implementation plan to \`${planPath}\` (plan index ${nextPlanIndex}). Include:` +
    `\n- The input schema structure and field descriptions` +
    `\n- Whether any input maps are needed for mapped task execution` +
    `\n- What the function definition will look like` +
    `\n- What expressions need to be written` +
    `\n- What test inputs will cover edge cases and diverse scenarios`;

  const stream = query({
    prompt,
    options: {
      tools: [],
      mcpServers: { plan: mcpServer },
      allowedTools: ["mcp__plan__*"],
      disallowedTools: ["AskUserQuestion"],
      permissionMode: "dontAsk",
      resume: sessionId,
    },
  });

  for await (const message of stream) {
    if (message.type === "system" && message.subtype === "init") {
      sessionId = message.session_id;
    }
    log(message);
  }

  return sessionId;
}
