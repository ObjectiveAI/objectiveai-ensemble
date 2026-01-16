import OpenAI from "openai";
import { Credits } from "./credits";

export async function retrieve(
  openai: OpenAI,
  options?: OpenAI.RequestOptions
): Promise<Credits> {
  const response = await openai.get("/auth/credits", options);
  return response as Credits;
}
