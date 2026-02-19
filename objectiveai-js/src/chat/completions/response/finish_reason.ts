import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const FinishReasonSchema = z
  .enum(["stop", "length", "tool_calls", "content_filter", "error"])
  .describe("The reason why the assistant ceased to generate further tokens.");
export type FinishReason = z.infer<typeof FinishReasonSchema>;
export const FinishReasonJsonSchema: JSONSchema = convert(FinishReasonSchema);
