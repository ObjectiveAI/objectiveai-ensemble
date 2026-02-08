import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  checkOutputLength,
  delOutputLength,
  editOutputLength,
  readOutputLength,
  readOutputLengthSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadOutputLength = tool(
  "ReadOutputLength",
  "Read the Function's `output_length` field",
  {},
  async () => resultFromResult(readOutputLength()),
);

export const ReadOutputLengthSchema = tool(
  "ReadOutputLengthSchema",
  "Read the schema for Function `output_length` field",
  {},
  async () => textResult(formatZodSchema(readOutputLengthSchema())),
);

export const EditOutputLength = tool(
  "EditOutputLength",
  "Edit the Function's `output_length` field",
  { value: z.unknown().nullable() },
  async ({ value }) => resultFromResult(editOutputLength(value)),
);

export const DelOutputLength = tool(
  "DelOutputLength",
  "Delete the Function's `output_length` field",
  {},
  async () => resultFromResult(delOutputLength()),
);

export const CheckOutputLength = tool(
  "CheckOutputLength",
  "Validate the Function's `output_length` field",
  {},
  async () => resultFromResult(checkOutputLength()),
);
