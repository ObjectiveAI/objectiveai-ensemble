import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Chat } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestBody={Chat.Completions.Request.ChatCompletionCreateParamsSchema}
      responseBody={Chat.Completions.Response.Unary.ChatCompletionSchema}
      responseBodyStreaming={Chat.Completions.Response.Streaming.ChatCompletionChunkSchema}
    />
  );
}
