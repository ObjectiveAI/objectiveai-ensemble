import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { EnsembleLlm } from "objectiveai";

export default function Page() {
  return (
    <EndpointDocs
      responseBody={EnsembleLlm.ListSchema}
    />
  );
}
