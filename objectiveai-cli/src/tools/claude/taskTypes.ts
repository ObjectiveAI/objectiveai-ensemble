import { tool } from "@anthropic-ai/claude-agent-sdk";
import { textResult } from "./util";
import { Functions } from "objectiveai";
import { formatZodSchema } from "../schema";
import { ToolState } from "./toolState";

export function makeReadScalarFunctionTaskSchema(state: ToolState) {
  return tool(
    "ReadScalarFunctionTaskSchema",
    "Read the schema for a scalar.function task",
    {},
    async () => textResult(formatZodSchema(Functions.ScalarFunctionTaskExpressionSchema)),
  );
}

export function makeReadVectorFunctionTaskSchema(state: ToolState) {
  return tool(
    "ReadVectorFunctionTaskSchema",
    "Read the schema for a vector.function task",
    {},
    async () => textResult(formatZodSchema(Functions.VectorFunctionTaskExpressionSchema)),
  );
}

export function makeReadVectorCompletionTaskSchema(state: ToolState) {
  return tool(
    "ReadVectorCompletionTaskSchema",
    "Read the schema for a vector.completion task",
    {},
    async () => textResult(formatZodSchema(Functions.VectorCompletionTaskExpressionSchema)),
  );
}

// Compiled (non-expression) task type tools — used in ExampleInputs context.
// Compiled tasks have expressions already resolved: function tasks have
// owner/repository/commit/input instead of skip/map/input-expression.

export function makeReadCompiledScalarFunctionTaskSchema(state: ToolState) {
  return tool(
    "ReadCompiledScalarFunctionTaskSchema",
    "Read the schema for a compiled scalar.function task (used in compiledTasks within ExampleInputs)",
    {},
    async () => textResult(formatZodSchema(Functions.ScalarFunctionTaskSchema)),
  );
}

export function makeReadCompiledVectorFunctionTaskSchema(state: ToolState) {
  return tool(
    "ReadCompiledVectorFunctionTaskSchema",
    "Read the schema for a compiled vector.function task (used in compiledTasks within ExampleInputs)",
    {},
    async () => textResult(formatZodSchema(Functions.VectorFunctionTaskSchema)),
  );
}

export function makeReadCompiledVectorCompletionTaskSchema(state: ToolState) {
  return tool(
    "ReadCompiledVectorCompletionTaskSchema",
    "Read the schema for a compiled vector.completion task (used in compiledTasks within ExampleInputs)",
    {},
    async () => textResult(formatZodSchema(Functions.VectorCompletionTaskSchema)),
  );
}
