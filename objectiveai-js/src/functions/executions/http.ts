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
import { Stream } from "openai/streaming";
import OpenAI from "openai";
import { InlineFunction } from "../function";
import { InlineProfile } from "../profile";

export async function inlineFunctionInlineProfileCreate(
  openai: OpenAI,
  body: FunctionExecutionCreateParamsInlineFunctionInlineProfileStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk>>;
export async function inlineFunctionInlineProfileCreate(
  openai: OpenAI,
  body: FunctionExecutionCreateParamsInlineFunctionInlineProfileNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionExecution>;
export async function inlineFunctionInlineProfileCreate(
  openai: OpenAI,
  body: FunctionExecutionCreateParamsInlineFunctionInlineProfile,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  const response = await openai.post("/functions", {
    body,
    stream: body.stream ?? false,
    ...options,
  });
  return response as Stream<FunctionExecutionChunk> | FunctionExecution;
}

export async function remoteFunctionInlineProfileCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionInlineProfileStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk>>;
export async function remoteFunctionInlineProfileCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionInlineProfileNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionExecution>;
export async function remoteFunctionInlineProfileCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionInlineProfile,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  const response = await openai.post(
    fcommit !== null && fcommit !== undefined
      ? `/functions/${fowner}/${frepository}/${fcommit}`
      : `/functions/${fowner}/${frepository}`,
    {
      body,
      stream: body.stream ?? false,
      ...options,
    }
  );
  return response as Stream<FunctionExecutionChunk> | FunctionExecution;
}

export async function inlineFunctionRemoteProfileCreate(
  openai: OpenAI,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsInlineFunctionRemoteProfileStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk>>;
export async function inlineFunctionRemoteProfileCreate(
  openai: OpenAI,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsInlineFunctionRemoteProfileNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionExecution>;
export async function inlineFunctionRemoteProfileCreate(
  openai: OpenAI,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsInlineFunctionRemoteProfile,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  const response = await openai.post(
    pcommit !== null && pcommit !== undefined
      ? `/functions/profiles/${powner}/${prepository}/${pcommit}`
      : `/functions/profiles/${powner}/${prepository}`,
    {
      body,
      stream: body.stream ?? false,
      ...options,
    }
  );
  return response as Stream<FunctionExecutionChunk> | FunctionExecution;
}

export async function remoteFunctionRemoteProfileCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk>>;
export async function remoteFunctionRemoteProfileCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileNonStreaming,
  options?: OpenAI.RequestOptions
): Promise<FunctionExecution>;
export async function remoteFunctionRemoteProfileCreate(
  openai: OpenAI,
  fowner: string,
  frepository: string,
  fcommit: string | null | undefined,
  powner: string,
  prepository: string,
  pcommit: string | null | undefined,
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfile,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  let url: string;
  if (fcommit !== null && fcommit !== undefined) {
    if (pcommit !== null && pcommit !== undefined) {
      url = `/functions/${fowner}/${frepository}/${fcommit}/profiles/${powner}/${prepository}/${pcommit}`;
    } else {
      url = `/functions/${fowner}/${frepository}/${fcommit}/profiles/${powner}/${prepository}`;
    }
  } else if (pcommit !== null && pcommit !== undefined) {
    url = `/functions/${fowner}/${frepository}/profiles/${powner}/${prepository}/${pcommit}`;
  } else {
    url = `/functions/${fowner}/${frepository}/profiles/${powner}/${prepository}`;
  }
  const response = await openai.post(url, {
    body,
    stream: body.stream ?? false,
    ...options,
  });
  return response as Stream<FunctionExecutionChunk> | FunctionExecution;
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
  profile:
    | InlineProfile
    | {
        owner: string;
        repository: string;
        commit?: string | null | undefined;
      },
  body: FunctionExecutionCreateParamsRemoteFunctionRemoteProfileStreaming,
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk>>;
export async function create(
  openai: OpenAI,
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
  options?: OpenAI.RequestOptions
): Promise<FunctionExecution>;
export async function create(
  openai: OpenAI,
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
  options?: OpenAI.RequestOptions
): Promise<Stream<FunctionExecutionChunk> | FunctionExecution> {
  if ("owner" in function_ && "repository" in function_) {
    if ("owner" in profile && "repository" in profile) {
      if (body.stream) {
        return remoteFunctionRemoteProfileCreate(
          openai,
          function_.owner,
          function_.repository,
          function_.commit,
          profile.owner,
          profile.repository,
          profile.commit,
          body as typeof body & { stream: true },
          options
        );
      } else {
        return remoteFunctionRemoteProfileCreate(
          openai,
          function_.owner,
          function_.repository,
          function_.commit,
          profile.owner,
          profile.repository,
          profile.commit,
          body as typeof body & { stream?: false | null },
          options
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
          openai,
          function_.owner,
          function_.repository,
          function_.commit,
          requestBody as typeof requestBody & { stream: true },
          options
        );
      } else {
        return remoteFunctionInlineProfileCreate(
          openai,
          function_.owner,
          function_.repository,
          function_.commit,
          requestBody as typeof requestBody & { stream?: false | null },
          options
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
        openai,
        profile.owner,
        profile.repository,
        profile.commit,
        requestBody as typeof requestBody & { stream: true },
        options
      );
    } else {
      return inlineFunctionRemoteProfileCreate(
        openai,
        profile.owner,
        profile.repository,
        profile.commit,
        requestBody as typeof requestBody & { stream?: false | null },
        options
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
        openai,
        requestBody as typeof requestBody & { stream: true },
        options
      );
    } else {
      return inlineFunctionInlineProfileCreate(
        openai,
        requestBody as typeof requestBody & { stream?: false | null },
        options
      );
    }
  }
}
