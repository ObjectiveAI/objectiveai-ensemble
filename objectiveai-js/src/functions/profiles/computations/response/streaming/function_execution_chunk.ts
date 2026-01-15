import {
  FunctionExecutionChunkSchema as SuperFunctionExecutionChunkSchema,
  FunctionExecutionChunk as SuperFunctionExecutionChunk,
} from "src/functions/executions/response/streaming/function_execution_chunk";
import z from "zod";

export const FunctionExecutionChunkSchema =
  SuperFunctionExecutionChunkSchema.extend({
    index: z
      .uint32()
      .describe(
        "The index of the function execution chunk in the list of executions."
      ),
    dataset: z
      .uint32()
      .describe(
        "The index of the dataset item this function execution chunk corresponds to."
      ),
    n: z
      .uint32()
      .describe(
        "The N index for this function execution chunk. There will be N function executions, and N comes from the request parameters."
      ),
    retry: z
      .uint32()
      .describe(
        "The retry index for this function execution chunk. There may be multiple retries for a given dataset item and N index."
      ),
  }).describe(
    "A chunk of a function execution ran during profile computation."
  );
export type FunctionExecutionChunk = z.infer<
  typeof FunctionExecutionChunkSchema
>;

export namespace FunctionExecutionChunk {
  export function merged(
    a: FunctionExecutionChunk,
    b: FunctionExecutionChunk
  ): [FunctionExecutionChunk, boolean] {
    const index = a.index;
    const dataset = a.dataset;
    const n = a.n;
    const retry = a.retry;
    const [base, baseChanged] = SuperFunctionExecutionChunk.merged(a, b);
    if (baseChanged) {
      return [
        {
          index,
          dataset,
          n,
          retry,
          ...base,
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }

  export function mergedList(
    a: FunctionExecutionChunk[],
    b: FunctionExecutionChunk[]
  ): [FunctionExecutionChunk[], boolean] {
    let merged: FunctionExecutionChunk[] | undefined = undefined;
    for (const chunk of b) {
      const existingIndex = a.findIndex(({ index }) => index === chunk.index);
      if (existingIndex === -1) {
        if (merged === undefined) {
          merged = [...a, chunk];
        } else {
          merged.push(chunk);
        }
      } else {
        const [mergedChunk, chunkChanged] = FunctionExecutionChunk.merged(
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
