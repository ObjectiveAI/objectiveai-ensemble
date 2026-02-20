import z from "zod";
import { ChatCompletionSchema } from "./chat_completion";
import { VotesSchema } from "../vote";
import { ScoresSchema } from "../scores";
import { WeightsSchema } from "../weights";
import { EnsembleSchema } from "../ensemble";
import { UsageSchema } from "../usage";
import { convert, type JSONSchema } from "../../../../json_schema";

export const VectorCompletionSchema = z
  .object({
    id: z.string().describe("The unique identifier of the vector completion."),
    completions: z
      .array(ChatCompletionSchema)
      .describe(
        "The list of chat completions created for this vector completion."
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
    object: z.literal("vector.completion"),
    usage: UsageSchema,
  })
  .describe("A unary vector completion response.");
export type VectorCompletion = z.infer<typeof VectorCompletionSchema>;
export const VectorCompletionJsonSchema: JSONSchema = convert(VectorCompletionSchema);
