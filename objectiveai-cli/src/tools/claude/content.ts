import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Chat } from "objectiveai";
import { formatZodSchema } from "../schema";
import { ToolState } from "./toolState";

const Request = Chat.Completions.Request;

// Non-expression (compiled) variants — used in compiled task contexts (ExampleInputs).
export function makeReadSimpleContentSchema(state: ToolState) {
  return tool(
    "ReadSimpleContentSchema",
    "Read the schema for compiled SimpleContent (text-only content used by developer/system messages)",
    {},
    async () => textResult(formatZodSchema(Request.SimpleContentSchema)),
  );
}

export function makeReadRichContentSchema(state: ToolState) {
  return tool(
    "ReadRichContentSchema",
    "Read the schema for compiled RichContent (text, images, audio, video, files — used by user/tool/assistant messages)",
    {},
    async () => textResult(formatZodSchema(Request.RichContentSchema)),
  );
}

// Expression variants — used in task definition contexts (tasks, function schema).
export function makeReadSimpleContentExpressionSchema(state: ToolState) {
  return tool(
    "ReadSimpleContentExpressionSchema",
    "Read the schema for SimpleContent expression (text-only content, supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.SimpleContentExpressionSchema)),
  );
}

export function makeReadRichContentExpressionSchema(state: ToolState) {
  return tool(
    "ReadRichContentExpressionSchema",
    "Read the schema for RichContent expression (text, images, audio, video, files — supports $starlark/$jmespath)",
    {},
    async () => textResult(formatZodSchema(Request.RichContentExpressionSchema)),
  );
}
