import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Chat } from "objectiveai";
import { formatZodSchema } from "../schema";

const Request = Chat.Completions.Request;

// Non-expression (compiled) variants — used in compiled task contexts (ExampleInputs).
export const ReadDeveloperMessageSchema = tool(
  "ReadDeveloperMessageSchema",
  "Read the schema for a compiled developer message (role: developer)",
  {},
  async () => textResult(formatZodSchema(Request.DeveloperMessageSchema)),
);

export const ReadSystemMessageSchema = tool(
  "ReadSystemMessageSchema",
  "Read the schema for a compiled system message (role: system)",
  {},
  async () => textResult(formatZodSchema(Request.SystemMessageSchema)),
);

export const ReadUserMessageSchema = tool(
  "ReadUserMessageSchema",
  "Read the schema for a compiled user message (role: user)",
  {},
  async () => textResult(formatZodSchema(Request.UserMessageSchema)),
);

export const ReadToolMessageSchema = tool(
  "ReadToolMessageSchema",
  "Read the schema for a compiled tool message (role: tool)",
  {},
  async () => textResult(formatZodSchema(Request.ToolMessageSchema)),
);

export const ReadAssistantMessageSchema = tool(
  "ReadAssistantMessageSchema",
  "Read the schema for a compiled assistant message (role: assistant)",
  {},
  async () => textResult(formatZodSchema(Request.AssistantMessageSchema)),
);

// Expression variants — used in task definition contexts (tasks, function schema).
export const ReadDeveloperMessageExpressionSchema = tool(
  "ReadDeveloperMessageExpressionSchema",
  "Read the schema for a developer message expression (role: developer, supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.DeveloperMessageExpressionSchema)),
);

export const ReadSystemMessageExpressionSchema = tool(
  "ReadSystemMessageExpressionSchema",
  "Read the schema for a system message expression (role: system, supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.SystemMessageExpressionSchema)),
);

export const ReadUserMessageExpressionSchema = tool(
  "ReadUserMessageExpressionSchema",
  "Read the schema for a user message expression (role: user, supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.UserMessageExpressionSchema)),
);

export const ReadToolMessageExpressionSchema = tool(
  "ReadToolMessageExpressionSchema",
  "Read the schema for a tool message expression (role: tool, supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.ToolMessageExpressionSchema)),
);

export const ReadAssistantMessageExpressionSchema = tool(
  "ReadAssistantMessageExpressionSchema",
  "Read the schema for an assistant message expression (role: assistant, supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.AssistantMessageExpressionSchema)),
);
