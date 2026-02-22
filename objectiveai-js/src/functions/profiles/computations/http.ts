import { ObjectiveAI, RequestOptions } from "../../../client";
import type { Remote } from "../../remote";
import { Stream } from "../../../stream";
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
import { InlineFunction } from "../../function";

export function inlineFunctionCreate(
  client: ObjectiveAI,
  body: FunctionProfileComputationCreateParamsInlineFunctionStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionProfileComputationChunk>>;
export function inlineFunctionCreate(
  client: ObjectiveAI,
  body: FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
  options?: RequestOptions,
): Promise<FunctionProfileComputation>;
export function inlineFunctionCreate(
  client: ObjectiveAI,
  body: FunctionProfileComputationCreateParamsInlineFunction,
  options?: RequestOptions,
): Promise<
  Stream<FunctionProfileComputationChunk> | FunctionProfileComputation
> {
  if (body.stream) {
    return client.post_streaming<FunctionProfileComputationChunk>(
      "/functions/profiles/compute",
      body,
      options,
    );
  }
  return client.post_unary<FunctionProfileComputation>(
    "/functions/profiles/compute",
    body,
    options,
  );
}

export function remoteFunctionCreate(
  client: ObjectiveAI,
  fremote: Remote,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionProfileComputationCreateParamsRemoteFunctionStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionProfileComputationChunk>>;
export function remoteFunctionCreate(
  client: ObjectiveAI,
  fremote: Remote,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionProfileComputationCreateParamsRemoteFunctionNonStreaming,
  options?: RequestOptions,
): Promise<FunctionProfileComputation>;
export function remoteFunctionCreate(
  client: ObjectiveAI,
  fremote: Remote,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionProfileComputationCreateParamsRemoteFunction,
  options?: RequestOptions,
): Promise<
  Stream<FunctionProfileComputationChunk> | FunctionProfileComputation
> {
  const path =
    fcommit !== null && fcommit !== undefined
      ? `/functions/${fremote}/${fowner}/${frepository}/${fcommit}/profiles/compute`
      : `/functions/${fremote}/${fowner}/${frepository}/profiles/compute`;
  if (body.stream) {
    return client.post_streaming<FunctionProfileComputationChunk>(
      path,
      body,
      options,
    );
  }
  return client.post_unary<FunctionProfileComputation>(path, body, options);
}

export function create(
  client: ObjectiveAI,
  function_:
    | InlineFunction
    | {
        remote: Remote;
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionProfileComputationCreateParamsInlineFunctionStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionProfileComputationChunk>>;
export function create(
  client: ObjectiveAI,
  function_:
    | InlineFunction
    | {
        remote: Remote;
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
  options?: RequestOptions,
): Promise<FunctionProfileComputation>;
export function create(
  client: ObjectiveAI,
  function_:
    | InlineFunction
    | {
        remote: Remote;
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionProfileComputationCreateParamsInlineFunction,
  options?: RequestOptions,
): Promise<
  Stream<FunctionProfileComputationChunk> | FunctionProfileComputation
> {
  if ("owner" in function_ && "repository" in function_) {
    const requestBody: FunctionProfileComputationCreateParamsRemoteFunction =
      body;
    if (requestBody.stream) {
      return remoteFunctionCreate(
        client,
        function_.remote,
        function_.owner,
        function_.repository,
        function_.commit ?? null,
        body as FunctionProfileComputationCreateParamsRemoteFunctionStreaming,
        options,
      );
    } else {
      return remoteFunctionCreate(
        client,
        function_.remote,
        function_.owner,
        function_.repository,
        function_.commit ?? null,
        body as FunctionProfileComputationCreateParamsRemoteFunctionNonStreaming,
        options,
      );
    }
  } else {
    const requestBody: FunctionProfileComputationCreateParamsInlineFunction = {
      ...body,
      function: function_,
    };
    if (requestBody.stream) {
      return inlineFunctionCreate(
        client,
        requestBody as FunctionProfileComputationCreateParamsInlineFunctionStreaming,
        options,
      );
    } else {
      return inlineFunctionCreate(
        client,
        requestBody as FunctionProfileComputationCreateParamsInlineFunctionNonStreaming,
        options,
      );
    }
  }
}
