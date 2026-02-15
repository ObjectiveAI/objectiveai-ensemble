import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, errorResult, textResult } from "./util";
import {
  checkInputMerge,
  delInputMerge,
  editInputMerge,
  readInputMerge,
  readInputMergeSchema,
} from "../function";
import z from "zod";
import { formatZodSchema } from "../schema";
import { ToolState, mustRead } from "./toolState";

export function makeReadInputMerge(state: ToolState) {
  return tool(
    "ReadInputMerge",
    "Read the Function's `input_merge` field",
    {},
    async () => {
      state.hasReadInputMerge = true;
      return resultFromResult(readInputMerge());
    },
  );
}

export function makeReadInputMergeSchema(state: ToolState) {
  return tool(
    "ReadInputMergeSchema",
    "Read the schema for Function `input_merge` field. Recombines a variable-size, arbitrarily-ordered subset of sub-inputs (from input_split) back into a single input. Receives `input` as an array of sub-inputs. Used by strategies like swiss_system for parallel pool execution.",
    {},
    async () => textResult(formatZodSchema(readInputMergeSchema())),
  );
}

export function makeEditInputMerge(state: ToolState) {
  return tool(
    "EditInputMerge",
    "Edit the Function's `input_merge` field",
    { value: z.unknown().nullable() },
    async ({ value }) => {
      const err = mustRead(state.hasReadInputMerge, "input_merge");
      if (err) return errorResult(err);
      return resultFromResult(editInputMerge(value));
    },
  );
}

export function makeDelInputMerge(state: ToolState) {
  return tool(
    "DelInputMerge",
    "Delete the Function's `input_merge` field",
    {},
    async () => {
      const err = mustRead(state.hasReadInputMerge, "input_merge");
      if (err) return errorResult(err);
      return resultFromResult(delInputMerge());
    },
  );
}

export function makeCheckInputMerge(state: ToolState) {
  return tool(
    "CheckInputMerge",
    "Validate the Function's `input_merge` field",
    {},
    async () => resultFromResult(checkInputMerge()),
  );
}
