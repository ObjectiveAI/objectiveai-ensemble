import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Result } from "../result";
import { MessageQueue } from "../../messageQueue";

let _messageQueue: MessageQueue | undefined;

export function setMessageQueue(queue: MessageQueue): void {
  _messageQueue = queue;
}

function drainMessages(result: CallToolResult): CallToolResult {
  if (!_messageQueue || _messageQueue.length === 0) return result;
  const messages = _messageQueue.drain();
  const suffix = "\n\n[USER MESSAGE]: " + messages.join("\n[USER MESSAGE]: ");
  const last = result.content[result.content.length - 1];
  if (last && "type" in last && last.type === "text") {
    last.text += suffix;
  } else {
    result.content.push({ type: "text" as const, text: suffix });
  }
  return result;
}

export function textResult(text: string): CallToolResult {
  return drainMessages({ content: [{ type: "text" as const, text }] });
}

export function errorResult(error: string): CallToolResult {
  return drainMessages({ content: [{ type: "text" as const, text: error }], isError: true });
}

export function resultFromResult<T>(result: Result<T>): CallToolResult {
  if (!result.ok) {
    return errorResult(result.error!);
  }
  if (result.value === undefined) {
    return textResult("OK");
  }
  if (typeof result.value === "string") {
    return textResult(result.value);
  }
  return textResult(JSON.stringify(result.value, null, 2));
}
