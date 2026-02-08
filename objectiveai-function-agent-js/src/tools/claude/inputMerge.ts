import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  checkInputMerge,
  delInputMerge,
  editInputMerge,
  readInputMerge,
  readInputMergeSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadInputMerge = tool(
  "ReadInputMerge",
  "Read the Function's `input_merge` field",
  {},
  async () => resultFromResult(readInputMerge()),
);

export const ReadInputMergeSchema = tool(
  "ReadInputMergeSchema",
  "Read the schema for Function `input_merge` field. Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (from input_split) back into a single input. Receives `input` as an array of sub-inputs. Used by strategies like swiss_system for parallel pool execution.",
  {},
  async () => textResult(formatZodSchema(readInputMergeSchema())),
);

export const EditInputMerge = tool(
  "EditInputMerge",
  "Edit the Function's `input_merge` field",
  { value: z.unknown().nullable() },
  async ({ value }) => resultFromResult(editInputMerge(value)),
);

export const DelInputMerge = tool(
  "DelInputMerge",
  "Delete the Function's `input_merge` field",
  {},
  async () => resultFromResult(delInputMerge()),
);

export const CheckInputMerge = tool(
  "CheckInputMerge",
  "Validate the Function's `input_merge` field",
  {},
  async () => resultFromResult(checkInputMerge()),
);
