import { ObjectiveAI, RequestOptions } from "../../client";
import { Credits } from "./credits";

export function retrieve(
  client: ObjectiveAI,
  options?: RequestOptions,
): Promise<Credits> {
  return client.get_unary<Credits>("/auth/credits", undefined, options);
}
