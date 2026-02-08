import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Ensemble } from "objectiveai";
import z from "zod";

export default function Page() {
  return (
    <EndpointDocs
      requestPath={z.object({
        id: z.string().describe("The ID of the Ensemble."),
      })}
      responseBody={Ensemble.HistoricalUsageSchema}
    />
  );
}
