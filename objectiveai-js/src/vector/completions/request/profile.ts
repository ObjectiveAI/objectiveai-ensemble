import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const ProfileEntrySchema = z
  .object({
    weight: z
      .number()
      .describe(
        "The weight for this LLM in the ensemble. Must be between 0 and 1."
      ),
    invert: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "If true, invert this LLM's vote distribution before combining. When omitted or false, the vote distribution is used as-is."
      ),
  })
  .describe(
    "An entry in a vector completion profile with an explicit weight and optional invert flag."
  )
  .meta({ title: "VectorCompletionProfileEntry" });
export type ProfileEntry = z.infer<typeof ProfileEntrySchema>;
export const ProfileEntryJsonSchema: JSONSchema = convert(ProfileEntrySchema);

export const ProfileSchema = z
  .union([
    z
      .array(z.number())
      .describe(
        "Legacy representation: a simple list of weights. Must be of the same length as the Ensemble's `llms` field, ignoring count."
      ),
    z
      .array(ProfileEntrySchema)
      .describe(
        "Profile entries with explicit `weight` and optional `invert` for each LLM in the ensemble."
      ),
  ])
  .describe(
    "The profile to use for the completion. Must be of the same length as the Ensemble's `llms` field, ignoring count. Can be either a list of weights or a list of objects with `weight` and optional `invert`."
  )
  .meta({ title: "VectorCompletionProfile" });
export type Profile = z.infer<typeof ProfileSchema>;
export const ProfileJsonSchema: JSONSchema = convert(ProfileSchema);
