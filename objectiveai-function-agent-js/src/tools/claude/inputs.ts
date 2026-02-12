import { tool } from "@anthropic-ai/claude-agent-sdk";
import { ToolState, mustRead } from "./toolState";
import { Functions } from "objectiveai";
import { resultFromResult, textResult, errorResult } from "./util";
import {
  appendExampleInput,
  checkExampleInputs,
  delExampleInput,
  delExampleInputs,
  editExampleInput,
  readExampleInput,
  readExampleInputs,
  readExampleInputsSchema,
} from "../inputs";
import { readFunction, validateFunction } from "../function/function";
import z from "zod";
import { formatZodSchema } from "../schema";

function buildExampleInput(value: Functions.Expression.InputValue) {
  const fnRaw = readFunction();
  if (!fnRaw.ok) return { ok: false as const, error: fnRaw.error! };

  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) return { ok: false as const, error: funcResult.error! };

  const func = funcResult.value;
  let compiledTasks: Functions.CompiledTasks;
  try {
    compiledTasks = Functions.compileFunctionTasks(func, value);
  } catch (e) {
    return {
      ok: false as const,
      error: `Failed to compile tasks: ${(e as Error).message}`,
    };
  }

  const outputLength =
    func.type === "vector.function"
      ? Functions.compileFunctionOutputLength(func, value)
      : null;

  return { ok: true as const, value: { value, compiledTasks, outputLength } };
}

export function makeReadExampleInput(state: ToolState) {
  return tool(
    "ReadExampleInput",
    "Read a single example input at a specific index from the Function's example inputs array",
    { index: z.number().int().nonnegative() },
    async ({ index }) => {
      state.hasReadExampleInputs = true;
      return resultFromResult(readExampleInput(index));
    },
  );
}

export function makeReadExampleInputs(state: ToolState) {
  return tool(
    "ReadExampleInputs",
    "Read the Function's example inputs",
    {},
    async () => {
      state.hasReadExampleInputs = true;
      return resultFromResult(readExampleInputs());
    },
  );
}

export function makeReadExampleInputsSchema(state: ToolState) {
  return tool(
    "ReadExampleInputsSchema",
    "Read the schema for Function example inputs",
    {},
    async () => {
      const result = readExampleInputsSchema();
      if (!result.ok) {
        return resultFromResult(result);
      }
      return textResult(formatZodSchema(result.value));
    },
  );
}

export function makeAppendExampleInput(state: ToolState) {
  return tool(
    "AppendExampleInput",
    "Append an example input to the Function's example inputs array. Provide just the input value — compiledTasks and outputLength are computed automatically.",
    { value: Functions.Expression.InputValueSchema },
    async ({ value }) => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      const built = buildExampleInput(value);
      if (!built.ok) return errorResult(built.error);
      return resultFromResult(appendExampleInput(built.value));
    },
  );
}

export function makeEditExampleInput(state: ToolState) {
  return tool(
    "EditExampleInput",
    "Replace an example input at a specific index in the Function's example inputs array. Provide just the input value — compiledTasks and outputLength are computed automatically.",
    {
      index: z.number().int().nonnegative(),
      value: Functions.Expression.InputValueSchema,
    },
    async ({ index, value }) => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      const built = buildExampleInput(value);
      if (!built.ok) return errorResult(built.error);
      return resultFromResult(editExampleInput(index, built.value));
    },
  );
}

export function makeDelExampleInput(state: ToolState) {
  return tool(
    "DelExampleInput",
    "Delete an example input at a specific index from the Function's example inputs array",
    { index: z.number().int().nonnegative() },
    async ({ index }) => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      return resultFromResult(delExampleInput(index));
    },
  );
}

export function makeDelExampleInputs(state: ToolState) {
  return tool(
    "DelExampleInputs",
    "Delete all example inputs from the Function's example inputs array",
    {},
    async () => {
      const err = mustRead(state.hasReadExampleInputs, "example inputs");
      if (err) return errorResult(err);
      return resultFromResult(delExampleInputs());
    },
  );
}

export function makeCheckExampleInputs(state: ToolState) {
  return tool(
    "CheckExampleInputs",
    "Validate the Function's example inputs",
    {},
    async () => resultFromResult(checkExampleInputs()),
  );
}
