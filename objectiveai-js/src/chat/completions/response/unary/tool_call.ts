import z from "zod";

export const FunctionToolCallDefinitionSchema = z.object({
  name: z.string().describe("The name of the function."),
  arguments: z.string().describe("The arguments passed to the function."),
});
export type FunctionToolCallDefinition = z.infer<
  typeof FunctionToolCallDefinitionSchema
>;

export const FunctionToolCallSchema = z
  .object({
    type: z.literal("function"),
    id: z.string().describe("The unique identifier of the function tool."),
    function: FunctionToolCallDefinitionSchema.optional(),
  })
  .describe("A function tool call made by the assistant.");
export type FunctionToolCall = z.infer<typeof FunctionToolCallSchema>;

export const ToolCallSchema = z
  .union([FunctionToolCallSchema])
  .describe("A tool call made by the assistant.");
export type ToolCall = z.infer<typeof ToolCallSchema>;
