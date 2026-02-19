import {
  createSdkMcpServer,
  query,
  tool,
} from "@anthropic-ai/claude-agent-sdk";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AgentStepFn, AgentStep } from ".";
import { NotificationMessage } from "../notification";
import { Parameters } from "../parameters";
import { Result } from "../result";
import { Tool } from "../tool";

export interface ClaudeState {
  sessionId?: string;
}

function resultToCallToolResult(result: Result<string>): CallToolResult {
  if (!result.ok) {
    return { content: [{ type: "text" as const, text: result.error }], isError: true };
  }
  return { content: [{ type: "text" as const, text: result.value ?? "OK" }] };
}

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

    const stream = query({
      prompt: step.prompt,
      options: {
        mcpServers: { invent: mcpServer },
        allowedTools: ["mcp__invent__*"],
        disallowedTools: ["AskUserQuestion"],
        permissionMode: "dontAsk",
        resume: state?.sessionId,
      },
    });

    let sessionId: string | undefined = state?.sessionId;

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

    // Drain any remaining tool notifications
    while (notifications.length > 0) {
      yield notifications.shift()!;
    }

    return { sessionId };
  };

  return [agent, null];
}
