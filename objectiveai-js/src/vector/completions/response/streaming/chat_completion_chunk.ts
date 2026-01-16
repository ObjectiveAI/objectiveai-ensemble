import {
  ChatCompletionChunkSchema as SuperChatCompletionChunkSchema,
  ChatCompletionChunk as SuperChatCompletionChunk,
} from "src/chat/completions/response/streaming/chat_completion_chunk";
import { ObjectiveAIErrorSchema } from "src/error";
import { merge } from "src/merge";
import z from "zod";

export const ChatCompletionChunkSchema = SuperChatCompletionChunkSchema.extend({
  index: z
    .uint32()
    .describe("The index of the completion amongst all chat completions."),
  error: ObjectiveAIErrorSchema.optional().describe(
    "An error encountered during the generation of this chat completion."
  ),
}).describe(
  "A chat completion chunk generated in the pursuit of a vector completion."
);
export type ChatCompletionChunk = z.infer<typeof ChatCompletionChunkSchema>;

export namespace ChatCompletionChunk {
  export function merged(
    a: ChatCompletionChunk,
    b: ChatCompletionChunk
  ): [ChatCompletionChunk, boolean] {
    const index = a.index;
    const [base, baseChanged] = SuperChatCompletionChunk.merged(a, b);
    const [error, errorChanged] = merge(a.error, b.error);
    if (baseChanged || errorChanged) {
      return [
        {
          index,
          ...base,
          ...(error !== undefined ? { error } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }

  export function mergedList(
    a: ChatCompletionChunk[],
    b: ChatCompletionChunk[]
  ): [ChatCompletionChunk[], boolean] {
    let merged: ChatCompletionChunk[] | undefined = undefined;
    for (const chunk of b) {
      const existingIndex = a.findIndex(({ index }) => index === chunk.index);
      if (existingIndex === -1) {
        if (merged === undefined) {
          merged = [...a, chunk];
        } else {
          merged.push(chunk);
        }
      } else {
        const [mergedChunk, chunkChanged] = ChatCompletionChunk.merged(
          a[existingIndex],
          chunk
        );
        if (chunkChanged) {
          if (merged === undefined) {
            merged = [...a];
          }
          merged[existingIndex] = mergedChunk;
        }
      }
    }
    return merged ? [merged, true] : [a, false];
  }
}
