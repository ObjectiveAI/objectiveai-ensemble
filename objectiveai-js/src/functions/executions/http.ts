import { ObjectiveAI, RequestOptions } from "../../client";
import { Stream } from "../../stream";
import { FunctionExecutionChunk } from "./response/streaming/function_execution_chunk";
import { FunctionExecution } from "./response/unary/function_execution";
import {
  FunctionExecutionCreateParamsInlineFunctionInlineProfile,
  FunctionExecutionCreateParamsInlineFunctionInlineProfileStreaming,
  FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreaming,
  FunctionExecutionCreateParamsRemoteFunctionInlineProfile,
  FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreaming,
  FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreaming,
  FunctionExecutionCreateParamsInlineFunctionRemoteProfile,
  FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreaming,
  FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreaming,
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfile,
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming,
  FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreaming,
} from "./request/function_execution_create_params";
import { InlineFunction } from "../function";
import { InlineProfile } from "../profile";

export function inlineFunctionInlineProfileCreate(
  client: ObjectiveAI,
  body: FunctionExecutionCreateParamsInlineFunctionInlineProfileStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk>>;
export function inlineFunctionInlineProfileCreate(
  client: ObjectiveAI,
  body: FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreaming,
  options?: RequestOptions,
): Promise<FunctionExecution>;
export function inlineFunctionInlineProfileCreate(
  client: ObjectiveAI,
  body: FunctionExecutionCreateParamsInlineFunctionInlineProfile,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  if (body.stream) {
    return client.post_streaming<FunctionExecutionChunk>(
      "/functions",
      body,
      options,
    );
  }
  return client.post_unary<FunctionExecution>("/functions", body, options);
}

export function remoteFunctionInlineProfileCreate(
  client: ObjectiveAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk>>;
export function remoteFunctionInlineProfileCreate(
  client: ObjectiveAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreaming,
  options?: RequestOptions,
): Promise<FunctionExecution>;
export function remoteFunctionInlineProfileCreate(
  client: ObjectiveAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionInlineProfile,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  const path =
    fcommit !== null && fcommit !== undefined
      ? `/functions/${fowner}/${frepository}/${fcommit}`
      : `/functions/${fowner}/${frepository}`;
  if (body.stream) {
    return client.post_streaming<FunctionExecutionChunk>(path, body, options);
  }
  return client.post_unary<FunctionExecution>(path, body, options);
}

export function inlineFunctionRemoteProfileCreate(
  client: ObjectiveAI,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk>>;
export function inlineFunctionRemoteProfileCreate(
  client: ObjectiveAI,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreaming,
  options?: RequestOptions,
): Promise<FunctionExecution>;
export function inlineFunctionRemoteProfileCreate(
  client: ObjectiveAI,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsInlineFunctionRemoteProfile,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  const path =
    pcommit !== null && pcommit !== undefined
      ? `/functions/profiles/${powner}/${prepository}/${pcommit}`
      : `/functions/profiles/${powner}/${prepository}`;
  if (body.stream) {
    return client.post_streaming<FunctionExecutionChunk>(path, body, options);
  }
  return client.post_unary<FunctionExecution>(path, body, options);
}

export function remoteFunctionRemoteProfileCreate(
  client: ObjectiveAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk>>;
export function remoteFunctionRemoteProfileCreate(
  client: ObjectiveAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreaming,
  options?: RequestOptions,
): Promise<FunctionExecution>;
export function remoteFunctionRemoteProfileCreate(
  client: ObjectiveAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfile,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  let path: string;
  if (fcommit !== null && fcommit !== undefined) {
    if (pcommit !== null && pcommit !== undefined) {
      path = `/functions/${fowner}/${frepository}/${fcommit}/profiles/${powner}/${prepository}/${pcommit}`;
    } else {
      path = `/functions/${fowner}/${frepository}/${fcommit}/profiles/${powner}/${prepository}`;
    }
  } else if (pcommit !== null && pcommit !== undefined) {
    path = `/functions/${fowner}/${frepository}/profiles/${powner}/${prepository}/${pcommit}`;
  } else {
    path = `/functions/${fowner}/${frepository}/profiles/${powner}/${prepository}`;
  }
  if (body.stream) {
    return client.post_streaming<FunctionExecutionChunk>(path, body, options);
  }
  return client.post_unary<FunctionExecution>(path, body, options);
}

export function create(
  client: ObjectiveAI,
  function_:
    | InlineFunction
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  profile:
    | InlineProfile
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk>>;
export function create(
  client: ObjectiveAI,
  function_:
    | InlineFunction
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  profile:
    | InlineProfile
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreaming,
  options?: RequestOptions,
): Promise<FunctionExecution>;
export function create(
  client: ObjectiveAI,
  function_:
    | InlineFunction
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  profile:
    | InlineProfile
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfile,
  options?: RequestOptions,
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  if ("owner" in function_ && "repository" in function_) {
    if ("owner" in profile && "repository" in profile) {
      if (body.stream) {
        return remoteFunctionRemoteProfileCreate(
          client,
          function_.owner,
          function_.repository,
          function_.commit,
          profile.owner,
          profile.repository,
          profile.commit,
          body as typeof body & { stream: true },
          options,
        );
      } else {
        return remoteFunctionRemoteProfileCreate(
          client,
          function_.owner,
          function_.repository,
          function_.commit,
          profile.owner,
          profile.repository,
          profile.commit,
          body as typeof body & { stream?: false | null },
          options,
        );
      }
    } else {
      const requestBody: FunctionExecutionCreateParamsRemoteFunctionInlineProfile =
        {
          ...body,
          profile,
        };
      if (requestBody.stream) {
        return remoteFunctionInlineProfileCreate(
          client,
          function_.owner,
          function_.repository,
          function_.commit,
          requestBody as typeof requestBody & { stream: true },
          options,
        );
      } else {
        return remoteFunctionInlineProfileCreate(
          client,
          function_.owner,
          function_.repository,
          function_.commit,
          requestBody as typeof requestBody & { stream?: false | null },
          options,
        );
      }
    }
  } else if ("owner" in profile && "repository" in profile) {
    const requestBody: FunctionExecutionCreateParamsInlineFunctionRemoteProfile =
      {
        ...body,
        function: function_,
      };
    if (requestBody.stream) {
      return inlineFunctionRemoteProfileCreate(
        client,
        profile.owner,
        profile.repository,
        profile.commit,
        requestBody as typeof requestBody & { stream: true },
        options,
      );
    } else {
      return inlineFunctionRemoteProfileCreate(
        client,
        profile.owner,
        profile.repository,
        profile.commit,
        requestBody as typeof requestBody & { stream?: false | null },
        options,
      );
    }
  } else {
    const requestBody: FunctionExecutionCreateParamsInlineFunctionInlineProfile =
      {
        ...body,
        function: function_,
        profile,
      };
    if (requestBody.stream) {
      return inlineFunctionInlineProfileCreate(
        client,
        requestBody as typeof requestBody & { stream: true },
        options,
      );
    } else {
      return inlineFunctionInlineProfileCreate(
        client,
        requestBody as typeof requestBody & { stream?: false | null },
        options,
      );
    }
  }
}
