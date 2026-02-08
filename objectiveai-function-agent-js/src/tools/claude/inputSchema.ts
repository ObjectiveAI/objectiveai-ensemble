import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  checkInputSchema,
  editInputSchema,
  readInputSchema,
  readInputSchemaSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadInputSchema = tool(
  "ReadInputSchema",
  "Read the Function's `input_schema` field",
  {},
  async () => resultFromResult(readInputSchema()),
);

export const ReadInputSchemaSchema = tool(
  "ReadInputSchemaSchema",
  "Read the schema for Function `input_schema` field",
  {},
  async () => textResult(formatZodSchema(readInputSchemaSchema())),
);

export const EditInputSchema = tool(
  "EditInputSchema",
  "Edit the Function's `input_schema` field",
  { value: z.record(z.string(), z.unknown()) },
  async ({ value }) => resultFromResult(editInputSchema(value)),
);

export const CheckInputSchema = tool(
  "CheckInputSchema",
  "Validate the Function's `input_schema` field",
  {},
  async () => resultFromResult(checkInputSchema()),
);
