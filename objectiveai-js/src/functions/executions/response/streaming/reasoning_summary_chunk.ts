import {
  ChatCompletionChunk,
  ChatCompletionChunkSchema,
} from "src/chat/completions/response/streaming/chat_completion_chunk";
import { ObjectiveAIErrorSchema } from "src/error";
import { merge } from "src/merge";
import z from "zod";

export const ReasoningSummaryChunkSchema = ChatCompletionChunkSchema.extend({
  error: ObjectiveAIErrorSchema.optional().describe(
    "When present, indicates that an error occurred during the chat completion."
  ),
}).describe("A chunk of a reasoning summary generation.");
export type ReasoningSummaryChunk = z.infer<typeof ReasoningSummaryChunkSchema>;

export namespace ReasoningSummaryChunk {
  export function merged(
    a: ReasoningSummaryChunk,
    b: ReasoningSummaryChunk
  ): [ReasoningSummaryChunk, boolean] {
    const [base, baseChanged] = ChatCompletionChunk.merged(a, b);
    const [error, errorChanged] = merge(a.error, b.error);
    if (baseChanged || errorChanged) {
      return [
        {
          ...base,
          ...(error !== undefined ? { error } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
