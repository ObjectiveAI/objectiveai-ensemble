import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { JsonValueSchema, JsonValueExpressionSchema } from "objectiveai";
import { formatZodSchema } from "../schema";

export const ReadJsonValueSchema = tool(
  "ReadJsonValueSchema",
  "Read the schema for the JsonValue type (recursive)",
  {},
  async () => textResult(formatZodSchema(JsonValueSchema, { resolveLazy: true })),
);

export const ReadJsonValueExpressionSchema = tool(
  "ReadJsonValueExpressionSchema",
  "Read the schema for the JsonValueExpression type (recursive, supports expressions)",
  {},
  async () => textResult(formatZodSchema(JsonValueExpressionSchema, { resolveLazy: true })),
);
