import { FunctionProfileComputationChunk } from "./response/streaming/function_profile_computation_chunk";
import { FunctionProfileComputation } from "./response/unary/function_profile_computation";
import {
  FunctionProfileComputationCreateParamsInlineFunction,
  FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
  FunctionProfileComputationCreateParamsInlineFunctionStreaming,
  FunctionProfileComputationCreateParamsRemoteFunction,
  FunctionProfileComputationCreateParamsRemoteFunctionNonStreaming,
  FunctionProfileComputationCreateParamsRemoteFunctionStreaming,
} from "./request/function_profile_computation_create_params";
import { InlineFunction } from "src/functions/function";
import { Stream } from "openai/streaming";
import OpenAI from "openai";

export async function inlineFunctionCreate(
  openai: OpenAI,
  body: FunctionProfileComputationCreateParamsInlineFunctionStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionProfileComputationChunk>>;
export async function inlineFunctionCreate(
  openai: OpenAI,
  body: FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionProfileComputation>;
export async function inlineFunctionCreate(
  openai: OpenAI,
  body: FunctionProfileComputationCreateParamsInlineFunction,
  options?: OpenAI.RequestOptions
): Promise<
  Stream<FunctionProfileComputationChunk> | FunctionProfileComputation
> {
  const response = await openai.post("/functions/profiles/compute", {
    body,
    stream: body.stream ?? false,
    ...options,
  });
  return response as
    | Stream<FunctionProfileComputationChunk>
    | FunctionProfileComputation;
}

export async function remoteFunctionCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionProfileComputationCreateParamsRemoteFunctionStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionProfileComputationChunk>>;
export async function remoteFunctionCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionProfileComputationCreateParamsRemoteFunctionNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionProfileComputation>;
export async function remoteFunctionCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionProfileComputationCreateParamsRemoteFunction,
  options?: OpenAI.RequestOptions
): Promise<
  Stream<FunctionProfileComputationChunk> | FunctionProfileComputation
> {
  const response = await openai.post(
    fcommit !== null && fcommit !== undefined
      ? `/functions/${fowner}/${frepository}/${fcommit}/profiles/compute`
      : `/functions/${fowner}/${frepository}/profiles/compute`,
    {
      body,
      stream: body.stream ?? false,
      ...options,
    }
  );
  return response as
    | Stream<FunctionProfileComputationChunk>
    | FunctionProfileComputation;
}

export async function create(
  openai: OpenAI,
  function_:
    | InlineFunction
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionProfileComputationCreateParamsInlineFunctionStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionProfileComputationChunk>>;
export async function create(
  openai: OpenAI,
  function_:
    | InlineFunction
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionProfileComputation>;
export async function create(
  openai: OpenAI,
  function_:
    | InlineFunction
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionProfileComputationCreateParamsInlineFunction,
  options?: OpenAI.RequestOptions
): Promise<
  Stream<FunctionProfileComputationChunk> | FunctionProfileComputation
> {
  if ("owner" in function_ && "repository" in function_) {
    const requestBody: FunctionProfileComputationCreateParamsRemoteFunction =
      body;
    if (requestBody.stream) {
      return remoteFunctionCreate(
        openai,
        function_.owner,
        function_.repository,
        function_.commit ?? null,
        body as FunctionProfileComputationCreateParamsRemoteFunctionStreaming,
        options
      );
    } else {
      return remoteFunctionCreate(
        openai,
        function_.owner,
        function_.repository,
        function_.commit ?? null,
        body as FunctionProfileComputationCreateParamsRemoteFunctionNonStreaming,
        options
      );
    }
  } else {
    const requestBody: FunctionProfileComputationCreateParamsInlineFunction = {
      ...body,
      function: function_,
    };
    if (requestBody.stream) {
      return inlineFunctionCreate(
        openai,
        requestBody as FunctionProfileComputationCreateParamsInlineFunctionStreaming,
        options
      );
    } else {
      return inlineFunctionCreate(
        openai,
        requestBody as FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
        options
      );
    }
  }
}
