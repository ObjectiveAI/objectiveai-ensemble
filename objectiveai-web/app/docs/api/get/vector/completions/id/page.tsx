import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Vector } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestPath={z.object({
        id: z.string().describe("The unique identifier of the vector completion."),
      })}
      responseBody={Vector.Completions.RetrieveSchema}
    />
  );
}
