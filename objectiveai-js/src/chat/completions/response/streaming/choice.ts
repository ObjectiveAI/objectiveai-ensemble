import z from "zod";
import { Delta, DeltaSchema } from "./delta";
import { FinishReasonSchema } from "../finish_reason";
import { Logprobs, LogprobsSchema } from "../logprobs";
import { merge } from "src/merge";

export const ChoiceSchema = z
  .object({
    delta: DeltaSchema,
    finish_reason: FinishReasonSchema.optional(),
    index: z
      .uint32()
      .describe("The index of the choice in the list of choices."),
    logprobs: LogprobsSchema.optional(),
  })
  .describe("A choice in a streaming chat completion response.");
export type Choice = z.infer<typeof ChoiceSchema>;

export namespace Choice {
  export function merged(a: Choice, b: Choice): [Choice, boolean] {
    const [delta, deltaChanged] = merge(a.delta, b.delta, Delta.merged);
    const [finish_reason, finish_reasonChanged] = merge(
      a.finish_reason,
      b.finish_reason
    );
    const index = a.index;
    const [logprobs, logprobsChanged] = merge(
      a.logprobs,
      b.logprobs,
      Logprobs.merged
    );
    if (deltaChanged || finish_reasonChanged || logprobsChanged) {
      return [
        {
          delta,
          finish_reason,
          index,
          ...(logprobs !== undefined ? { logprobs } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }

  export function mergedList(a: Choice[], b: Choice[]): [Choice[], boolean] {
    let merged: Choice[] | undefined = undefined;
    for (const choice of b) {
      const existingIndex = a.findIndex(({ index }) => index === choice.index);
      if (existingIndex === -1) {
        if (merged === undefined) {
          merged = [...a, choice];
        } else {
          merged.push(choice);
        }
      } else {
        const [mergedChoice, choiceChanged] = Choice.merged(
          a[existingIndex],
          choice
        );
        if (choiceChanged) {
          if (merged === undefined) {
            merged = [...a];
          }
          merged[existingIndex] = mergedChoice;
        }
      }
    }
    return merged ? [merged, true] : [a, false];
  }
}
