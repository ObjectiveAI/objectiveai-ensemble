import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Functions } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestPath={z.object({
        fowner: z.string().describe("The owner of the GitHub repository containing the function."),
        frepository: z.string().describe("The name of the GitHub repository containing the function."),
        fcommit: z.string().optional().describe("The commit SHA of the GitHub repository containing the function."),
        powner: z.string().describe("The owner of the GitHub repository containing the profile."),
        prepository: z.string().describe("The name of the GitHub repository containing the profile."),
        pcommit: z.string().optional().describe("The commit SHA of the GitHub repository containing the profile."),
      })}
      responseBody={Functions.RetrievePairSchema}
    />
  );
}
