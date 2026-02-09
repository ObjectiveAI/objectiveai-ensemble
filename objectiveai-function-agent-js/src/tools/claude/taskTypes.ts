import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Functions } from "objectiveai";
import { formatZodSchema } from "../schema";

export const ReadScalarFunctionTaskSchema = tool(
  "ReadScalarFunctionTaskSchema",
  "Read the schema for a scalar.function task",
  {},
  async () => textResult(formatZodSchema(Functions.ScalarFunctionTaskExpressionSchema)),
);

export const ReadVectorFunctionTaskSchema = tool(
  "ReadVectorFunctionTaskSchema",
  "Read the schema for a vector.function task",
  {},
  async () => textResult(formatZodSchema(Functions.VectorFunctionTaskExpressionSchema)),
);

export const ReadVectorCompletionTaskSchema = tool(
  "ReadVectorCompletionTaskSchema",
  "Read the schema for a vector.completion task",
  {},
  async () => textResult(formatZodSchema(Functions.VectorCompletionTaskExpressionSchema)),
);

// Compiled (non-expression) task type tools — used in ExampleInputs context.
// Compiled tasks have expressions already resolved: function tasks have
// owner/repository/commit/input instead of skip/map/input-expression.

export const ReadCompiledScalarFunctionTaskSchema = tool(
  "ReadCompiledScalarFunctionTaskSchema",
  "Read the schema for a compiled scalar.function task (used in compiledTasks within ExampleInputs)",
  {},
  async () => textResult(formatZodSchema(Functions.ScalarFunctionTaskSchema)),
);

export const ReadCompiledVectorFunctionTaskSchema = tool(
  "ReadCompiledVectorFunctionTaskSchema",
  "Read the schema for a compiled vector.function task (used in compiledTasks within ExampleInputs)",
  {},
  async () => textResult(formatZodSchema(Functions.VectorFunctionTaskSchema)),
);

export const ReadCompiledVectorCompletionTaskSchema = tool(
  "ReadCompiledVectorCompletionTaskSchema",
  "Read the schema for a compiled vector.completion task (used in compiledTasks within ExampleInputs)",
  {},
  async () => textResult(formatZodSchema(Functions.VectorCompletionTaskSchema)),
);
