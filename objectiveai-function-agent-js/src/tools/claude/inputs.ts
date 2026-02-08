import { tool } from "@anthropic-ai/claude-agent-sdk";
import { resultFromResult, textResult } from "./util";
import {
  appendExampleInput,
  checkExampleInputs,
  delExampleInput,
  editExampleInput,
  readExampleInputs,
  readExampleInputsSchema,
} from "../inputs";
import z from "zod";
import { formatZodSchema } from "../schema";

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
  "Append an example input to the Function's example inputs array",
  { value: z.record(z.string(), z.unknown()) },
  async ({ value }) => resultFromResult(appendExampleInput(value)),
);

export const EditExampleInput = tool(
  "EditExampleInput",
  "Replace an example input at a specific index in the Function's example inputs array",
  {
    index: z.number().int().nonnegative(),
    value: z.record(z.string(), z.unknown()),
  },
  async ({ index, value }) => resultFromResult(editExampleInput(index, value)),
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
