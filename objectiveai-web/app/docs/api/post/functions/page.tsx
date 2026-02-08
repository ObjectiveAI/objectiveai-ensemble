import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Functions } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestBody={Functions.Executions.Request.FunctionExecutionCreateParamsInlineFunctionInlineProfileSchema}
      responseBody={Functions.Executions.Response.Unary.FunctionExecutionSchema}
      responseBodyStreaming={Functions.Executions.Response.Streaming.FunctionExecutionChunkSchema}
    />
  );
}
