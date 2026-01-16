import z from "zod";
import { JsonValueSchema } from "./json";

export const ObjectiveAIErrorSchema = z
  .object({
    code: z.uint32().describe("The status code of the error."),
    message: JsonValueSchema.describe("The message or details of the error."),
  })
  .describe("An error returned by the ObjectiveAI API.")
  .meta({ title: "ObjectiveAIError" });
export type ObjectiveAIError = z.infer<typeof ObjectiveAIErrorSchema>;
