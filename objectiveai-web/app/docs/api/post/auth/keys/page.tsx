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
        name: z.string().describe("Name for the new API key."),
        expires: z.string().optional().describe("Expiration date for the new API key in RFC 3339 format."),
        description: z.string().optional().describe("Description for the new API key."),
      })}
      responseBody={Auth.ApiKey.ApiKeyWithMetadataSchema}
    />
  );
}
