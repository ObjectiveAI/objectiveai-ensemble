import OpenAI from "openai";
import { VectorCompletion } from "./response/unary/vector_completion";
import { Stream } from "openai/streaming";
import {
  VectorCompletionCreateParams,
  VectorCompletionCreateParamsStreaming,
} from "./request/vector_completion_create_params";
import { VectorCompletionChunk } from "./response/streaming/vector_completion_chunk";

export async function create(
  openai: OpenAI,
  body: VectorCompletionCreateParamsStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<VectorCompletionChunk>>;
export async function create(
  openai: OpenAI,
  body: VectorCompletionCreateParams,
  options?: OpenAI.RequestOptions
): Promise<VectorCompletion>;
export async function create(
  openai: OpenAI,
  body: VectorCompletionCreateParams,
  options?: OpenAI.RequestOptions
): Promise<Stream<VectorCompletionChunk> | VectorCompletion> {
  const response = await openai.post("/vector/completions", {
    body,
    stream: body.stream ?? false,
    ...options,
  });
  return response as Stream<VectorCompletionChunk> | VectorCompletion;
}
