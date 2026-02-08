import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { EnsembleLlm } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestPath={z.object({
        id: z.string().describe("The ID of the ensemble LLM."),
      })}
      responseBody={EnsembleLlm.HistoricalUsageSchema}
    />
  );
}
