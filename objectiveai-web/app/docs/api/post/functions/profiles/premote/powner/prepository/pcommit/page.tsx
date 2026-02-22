import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Functions } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestPath={z.object({
        premote: z.string().describe("The remote provider hosting the profile (e.g. \"github\")."),
        powner: z.string().describe("The owner of the repository containing the profile."),
        prepository: z.string().describe("The name of the repository containing the profile."),
        pcommit: z.string().optional().describe("The commit SHA of the repository containing the profile."),
      })}
      requestBody={Functions.Executions.Request.FunctionExecutionCreateParamsInlineFunctionRemoteProfileSchema}
      responseBody={Functions.Executions.Response.Unary.FunctionExecutionSchema}
      responseBodyStreaming={Functions.Executions.Response.Streaming.FunctionExecutionChunkSchema}
    />
  );
}
