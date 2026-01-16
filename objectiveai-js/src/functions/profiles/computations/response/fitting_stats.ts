import z from "zod";

export const FittingStatsSchema = z
  .object({
    loss: z
      .number()
      .describe("The final sum loss achieved during weights fitting."),
    executions: z
      .uint32()
      .describe(
        "The total number of function executions used during weights fitting."
      ),
    starts: z
      .uint32()
      .describe(
        "The number of fitting starts attempted. Each start begins with a randomized weight vector."
      ),
    rounds: z
      .uint32()
      .describe("The number of fitting rounds performed across all starts."),
    errors: z
      .uint32()
      .describe(
        "The number of errors which occurred while computing outputs during fitting."
      ),
  })
  .describe(
    "Statistics about the fitting process used to compute the weights for the profile."
  );
export type FittingStats = z.infer<typeof FittingStatsSchema>;
