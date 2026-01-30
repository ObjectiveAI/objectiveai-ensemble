import { ObjectiveAI, RequestOptions } from "../../../client";
import { CacheVoteRequest } from "./request";
import { CacheVote } from "./response";

export function retrieve(
  client: ObjectiveAI,
  request: CacheVoteRequest,
  options?: RequestOptions,
): Promise<CacheVote> {
  // Using GET with body for complex request object
  return client.get_unary<CacheVote>(
    "/vector/completions/cache",
    request,
    options,
  );
}
