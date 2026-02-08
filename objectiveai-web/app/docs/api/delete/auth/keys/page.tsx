import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Auth } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      requestBody={z.object({
        api_key: z.string().describe("The API key to delete."),
      })}
      responseBody={Auth.ApiKey.ApiKeyWithMetadataSchema}
    />
  );
}
