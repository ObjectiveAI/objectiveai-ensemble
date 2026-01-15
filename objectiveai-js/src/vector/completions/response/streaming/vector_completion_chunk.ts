import z from "zod";
import { EnsembleSchema } from "../ensemble";
import { Scores, ScoresSchema } from "../scores";
import { Vote, VotesSchema } from "../vote";
import { Weights, WeightsSchema } from "../weights";
import {
  ChatCompletionChunk,
  ChatCompletionChunkSchema,
} from "./chat_completion_chunk";
import { UsageSchema } from "../usage";
import { ResponseObjectSchema } from "./response_object";
import { merge } from "src/merge";

export const VectorCompletionChunkSchema = z
  .object({
    id: z.string().describe("The unique identifier of the vector completion."),
    completions: z
      .array(ChatCompletionChunkSchema)
      .describe(
        "The list of chat completion chunks created for this vector completion."
      ),
    votes: VotesSchema,
    scores: ScoresSchema,
    weights: WeightsSchema,
    created: z
      .uint32()
      .describe(
        "The Unix timestamp (in seconds) when the vector completion was created."
      ),
    ensemble: EnsembleSchema,
    object: ResponseObjectSchema,
    usage: UsageSchema.optional(),
  })
  .describe("A chunk in a streaming vector completion response.");
export type VectorCompletionChunk = z.infer<typeof VectorCompletionChunkSchema>;

export namespace VectorCompletionChunk {
  export function merged(
    a: VectorCompletionChunk,
    b: VectorCompletionChunk
  ): [VectorCompletionChunk, boolean] {
    const id = a.id;
    const [completions, completionsChanged] = ChatCompletionChunk.mergedList(
      a.completions,
      b.completions
    );
    const [votes, votesChanged] = Vote.mergedList(a.votes, b.votes);
    const [scores, scoresChanged] = Scores.merged(a.scores, b.scores);
    const [weights, weightsChanged] = Weights.merged(a.weights, b.weights);
    const created = a.created;
    const ensemble = a.ensemble;
    const object = a.object;
    const [usage, usageChanged] = merge(a.usage, b.usage);
    if (
      completionsChanged ||
      votesChanged ||
      scoresChanged ||
      weightsChanged ||
      usageChanged
    ) {
      return [
        {
          id,
          completions,
          votes,
          scores,
          weights,
          created,
          ensemble,
          object,
          ...(usage !== undefined ? { usage } : {}),
        },
        true,
      ];
    } else {
      return [a, false];
    }
  }
}
