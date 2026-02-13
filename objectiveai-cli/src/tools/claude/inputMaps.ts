import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, errorResult, textResult } from "./util";
import {
  appendInputMap,
  checkInputMaps,
  delInputMap,
  delInputMaps,
  editInputMap,
  editInputMaps,
  readInputMaps,
  readInputMapsSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";
import { ToolState, mustRead } from "./toolState";

export function makeReadInputMaps(state: ToolState) {
  return tool(
    "ReadInputMaps",
    "Read the Function's `input_maps` field",
    {},
    async () => {
      state.hasReadInputMaps = true;
      return resultFromResult(readInputMaps());
    },
  );
}

export function makeReadInputMapsSchema(state: ToolState) {
  return tool(
    "ReadInputMapsSchema",
    "Read the schema for Function `input_maps` field",
    {},
    async () => textResult(formatZodSchema(readInputMapsSchema())),
  );
}

export function makeEditInputMaps(state: ToolState) {
  return tool(
    "EditInputMaps",
    "Edit the Function's `input_maps` field",
    { value: z.unknown().nullable() },
    async ({ value }) => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(editInputMaps(value));
    },
  );
}

export function makeEditInputMap(state: ToolState) {
  return tool(
    "EditInputMap",
    "Replace an input map at a specific index in the Function's `input_maps` array",
    { index: z.int().nonnegative(), value: z.unknown() },
    async ({ index, value }) => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(editInputMap(index, value));
    },
  );
}

export function makeAppendInputMap(state: ToolState) {
  return tool(
    "AppendInputMap",
    "Append an input map to the Function's `input_maps` array",
    { value: z.unknown() },
    async ({ value }) => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(appendInputMap(value));
    },
  );
}

export function makeDelInputMap(state: ToolState) {
  return tool(
    "DelInputMap",
    "Delete an input map at a specific index from the Function's `input_maps` array",
    { index: z.int().nonnegative() },
    async ({ index }) => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(delInputMap(index));
    },
  );
}

export function makeDelInputMaps(state: ToolState) {
  return tool(
    "DelInputMaps",
    "Delete the Function's `input_maps` field",
    {},
    async () => {
      const err = mustRead(state.hasReadInputMaps, "input_maps");
      if (err) return errorResult(err);
      return resultFromResult(delInputMaps());
    },
  );
}

export function makeCheckInputMaps(state: ToolState) {
  return tool(
    "CheckInputMaps",
    "Validate the Function's `input_maps` field",
    {},
    async () => resultFromResult(checkInputMaps()),
  );
}
