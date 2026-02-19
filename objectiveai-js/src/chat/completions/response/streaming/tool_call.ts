import { merge, mergedString } from "src/merge";
import z from "zod";
import { convert, type JSONSchema } from "../../../../json_schema";

export const FunctionToolCallDefinitionSchema = z.object({
  name: z.string().optional().describe("The name of the function."),
  arguments: z
    .string()
    .optional()
    .describe("The arguments passed to the function."),
});
export type FunctionToolCallDefinition = z.infer<
  typeof FunctionToolCallDefinitionSchema
>;
export const FunctionToolCallDefinitionJsonSchema: JSONSchema = convert(
  FunctionToolCallDefinitionSchema,
);

export namespace FunctionToolCallDefinition {
  export function merged(
    a: FunctionToolCallDefinition,
    b: FunctionToolCallDefinition
  ): [FunctionToolCallDefinition, boolean] {
    const [name, nameChanged] = merge(a.name, b.name);
    const [arguments_, argumentsChanged] = merge(
      a.arguments,
      b.arguments,
      mergedString
    );
    if (nameChanged || argumentsChanged) {
      return [
        {
          ...(name !== undefined ? { name } : {}),
          ...(arguments_ !== undefined ? { arguments: arguments_ } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}

export const FunctionToolCallSchema = z
  .object({
    index: z
      .uint32()
      .describe("The index of the tool call in the sequence of tool calls."),
    type: z.literal("function").optional(),
    id: z
      .string()
      .optional()
      .describe("The unique identifier of the function tool."),
    function: FunctionToolCallDefinitionSchema.optional(),
  })
  .describe("A function tool call made by the assistant.");
export type FunctionToolCall = z.infer<typeof FunctionToolCallSchema>;
export const FunctionToolCallJsonSchema: JSONSchema = convert(
  FunctionToolCallSchema,
);

export namespace FunctionToolCall {
  export function merged(
    a: FunctionToolCall,
    b: FunctionToolCall
  ): [FunctionToolCall, boolean] {
    const index = a.index;
    const [type, typeChanged] = merge(a.type, b.type);
    const [id, idChanged] = merge(a.id, b.id);
    const [function_, functionChanged] = merge(
      a.function,
      b.function,
      FunctionToolCallDefinition.merged
    );
    if (idChanged || functionChanged || typeChanged) {
      return [
        {
          index,
          ...(id !== undefined ? { id } : {}),
          ...(function_ !== undefined ? { function: function_ } : {}),
          ...(type !== undefined ? { type } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}

export const ToolCallSchema = z
  .union([FunctionToolCallSchema])
  .describe("A tool call made by the assistant.");
export type ToolCall = z.infer<typeof ToolCallSchema>;
export const ToolCallJsonSchema: JSONSchema = convert(ToolCallSchema);

export namespace ToolCall {
  export function merged(a: ToolCall, b: ToolCall): [ToolCall, boolean] {
    return FunctionToolCall.merged(a, b);
  }

  export function mergedList(
    a: ToolCall[],
    b: ToolCall[]
  ): [ToolCall[], boolean] {
    let merged: ToolCall[] | undefined = undefined;
    for (const toolCall of b) {
      const existingIndex = a.findIndex(
        ({ index }) => index === toolCall.index
      );
      if (existingIndex === -1) {
        if (merged === undefined) {
          merged = [...a, toolCall];
        } else {
          merged.push(toolCall);
        }
      } else {
        const [mergedToolCall, toolCallChanged] = ToolCall.merged(
          a[existingIndex],
          toolCall
        );
        if (toolCallChanged) {
          if (merged === undefined) {
            merged = [...a];
          }
          merged[existingIndex] = mergedToolCall;
        }
      }
    }
    return merged ? [merged, true] : [a, false];
  }
}
