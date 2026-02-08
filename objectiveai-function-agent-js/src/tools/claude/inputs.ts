import { tool } from "@anthropic-ai/claude-agent-sdk";
import { Functions } from "objectiveai";
import { resultFromResult, textResult, errorResult } from "./util";
import {
  appendExampleInput,
  checkExampleInputs,
  delExampleInput,
  editExampleInput,
  readExampleInputs,
  readExampleInputsSchema,
} from "../inputs";
import { readFunction, validateFunction } from "../function/function";
import z from "zod";
import { formatZodSchema } from "../schema";

function buildExampleInput(value: Record<string, unknown>) {
  const fnRaw = readFunction();
  if (!fnRaw.ok) return { ok: false as const, error: fnRaw.error! };

  const funcResult = validateFunction(fnRaw.value);
  if (!funcResult.ok) return { ok: false as const, error: funcResult.error! };

  const func = funcResult.value;
  let compiledTasks: Functions.CompiledTasks;
  try {
    compiledTasks = Functions.compileFunctionTasks(func, value);
  } catch (e) {
    return { ok: false as const, error: `Failed to compile tasks: ${(e as Error).message}` };
  }

  const outputLength = func.type === "vector.function"
    ? Functions.compileFunctionOutputLength(func, value)
    : null;

  return { ok: true as const, value: { value, compiledTasks, outputLength } };
}

export const ReadExampleInputs = tool(
  "ReadExampleInputs",
  "Read the Function's example inputs",
  {},
  async () => resultFromResult(readExampleInputs()),
);

export const ReadExampleInputsSchema = tool(
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

export const AppendExampleInput = tool(
  "AppendExampleInput",
  "Append an example input to the Function's example inputs array. Provide just the input value — compiledTasks and outputLength are computed automatically.",
  { value: z.record(z.string(), z.unknown()) },
  async ({ value }) => {
    const built = buildExampleInput(value);
    if (!built.ok) return errorResult(built.error);
    return resultFromResult(appendExampleInput(built.value));
  },
);

export const EditExampleInput = tool(
  "EditExampleInput",
  "Replace an example input at a specific index in the Function's example inputs array. Provide just the input value — compiledTasks and outputLength are computed automatically.",
  {
    index: z.number().int().nonnegative(),
    value: z.record(z.string(), z.unknown()),
  },
  async ({ index, value }) => {
    const built = buildExampleInput(value);
    if (!built.ok) return errorResult(built.error);
    return resultFromResult(editExampleInput(index, built.value));
  },
);

export const DelExampleInput = tool(
  "DelExampleInput",
  "Delete an example input at a specific index from the Function's example inputs array",
  { index: z.number().int().nonnegative() },
  async ({ index }) => resultFromResult(delExampleInput(index)),
);

export const CheckExampleInputs = tool(
  "CheckExampleInputs",
  "Validate the Function's example inputs",
  {},
  async () => resultFromResult(checkExampleInputs()),
);
