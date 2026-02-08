import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Functions } from "objectiveai";

export default function Page() {
  return (
    <EndpointDocs
      responseBody={Functions.Profiles.ListSchema}
    />
  );
}
