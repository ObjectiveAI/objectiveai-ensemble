import OpenAI from "openai";
import { ChatCompletion } from "./response/unary/chat_completion";
import { Stream } from "openai/streaming";
import { ObjectiveAIError } from "src/error";
import {
  ChatCompletionCreateParams,
  ChatCompletionCreateParamsStreaming,
} from "./request/chat_completion_create_params";
import { ChatCompletionChunk } from "./response/streaming/chat_completion_chunk";

export async function create(
  openai: OpenAI,
  body: ChatCompletionCreateParamsStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<ChatCompletionChunk | ObjectiveAIError>>;
export async function create(
  openai: OpenAI,
  body: ChatCompletionCreateParamsStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<ChatCompletionChunk | ObjectiveAIError>>;
export async function create(
  openai: OpenAI,
  body: ChatCompletionCreateParams,
  options?: OpenAI.RequestOptions
): Promise<Stream<ChatCompletionChunk | ObjectiveAIError> | ChatCompletion> {
  const response = await openai.post("/chat/completions", {
    body,
    stream: body.stream ?? false,
    ...options,
  });
  return response as
    | Stream<ChatCompletionChunk | ObjectiveAIError>
    | ChatCompletion;
}
