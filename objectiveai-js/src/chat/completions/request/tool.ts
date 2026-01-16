import { ExpressionSchema } from "src/functions/expression/expression";
import { JsonValueExpressionSchema, JsonValueSchema } from "src/json";
import z from "zod";

export const FunctionToolNameSchema = z
  .string()
  .describe("The name of the function.")
  .meta({ title: "FunctionToolName" });
export type FunctionToolName = z.infer<typeof FunctionToolNameSchema>;

export const FunctionToolNameExpressionSchema = z
  .union([
    FunctionToolNameSchema,
    ExpressionSchema.describe("An expression which evaluates to a string."),
  ])
  .describe(FunctionToolNameSchema.description!)
  .meta({ title: "FunctionToolNameExpression" });
export type FunctionToolNameExpression = z.infer<
  typeof FunctionToolNameExpressionSchema
>;

export const FunctionToolDescriptionSchema = z
  .string()
  .describe("The description of the function.")
  .meta({ title: "FunctionToolDescription" });
export type FunctionToolDescription = z.infer<
  typeof FunctionToolDescriptionSchema
>;

export const FunctionToolDescriptionExpressionSchema = z
  .union([
    FunctionToolDescriptionSchema,
    ExpressionSchema.describe("An expression which evaluates to a string."),
  ])
  .describe(FunctionToolDescriptionSchema.description!)
  .meta({ title: "FunctionToolDescriptionExpression" });
export type FunctionToolDescriptionExpression = z.infer<
  typeof FunctionToolDescriptionExpressionSchema
>;

export const FunctionToolParametersSchema = z
  .record(z.string(), JsonValueSchema)
  .describe("The JSON schema defining the parameters of the function.")
  .meta({ title: "FunctionToolParameters" });
export type FunctionToolParameters = z.infer<
  typeof FunctionToolParametersSchema
>;

export const FunctionToolParametersExpressionSchema = z
  .union([
    z.record(z.string(), JsonValueExpressionSchema),
    ExpressionSchema.describe(
      "An expression which evaluates to a JSON schema object."
    ),
  ])
  .describe(FunctionToolParametersSchema.description!)
  .meta({ title: "FunctionToolParametersExpression" });
export type FunctionToolParametersExpression = z.infer<
  typeof FunctionToolParametersExpressionSchema
>;

export const FunctionToolStrictSchema = z
  .boolean()
  .describe("Whether to enforce strict adherence to the parameter schema.")
  .meta({ title: "FunctionToolStrict" });
export type FunctionToolStrict = z.infer<typeof FunctionToolStrictSchema>;

export const FunctionToolStrictExpressionSchema = z
  .union([
    FunctionToolStrictSchema,
    ExpressionSchema.describe("An expression which evaluates to a boolean."),
  ])
  .describe(FunctionToolStrictSchema.description!)
  .meta({ title: "FunctionToolStrictExpression" });
export type FunctionToolStrictExpression = z.infer<
  typeof FunctionToolStrictExpressionSchema
>;

export const FunctionToolDefinitionSchema = z
  .object({
    name: FunctionToolNameSchema,
    description: FunctionToolDescriptionSchema.optional().nullable(),
    parameters: FunctionToolParametersSchema.optional().nullable(),
    strict: FunctionToolStrictSchema.optional().nullable(),
  })
  .describe("The definition of a function tool.")
  .meta({ title: "FunctionToolDefinition" });
export type FunctionToolDefinition = z.infer<
  typeof FunctionToolDefinitionSchema
>;

export const FunctionToolDefinitionExpressionSchema = z
  .object({
    name: FunctionToolNameExpressionSchema,
    description: FunctionToolDescriptionExpressionSchema.optional().nullable(),
    parameters: FunctionToolParametersExpressionSchema.optional().nullable(),
    strict: FunctionToolStrictExpressionSchema.optional().nullable(),
  })
  .describe(FunctionToolDefinitionSchema.description!)
  .meta({ title: "FunctionToolDefinitionExpression" });
export type FunctionToolDefinitionExpression = z.infer<
  typeof FunctionToolDefinitionExpressionSchema
>;

export const FunctionToolSchema = z
  .object({
    type: z.literal("function"),
    function: FunctionToolDefinitionSchema,
  })
  .describe("A function tool that the assistant can call.")
  .meta({ title: "FunctionTool" });
export type FunctionTool = z.infer<typeof FunctionToolSchema>;

export const FunctionToolExpressionSchema = z
  .object({
    type: z.literal("function"),
    function: FunctionToolDefinitionExpressionSchema,
  })
  .describe(FunctionToolSchema.description!)
  .meta({ title: "FunctionToolExpression" });
export type FunctionToolExpression = z.infer<
  typeof FunctionToolExpressionSchema
>;

export const ToolSchema = z
  .union([FunctionToolSchema])
  .describe("A tool that the assistant can call.")
  .meta({ title: "Tool" });
export type Tool = z.infer<typeof ToolSchema>;

export const ToolExpressionSchema = z
  .union([
    FunctionToolExpressionSchema,
    ExpressionSchema.describe("An expression which evaluates to a tool."),
  ])
  .describe(ToolSchema.description!)
  .meta({ title: "ToolExpression" });
export type ToolExpression = z.infer<typeof ToolExpressionSchema>;

export const ToolsSchema = z
  .array(ToolSchema)
  .describe("A list of tools that the assistant can call.")
  .meta({ title: "Tools" });
export type Tools = z.infer<typeof ToolsSchema>;

export const ToolsExpressionSchema = z
  .union([
    z
      .array(ToolExpressionSchema)
      .describe(ToolsSchema.description!)
      .meta({ title: "ToolExpressions" }),
    ExpressionSchema.describe(
      "An expression which evaluates to an array of tools."
    ),
  ])
  .describe(ToolsSchema.description!)
  .meta({ title: "ToolsExpression" });
export type ToolsExpression = z.infer<typeof ToolsExpressionSchema>;
