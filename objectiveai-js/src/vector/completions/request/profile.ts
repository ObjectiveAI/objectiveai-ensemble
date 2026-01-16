import z from "zod";

export const ProfileSchema = z
  .array(z.number())
  .describe(
    "The profile to use for the completion. Must be of the same length as the Ensemble's `llms` field, ignoring count."
  );
export type Profile = z.infer<typeof ProfileSchema>;
