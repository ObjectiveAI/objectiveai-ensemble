import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Functions } from "objectiveai";
import { formatZodSchema } from "../schema";
import { ToolState } from "./toolState";

export function makeReadInputValueSchema(state: ToolState) {
  return tool(
    "ReadInputValueSchema",
    "Read the schema for the InputValue type (recursive, supports media)",
    {},
    async () => textResult(formatZodSchema(Functions.Expression.InputValueSchema, { resolveLazy: true })),
  );
}

export function makeReadInputValueExpressionSchema(state: ToolState) {
  return tool(
    "ReadInputValueExpressionSchema",
    "Read the schema for the InputValueExpression type (recursive, supports media and expressions)",
    {},
    async () => textResult(formatZodSchema(Functions.Expression.InputValueExpressionSchema, { resolveLazy: true })),
  );
}
