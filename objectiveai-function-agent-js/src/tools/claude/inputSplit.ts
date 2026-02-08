import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  checkInputSplit,
  delInputSplit,
  editInputSplit,
  readInputSplit,
  readInputSplitSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadInputSplit = tool(
  "ReadInputSplit",
  "Read the Function's `input_split` field",
  {},
  async () => resultFromResult(readInputSplit()),
);

export const ReadInputSplitSchema = tool(
  "ReadInputSplitSchema",
  "Read the schema for Function `input_split` field. Splits the input into sub-inputs (one per output element). Array length must equal output_length. Each sub-input, when executed alone, must produce output_length=1. Used by strategies like swiss_system for parallel pool execution.",
  {},
  async () => textResult(formatZodSchema(readInputSplitSchema())),
);

export const EditInputSplit = tool(
  "EditInputSplit",
  "Edit the Function's `input_split` field",
  { value: z.unknown().nullable() },
  async ({ value }) => resultFromResult(editInputSplit(value)),
);

export const DelInputSplit = tool(
  "DelInputSplit",
  "Delete the Function's `input_split` field",
  {},
  async () => resultFromResult(delInputSplit()),
);

export const CheckInputSplit = tool(
  "CheckInputSplit",
  "Validate the Function's `input_split` field",
  {},
  async () => resultFromResult(checkInputSplit()),
);
