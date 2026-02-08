import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Ensemble } from "objectiveai";

export default function Page() {
  return (
    <EndpointDocs
      responseBody={Ensemble.ListSchema}
    />
  );
}
