import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Chat } from "objectiveai";
import { formatZodSchema } from "../schema";

const Request = Chat.Completions.Request;

// Non-expression (compiled) variants — used in compiled task contexts (ExampleInputs).
export const ReadSimpleContentSchema = tool(
  "ReadSimpleContentSchema",
  "Read the schema for compiled SimpleContent (text-only content used by developer/system messages)",
  {},
  async () => textResult(formatZodSchema(Request.SimpleContentSchema)),
);

export const ReadRichContentSchema = tool(
  "ReadRichContentSchema",
  "Read the schema for compiled RichContent (text, images, audio, video, files — used by user/tool/assistant messages)",
  {},
  async () => textResult(formatZodSchema(Request.RichContentSchema)),
);

// Expression variants — used in task definition contexts (tasks, function schema).
export const ReadSimpleContentExpressionSchema = tool(
  "ReadSimpleContentExpressionSchema",
  "Read the schema for SimpleContent expression (text-only content, supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.SimpleContentExpressionSchema)),
);

export const ReadRichContentExpressionSchema = tool(
  "ReadRichContentExpressionSchema",
  "Read the schema for RichContent expression (text, images, audio, video, files — supports $starlark/$jmespath)",
  {},
  async () => textResult(formatZodSchema(Request.RichContentExpressionSchema)),
);
