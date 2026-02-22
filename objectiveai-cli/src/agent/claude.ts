import {
  createSdkMcpServer,
  query,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AgentStepFn, AgentStep, StepName } from ".";
import { NotificationMessage } from "../notification";
import { Parameters } from "../parameters";
import { Result } from "../result";
import { Tool } from "../tool";
import { getAgentClaudeConfig, AgentClaudeConfig, ClaudeModel } from "../config";

// The Claude Agent SDK adds exit/uncaughtException listeners per query.
// With many concurrent streams the default limit of 10 triggers warnings.
process.setMaxListeners(0);

export interface ClaudeState {
  sessionId?: string;
}

function resultToCallToolResult(result: Result<string>): CallToolResult {
  if (!result.ok) {
    return { content: [{ type: "text" as const, text: result.error }], isError: true };
  }
  return { content: [{ type: "text" as const, text: result.value ?? "OK" }] };
}

const STEP_TO_CONFIG_KEY: Record<StepName, keyof AgentClaudeConfig> = {
  type: "typeModel",
  name: "nameModel",
  essay: "essayModel",
  fields: "fieldsModel",
  essay_tasks: "essayTasksModel",
  body: "bodyModel",
  description: "descriptionModel",
};

const CLAUDE_MODEL_TO_QUERY: Record<ClaudeModel, string> = {
  opus: "default",
  sonnet: "sonnet",
  haiku: "haiku",
};

export function claude(): [AgentStepFn<ClaudeState>, null] {
  const agent: AgentStepFn<ClaudeState> = async function* (
    step: AgentStep,
    state: ClaudeState | undefined,
    _parameters: Parameters,
  ): AsyncGenerator<NotificationMessage, ClaudeState> {
    const notifications: NotificationMessage[] = [];

    const sdkTools = step.tools.map((t: Tool) =>
      tool(t.name, t.description, t.inputSchema, async (args: any) => {
        const result = await t.fn(args);
        notifications.push(
          result.ok
            ? { role: "tool" as const, name: t.name }
            : { role: "tool" as const, name: t.name, error: result.error },
        );
        return resultToCallToolResult(result);
      }),
    );

    const mcpServer = createSdkMcpServer({
      name: "invent",
      tools: sdkTools,
    });

    const claudeConfig = getAgentClaudeConfig();
    const configKey = STEP_TO_CONFIG_KEY[step.stepName];
    const claudeModel = claudeConfig[configKey];

    const stream = query({
      prompt: step.prompt,
      options: {
        mcpServers: { invent: mcpServer },
        allowedTools: ["mcp__invent__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: state?.sessionId,
        ...(claudeModel ? { model: CLAUDE_MODEL_TO_QUERY[claudeModel] } : {}),
      },
    });

    let sessionId: string | undefined = state?.sessionId;
    // The Claude Agent SDK has a race condition where it writes to the MCP
    // server's stdin after the transport stream closes. This surfaces as an
    // unhandled 'error' event on the Socket, which crashes the process.
    // Install a temporary handler to swallow it.
    const onUncaughtException = (err: Error & { code?: string }) => {
      if (err?.code === "ERR_STREAM_WRITE_AFTER_END") {
        return;
      }
      // Re-throw anything else — it's not ours to handle.
      throw err;
    };
    process.on("uncaughtException", onUncaughtException);

    try {
      for await (const message of stream) {
        // Drain queued tool notifications
        while (notifications.length > 0) {
          yield notifications.shift()!;
        }

        if (message.type === "system" && message.subtype === "init") {
          sessionId = message.session_id;
        }

        if (message.type === "assistant") {
          const parts: string[] = [];
          for (const block of message.message.content) {
            if (block.type === "text") {
              const text = block.text.trim();
              if (text) parts.push(text);
            }
          }
          if (parts.length > 0) {
            yield { role: "assistant", content: parts.join("\n") };
          }
        }
      }
    } finally {
      process.removeListener("uncaughtException", onUncaughtException);
    }

    // Drain any remaining tool notifications
    while (notifications.length > 0) {
      yield notifications.shift()!;
    }

    return { sessionId };
  };

  return [agent, null];
}
