import z from "zod";
import { MessageSchema } from "./message";
import { FinishReasonSchema } from "../finish_reason";
import { LogprobsSchema } from "../logprobs";

export const ChoiceSchema = z
  .object({
    message: MessageSchema,
    finish_reason: FinishReasonSchema,
    index: z
      .uint32()
      .describe("The index of the choice in the list of choices."),
    logprobs: LogprobsSchema.nullable(),
  })
  .describe("A choice in a unary chat completion response.");
export type Choice = z.infer<typeof ChoiceSchema>;
