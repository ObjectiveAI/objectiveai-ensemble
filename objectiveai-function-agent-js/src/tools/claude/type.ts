import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import { checkType, editType, readType, readTypeSchema } from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadType = tool(
  "ReadType",
  "Read the Function's `type` field",
  {},
  async () => resultFromResult(readType()),
);

export const ReadTypeSchema = tool(
  "ReadTypeSchema",
  "Read the schema for Function `type` field",
  {},
  async () => textResult(formatZodSchema(readTypeSchema())),
);

export const EditType = tool(
  "EditType",
  "Edit the Function's `type` field",
  { value: z.string() },
  async ({ value }) => resultFromResult(editType(value)),
);

export const CheckType = tool(
  "CheckType",
  "Validate the Function's `type` field",
  {},
  async () => resultFromResult(checkType()),
);
