import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { JsonValueSchema, JsonValueExpressionSchema } from "objectiveai";
import { formatZodSchema } from "../schema";
import { ToolState } from "./toolState";

export function makeReadJsonValueSchema(state: ToolState) {
  return tool(
    "ReadJsonValueSchema",
    "Read the schema for the JsonValue type (recursive)",
    {},
    async () => textResult(formatZodSchema(JsonValueSchema, { resolveLazy: true })),
  );
}

export function makeReadJsonValueExpressionSchema(state: ToolState) {
  return tool(
    "ReadJsonValueExpressionSchema",
    "Read the schema for the JsonValueExpression type (recursive, supports expressions)",
    {},
    async () => textResult(formatZodSchema(JsonValueExpressionSchema, { resolveLazy: true })),
  );
}
