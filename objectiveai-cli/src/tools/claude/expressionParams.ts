import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import { formatZodSchema } from "../schema";
import {
  readInputParamSchema,
  readMapParamSchema,
  readOutputParamSchema,
} from "../expressionParams";
import { ToolState } from "./toolState";

export function makeReadInputParamSchema(state: ToolState) {
  return tool(
    "ReadInputParamSchema",
    "Read the schema for `input` available in expression context.",
    {},
    async () => {
      const result = readInputParamSchema();
      if (!result.ok) {
        return resultFromResult(result);
      }
      return textResult(formatZodSchema(result.value));
    },
  );
}

export function makeReadMapParamSchema(state: ToolState) {
  return tool(
    "ReadMapParamSchema",
    "Read the schema for `map` available in mapped task expression context. For a task with `map: i`, the task is compiled once per element in `input_maps[i]`. Each compiled instance receives the current element as `map`.",
    {},
    async () => textResult(formatZodSchema(readMapParamSchema())),
  );
}

export function makeReadOutputParamSchema(state: ToolState) {
  return tool(
    "ReadOutputParamSchema",
    "Read the schema for `output` available in task output expression context.",
    {},
    async () => textResult(formatZodSchema(readOutputParamSchema())),
  );
}
