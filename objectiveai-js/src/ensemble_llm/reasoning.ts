import z from "zod";

export const ReasoningEffortSchema = z
  .enum(["none", "minimal", "low", "medium", "high", "xhigh"])
  .describe(
    "Constrains effort on reasoning for supported reasoning models. Reducing reasoning effort can result in faster responses and fewer tokens used on reasoning in a response."
  )
  .meta({ title: "ReasoningEffort" });
export type ReasoningEffort = z.infer<typeof ReasoningEffortSchema>;

export const ReasoningSummaryVerbositySchema = z
  .enum(["auto", "concise", "detailed"])
  .describe(
    "Controls the verbosity of the reasoning summary for supported reasoning models."
  )
  .meta({ title: "ReasoningSummaryVerbosity" });
export type ReasoningSummaryVerbosity = z.infer<
  typeof ReasoningSummaryVerbositySchema
>;

export const ReasoningSchema = z
  .object({
    enabled: z
      .boolean()
      .optional()
      .nullable()
      .describe("Enables or disables reasoning for supported models."),
    max_tokens: z
      .int()
      .min(0)
      .max(2147483647)
      .optional()
      .nullable()
      .describe(
        "The maximum number of tokens to use for reasoning in a response."
      ),
    effort: ReasoningEffortSchema.optional().nullable(),
    summary_verbosity: ReasoningSummaryVerbositySchema.optional().nullable(),
  })
  .optional()
  .nullable()
  .describe("Options for controlling reasoning behavior of the model.");
export type Reasoning = z.infer<typeof ReasoningSchema>;
