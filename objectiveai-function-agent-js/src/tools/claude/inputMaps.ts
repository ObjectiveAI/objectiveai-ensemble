import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  appendInputMap,
  checkInputMaps,
  delInputMap,
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

export const AppendInputMap = tool(
  "AppendInputMap",
  "Append an input map to the Function's `input_maps` array",
  { value: z.unknown() },
  async ({ value }) => resultFromResult(appendInputMap(value)),
);

export const DelInputMap = tool(
  "DelInputMap",
  "Delete an input map at a specific index from the Function's `input_maps` array",
  { index: z.int().nonnegative() },
  async ({ index }) => resultFromResult(delInputMap(index)),
);

export const CheckInputMaps = tool(
  "CheckInputMaps",
  "Validate the Function's `input_maps` field",
  {},
  async () => resultFromResult(checkInputMaps()),
);
