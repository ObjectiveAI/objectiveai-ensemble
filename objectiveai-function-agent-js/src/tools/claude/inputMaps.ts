import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  checkInputMaps,
  editInputMaps,
  readInputMaps,
  readInputMapsSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";

export const ReadInputMaps = tool(
  "ReadInputMaps",
  "Read the Function's `input_maps` field",
  {},
  async () => resultFromResult(readInputMaps()),
);

export const ReadInputMapsSchema = tool(
  "ReadInputMapsSchema",
  "Read the schema for Function `input_maps` field",
  {},
  async () => textResult(formatZodSchema(readInputMapsSchema())),
);

export const EditInputMaps = tool(
  "EditInputMaps",
  "Edit the Function's `input_maps` field",
  { value: z.unknown().nullable() },
  async ({ value }) => resultFromResult(editInputMaps(value)),
);

export const CheckInputMaps = tool(
  "CheckInputMaps",
  "Validate the Function's `input_maps` field",
  {},
  async () => resultFromResult(checkInputMaps()),
);
