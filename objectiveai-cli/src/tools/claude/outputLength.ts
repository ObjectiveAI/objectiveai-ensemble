import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, errorResult, textResult } from "./util";
import {
  checkOutputLength,
  delOutputLength,
  editOutputLength,
  readOutputLength,
  readOutputLengthSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";
import { ToolState, mustRead } from "./toolState";

export function makeReadOutputLength(state: ToolState) {
  return tool(
    "ReadOutputLength",
    "Read the Function's `output_length` field",
    {},
    async () => {
      state.hasReadOutputLength = true;
      return resultFromResult(readOutputLength());
    },
  );
}

export function makeReadOutputLengthSchema(state: ToolState) {
  return tool(
    "ReadOutputLengthSchema",
    "Read the schema for Function `output_length` field",
    {},
    async () => textResult(formatZodSchema(readOutputLengthSchema())),
  );
}

export function makeEditOutputLength(state: ToolState) {
  return tool(
    "EditOutputLength",
    "Edit the Function's `output_length` field",
    { value: z.unknown().nullable() },
    async ({ value }) => {
      const err = mustRead(state.hasReadOutputLength, "output_length");
      if (err) return errorResult(err);
      return resultFromResult(editOutputLength(value));
    },
  );
}

export function makeDelOutputLength(state: ToolState) {
  return tool(
    "DelOutputLength",
    "Delete the Function's `output_length` field",
    {},
    async () => {
      const err = mustRead(state.hasReadOutputLength, "output_length");
      if (err) return errorResult(err);
      return resultFromResult(delOutputLength());
    },
  );
}

export function makeCheckOutputLength(state: ToolState) {
  return tool(
    "CheckOutputLength",
    "Validate the Function's `output_length` field",
    {},
    async () => resultFromResult(checkOutputLength()),
  );
}
