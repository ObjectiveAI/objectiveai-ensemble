import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Chat } from "objectiveai";
import { formatZodSchema } from "../schema";
import { ToolState } from "./toolState";

const Request = Chat.Completions.Request;

// Non-expression (compiled) variants — used in compiled task contexts (ExampleInputs).
export function makeReadDeveloperMessageSchema(state: ToolState) {
  return tool(
    "ReadDeveloperMessageSchema",
    "Read the schema for a compiled developer message (role: developer)",
    {},
    async () => textResult(formatZodSchema(Request.DeveloperMessageSchema)),
  );
}

export function makeReadSystemMessageSchema(state: ToolState) {
  return tool(
    "ReadSystemMessageSchema",
    "Read the schema for a compiled system message (role: system)",
    {},
    async () => textResult(formatZodSchema(Request.SystemMessageSchema)),
  );
}

export function makeReadUserMessageSchema(state: ToolState) {
  return tool(
    "ReadUserMessageSchema",
    "Read the schema for a compiled user message (role: user)",
    {},
    async () => textResult(formatZodSchema(Request.UserMessageSchema)),
  );
}

export function makeReadToolMessageSchema(state: ToolState) {
  return tool(
    "ReadToolMessageSchema",
    "Read the schema for a compiled tool message (role: tool)",
    {},
    async () => textResult(formatZodSchema(Request.ToolMessageSchema)),
  );
}

export function makeReadAssistantMessageSchema(state: ToolState) {
  return tool(
    "ReadAssistantMessageSchema",
    "Read the schema for a compiled assistant message (role: assistant)",
    {},
    async () => textResult(formatZodSchema(Request.AssistantMessageSchema)),
  );
}

// Expression variants — used in task definition contexts (tasks, function schema).
export function makeReadDeveloperMessageExpressionSchema(state: ToolState) {
  return tool(
    "ReadDeveloperMessageExpressionSchema",
    "Read the schema for a developer message expression (role: developer, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.DeveloperMessageExpressionSchema)),
  );
}

export function makeReadSystemMessageExpressionSchema(state: ToolState) {
  return tool(
    "ReadSystemMessageExpressionSchema",
    "Read the schema for a system message expression (role: system, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.SystemMessageExpressionSchema)),
  );
}

export function makeReadUserMessageExpressionSchema(state: ToolState) {
  return tool(
    "ReadUserMessageExpressionSchema",
    "Read the schema for a user message expression (role: user, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.UserMessageExpressionSchema)),
  );
}

export function makeReadToolMessageExpressionSchema(state: ToolState) {
  return tool(
    "ReadToolMessageExpressionSchema",
    "Read the schema for a tool message expression (role: tool, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.ToolMessageExpressionSchema)),
  );
}

export function makeReadAssistantMessageExpressionSchema(state: ToolState) {
  return tool(
    "ReadAssistantMessageExpressionSchema",
    "Read the schema for an assistant message expression (role: assistant, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.AssistantMessageExpressionSchema)),
  );
}
