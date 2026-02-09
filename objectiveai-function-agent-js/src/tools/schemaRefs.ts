import { Chat, Functions, JsonValueSchema, JsonValueExpressionSchema } from "objectiveai";
import { registerLazyRef, registerPropertyRefs, registerSchemaRef } from "./schema";
import { readInputSchemaSchema } from "./function/inputSchema";

let registered = false;

/**
 * Registers all schema refs (lazy type refs and property refs) used by
 * formatZodSchema. Call once before any schema formatting happens.
 */
export function registerSchemaRefs(): void {
  if (registered) return;
  registered = true;

  // Lazy type refs — when formatZodSchema encounters these z.lazy schemas,
  // it emits $ref to the corresponding MCP tool name.
  registerLazyRef(JsonValueSchema, "ReadJsonValueSchema");
  registerLazyRef(JsonValueExpressionSchema, "ReadJsonValueExpressionSchema");
  registerLazyRef(Functions.Expression.InputValueSchema, "ReadInputValueSchema");
  registerLazyRef(Functions.Expression.InputValueExpressionSchema, "ReadInputValueExpressionSchema");
  registerLazyRef(readInputSchemaSchema(), "ReadInputSchemaSchema");

  // Property refs — when formatZodSchema encounters these parent schemas,
  // properties with refs emit $ref instead of inlining.
  const scalarPropertyRefs: Record<string, string> = {
    type: "ReadTypeSchema",
    description: "ReadDescriptionSchema",
    input_schema: "ReadInputSchemaSchema",
    input_maps: "ReadInputMapsSchema",
    tasks: "ReadTasksSchema",
  };
  const vectorPropertyRefs: Record<string, string> = {
    ...scalarPropertyRefs,
    output_length: "ReadOutputLengthSchema",
    input_split: "ReadInputSplitSchema",
    input_merge: "ReadInputMergeSchema",
  };
  registerPropertyRefs(Functions.RemoteScalarFunctionSchema, scalarPropertyRefs);
  registerPropertyRefs(Functions.RemoteVectorFunctionSchema, vectorPropertyRefs);
  registerPropertyRefs(Functions.VectorCompletionTaskExpressionSchema, {
    messages: "ReadMessagesExpressionSchema",
    tools: "ReadToolsExpressionSchema",
    responses: "ReadResponsesExpressionSchema",
  });
  const functionTaskInputRef = { input: "ReadInputValueExpressionSchema" };
  registerPropertyRefs(Functions.ScalarFunctionTaskExpressionSchema, functionTaskInputRef);
  registerPropertyRefs(Functions.VectorFunctionTaskExpressionSchema, functionTaskInputRef);

  // Direct schema refs — when formatZodSchema encounters these exact schema
  // instances as children, it emits $ref to the corresponding MCP tool name.
  const Request = Chat.Completions.Request;

  // Expression variants — used in task definition contexts.
  registerSchemaRef(Request.DeveloperMessageExpressionSchema, "ReadDeveloperMessageExpressionSchema");
  registerSchemaRef(Request.SystemMessageExpressionSchema, "ReadSystemMessageExpressionSchema");
  registerSchemaRef(Request.UserMessageExpressionSchema, "ReadUserMessageExpressionSchema");
  registerSchemaRef(Request.ToolMessageExpressionSchema, "ReadToolMessageExpressionSchema");
  registerSchemaRef(Request.AssistantMessageExpressionSchema, "ReadAssistantMessageExpressionSchema");
  registerSchemaRef(Request.SimpleContentExpressionSchema, "ReadSimpleContentExpressionSchema");
  registerSchemaRef(Request.RichContentExpressionSchema, "ReadRichContentExpressionSchema");
  registerSchemaRef(Functions.ScalarFunctionTaskExpressionSchema, "ReadScalarFunctionTaskSchema");
  registerSchemaRef(Functions.VectorFunctionTaskExpressionSchema, "ReadVectorFunctionTaskSchema");
  registerSchemaRef(Functions.VectorCompletionTaskExpressionSchema, "ReadVectorCompletionTaskSchema");

  // Non-expression (compiled) variants — used in CompiledTasksSchema (within ExampleInputs).
  registerSchemaRef(Request.DeveloperMessageSchema, "ReadDeveloperMessageSchema");
  registerSchemaRef(Request.SystemMessageSchema, "ReadSystemMessageSchema");
  registerSchemaRef(Request.UserMessageSchema, "ReadUserMessageSchema");
  registerSchemaRef(Request.ToolMessageSchema, "ReadToolMessageSchema");
  registerSchemaRef(Request.AssistantMessageSchema, "ReadAssistantMessageSchema");
  registerSchemaRef(Request.SimpleContentSchema, "ReadSimpleContentSchema");
  registerSchemaRef(Request.RichContentSchema, "ReadRichContentSchema");

  // Compiled task type schemas — separate tools from expression variants because
  // compiled tasks have different structure (owner/repo/commit vs skip/map).
  registerSchemaRef(Functions.ScalarFunctionTaskSchema, "ReadCompiledScalarFunctionTaskSchema");
  registerSchemaRef(Functions.VectorFunctionTaskSchema, "ReadCompiledVectorFunctionTaskSchema");
  registerSchemaRef(Functions.VectorCompletionTaskSchema, "ReadCompiledVectorCompletionTaskSchema");

  // Property refs on compiled task schemas — keep tool output compact.
  const compiledFunctionTaskInputRef = { input: "ReadInputValueSchema" };
  registerPropertyRefs(Functions.ScalarFunctionTaskSchema, compiledFunctionTaskInputRef);
  registerPropertyRefs(Functions.VectorFunctionTaskSchema, compiledFunctionTaskInputRef);
}
