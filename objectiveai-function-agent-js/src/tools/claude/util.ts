import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Result } from "../result";

export function textResult(text: string): CallToolResult {
  return { content: [{ type: "text" as const, text }] };
}

export function resultFromResult<T>(result: Result<T>): CallToolResult {
  if (!result.ok) {
    return {
      content: [{ type: "text" as const, text: result.error! }],
      isError: true,
    };
  }
  if (result.value === undefined) {
    return textResult("OK");
  }
  if (typeof result.value === "string") {
    return textResult(result.value);
  }
  return textResult(JSON.stringify(result.value, null, 2));
}
