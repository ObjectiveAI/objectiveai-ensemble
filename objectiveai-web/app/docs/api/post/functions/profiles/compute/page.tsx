import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Functions } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestBody={Functions.Profiles.Computations.Request.FunctionProfileComputationCreateParamsInlineFunctionSchema}
      responseBody={Functions.Profiles.Computations.Response.Unary.FunctionProfileComputationSchema}
      responseBodyStreaming={Functions.Profiles.Computations.Response.Streaming.FunctionProfileComputationChunkSchema}
    />
  );
}
