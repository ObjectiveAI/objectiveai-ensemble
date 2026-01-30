import z from "zod";
import { ObjectiveAI, RequestOptions } from "../../client";
import { Stream } from "../../stream";
import { VectorCompletion } from "./response/unary/vector_completion";
import {
  VectorCompletionCreateParams,
  VectorCompletionCreateParamsStreaming,
  VectorCompletionCreateParamsNonStreaming,
} from "./request/vector_completion_create_params";
import { VectorCompletionChunk } from "./response/streaming/vector_completion_chunk";
import { VotesSchema } from "./response/vote";

export function create(
  client: ObjectiveAI,
  body: VectorCompletionCreateParamsStreaming,
  options?: RequestOptions,
): Promise<Stream<VectorCompletionChunk>>;
export function create(
  client: ObjectiveAI,
  body: VectorCompletionCreateParamsNonStreaming,
  options?: RequestOptions,
): Promise<VectorCompletion>;
export function create(
  client: ObjectiveAI,
  body: VectorCompletionCreateParams,
  options?: RequestOptions,
): Promise<Stream<VectorCompletionChunk> | VectorCompletion> {
  if (body.stream) {
    return client.post_streaming<VectorCompletionChunk>(
      "/vector/completions",
      body,
      options,
    );
  }
  return client.post_unary<VectorCompletion>(
    "/vector/completions",
    body,
    options,
  );
}

export const RetrieveSchema = z
  .object({
    data: VotesSchema.optional().nullable(),
  })
  .describe("Response containing votes from a historical vector completion.");
export type Retrieve = z.infer<typeof RetrieveSchema>;

export function retrieve(
  client: ObjectiveAI,
  id: string,
  options?: RequestOptions,
): Promise<Retrieve> {
  return client.get_unary<Retrieve>(
    `/vector/completions/${id}`,
    undefined,
    options,
  );
}
