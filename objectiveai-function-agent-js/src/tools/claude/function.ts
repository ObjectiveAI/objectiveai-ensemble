import { tool } from "@anthropic-ai/claude-agent-sdk";
import { checkFunction, readFunction, readFunctionSchema } from "../function";
import { resultFromResult, textResult } from "./util";
import { formatZodSchema } from "../schema";

export const ReadFunction = tool(
  "ReadFunction",
  "Read the full Function",
  {},
  async () => resultFromResult(readFunction()),
);

export const ReadFunctionSchema = tool(
  "ReadFunctionSchema",
  "Read the schema for Function",
  {},
  async () => textResult(formatZodSchema(readFunctionSchema())),
);

export const CheckFunction = tool(
  "CheckFunction",
  "Validate the full Function",
  {},
  async () => resultFromResult(checkFunction()),
);
