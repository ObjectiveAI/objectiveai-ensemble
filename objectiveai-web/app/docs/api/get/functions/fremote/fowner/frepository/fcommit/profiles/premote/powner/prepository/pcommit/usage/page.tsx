import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Functions } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestPath={z.object({
        fremote: z.string().describe("The remote provider hosting the function (e.g. \"github\")."),
        fowner: z.string().describe("The owner of the repository containing the function."),
        frepository: z.string().describe("The name of the repository containing the function."),
        fcommit: z.string().optional().describe("The commit SHA of the repository containing the function."),
        premote: z.string().describe("The remote provider hosting the profile (e.g. \"github\")."),
        powner: z.string().describe("The owner of the repository containing the profile."),
        prepository: z.string().describe("The name of the repository containing the profile."),
        pcommit: z.string().optional().describe("The commit SHA of the repository containing the profile."),
      })}
      responseBody={Functions.HistoricalUsageSchema}
    />
  );
}
