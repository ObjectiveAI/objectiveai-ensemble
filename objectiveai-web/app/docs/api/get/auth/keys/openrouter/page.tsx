import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Auth } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestHeaders={z.object({
        authorization: z.string().describe("Authorization token (required)."),
      })}
      responseBody={Auth.ApiKey.OpenRouter.OpenRouterByokApiKeySchema}
    />
  );
}
