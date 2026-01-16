import z from "zod";
import { RoleSchema } from "../role";
import { ToolCall, ToolCallSchema } from "./tool_call";
import { ResponseImageSchema, ResponseImage } from "../response_image";
import { merge, mergedString } from "src/merge";

export const DeltaSchema = z
  .object({
    content: z.string().optional().describe("The content added in this delta."),
    refusal: z
      .string()
      .optional()
      .describe("The refusal message added in this delta."),
    role: RoleSchema.optional(),
    tool_calls: z
      .array(ToolCallSchema)
      .optional()
      .describe("Tool calls made in this delta."),
    reasoning: z
      .string()
      .optional()
      .describe("The reasoning added in this delta."),
    images: z
      .array(ResponseImageSchema)
      .optional()
      .describe("Images added in this delta."),
  })
  .describe("A delta in a streaming chat completion response.");
export type Delta = z.infer<typeof DeltaSchema>;

export namespace Delta {
  export function merged(a: Delta, b: Delta): [Delta, boolean] {
    const [content, contentChanged] = merge(a.content, b.content, mergedString);
    const [refusal, refusalChanged] = merge(a.refusal, b.refusal, mergedString);
    const [role, roleChanged] = merge(a.role, b.role);
    const [tool_calls, tool_callsChanged] = merge(
      a.tool_calls,
      b.tool_calls,
      ToolCall.mergedList
    );
    const [reasoning, reasoningChanged] = merge(
      a.reasoning,
      b.reasoning,
      mergedString
    );
    const [images, imagesChanged] = merge(
      a.images,
      b.images,
      ResponseImage.mergedList
    );
    if (
      contentChanged ||
      reasoningChanged ||
      refusalChanged ||
      roleChanged ||
      tool_callsChanged ||
      imagesChanged
    ) {
      return [
        {
          ...(content !== undefined ? { content } : {}),
          ...(reasoning !== undefined ? { reasoning } : {}),
          ...(refusal !== undefined ? { refusal } : {}),
          ...(role !== undefined ? { role } : {}),
          ...(tool_calls !== undefined ? { tool_calls } : {}),
          ...(images !== undefined ? { images } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
