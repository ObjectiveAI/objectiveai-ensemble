import z from "zod";
import { convert, type JSONSchema } from "../../json_schema";

export const CreditsSchema = z.object({
  credits: z.number().describe("The current number of credits available."),
  total_credits_purchased: z
    .number()
    .describe("The total number of credits ever purchased."),
  total_credits_used: z
    .number()
    .describe("The total number of credits ever used."),
});
export type Credits = z.infer<typeof CreditsSchema>;
export const CreditsJsonSchema: JSONSchema = convert(CreditsSchema);
