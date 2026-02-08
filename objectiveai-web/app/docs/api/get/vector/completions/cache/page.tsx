import { EndpointDocs } from "@/components/docs/EndpointDocs";
import { Vector } from "objectiveai";

export default function Page() {
  return (
    <EndpointDocs
      requestBody={Vector.Completions.Cache.Request.CacheVoteRequestSchema}
      responseBody={Vector.Completions.Cache.Response.CacheVoteSchema}
    />
  );
}
