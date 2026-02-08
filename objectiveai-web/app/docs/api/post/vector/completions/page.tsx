import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Vector } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestBody={Vector.Completions.Request.VectorCompletionCreateParamsSchema}
      responseBody={Vector.Completions.Response.Unary.VectorCompletionSchema}
      responseBodyStreaming={Vector.Completions.Response.Streaming.VectorCompletionChunkSchema}
    />
  );
}
