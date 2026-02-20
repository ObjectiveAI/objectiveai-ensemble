import { EnsembleSchema } from "src/vector/completions/request/ensemble";
import { ProfileSchema as VectorProfileSchema } from "src/vector/completions/request/profile";
import z from "zod";
import { convert, type JSONSchema } from "../json_schema";

// Task Profile

export const RemoteFunctionTaskProfileSchema = z
  .object({
    owner: z
      .string()
      .describe("The owner of the GitHub repository containing the profile."),
    repository: z
      .string()
      .describe("The name of the GitHub repository containing the profile."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the GitHub repository containing the profile.",
      ),
  })
  .describe(
    "The identifiers for a function profile hosted in a GitHub repository.",
  )
  .meta({ title: "RemoteFunctionTaskProfile" });
export type RemoteFunctionTaskProfile = z.infer<
  typeof RemoteFunctionTaskProfileSchema
>;
export const RemoteFunctionTaskProfileJsonSchema: JSONSchema = convert(
  RemoteFunctionTaskProfileSchema,
);

export interface InlineTasksFunctionTaskProfile {
  tasks: TaskProfile[];
  profile: z.infer<typeof VectorProfileSchema>;
}
export interface InlineAutoFunctionTaskProfile {
  ensemble: z.infer<typeof EnsembleSchema>;
  profile: z.infer<typeof VectorProfileSchema>;
}
export type InlineFunctionTaskProfile = InlineTasksFunctionTaskProfile | InlineAutoFunctionTaskProfile;
export const InlineFunctionTaskProfileSchema: z.ZodType<InlineFunctionTaskProfile> =
  z
    .lazy(() => InlineProfileSchema)
    .describe("An inline function profile (tasks-based or auto).")
    .meta({ title: "InlineFunctionTaskProfile", recursive: true });
export const InlineFunctionTaskProfileJsonSchema: JSONSchema = convert(
  InlineFunctionTaskProfileSchema,
);

export const VectorCompletionTaskProfileSchema = z
  .object({
    ensemble: EnsembleSchema,
    profile: VectorProfileSchema,
  })
  .describe(
    "A vector completion profile for a vector completion task containing an Ensemble and array of weights.",
  )
  .meta({ title: "VectorCompletionTaskProfile" });
export type VectorCompletionTaskProfile = z.infer<
  typeof VectorCompletionTaskProfileSchema
>;
export const VectorCompletionTaskProfileJsonSchema: JSONSchema = convert(
  VectorCompletionTaskProfileSchema,
);

export const PlaceholderTaskProfileSchema = z
  .object({})
  .strict()
  .describe("A placeholder profile for placeholder function tasks.")
  .meta({ title: "PlaceholderTaskProfile" });
export type PlaceholderTaskProfile = z.infer<
  typeof PlaceholderTaskProfileSchema
>;
export const PlaceholderTaskProfileJsonSchema: JSONSchema = convert(
  PlaceholderTaskProfileSchema,
);

export const TaskProfileSchema = z
  .union([
    RemoteFunctionTaskProfileSchema,
    InlineFunctionTaskProfileSchema,
    VectorCompletionTaskProfileSchema,
    PlaceholderTaskProfileSchema,
  ])
  .describe("The profile for a task.")
  .meta({ title: "TaskProfile" });
export type TaskProfile = z.infer<typeof TaskProfileSchema>;
export const TaskProfileJsonSchema: JSONSchema = convert(TaskProfileSchema);

export const TaskProfilesSchema = z
  .array(TaskProfileSchema)
  .describe("The list of task profiles.")
  .meta({ title: "TaskProfiles" });
export type TaskProfiles = z.infer<typeof TaskProfilesSchema>;
export const TaskProfilesJsonSchema: JSONSchema = convert(TaskProfilesSchema);

// Inline Tasks Profile (per-task configuration)

export const InlineTasksProfileSchema = z
  .object({
    tasks: TaskProfilesSchema,
    profile: VectorProfileSchema.describe(
      "The weights for each task used in weighted averaging of task outputs. Can be either a list of weights or a list of objects with `weight` and optional `invert`.",
    ),
  })
  .describe("A tasks-based function profile defined inline.")
  .meta({ title: "InlineTasksProfile" });
export type InlineTasksProfile = z.infer<typeof InlineTasksProfileSchema>;
export const InlineTasksProfileJsonSchema: JSONSchema = convert(InlineTasksProfileSchema);

// Inline Auto Profile (single ensemble+weights for all tasks)

export const InlineAutoProfileSchema = z
  .object({
    ensemble: EnsembleSchema,
    profile: VectorProfileSchema.describe(
      "The weights for each LLM in the ensemble.",
    ),
  })
  .describe("An auto function profile defined inline. Applies a single ensemble and weights to all vector completion tasks.")
  .meta({ title: "InlineAutoProfile" });
export type InlineAutoProfile = z.infer<typeof InlineAutoProfileSchema>;
export const InlineAutoProfileJsonSchema: JSONSchema = convert(InlineAutoProfileSchema);

// Inline Profile (union of tasks and auto)

export const InlineProfileSchema = z
  .union([InlineTasksProfileSchema, InlineAutoProfileSchema])
  .describe("A function profile defined inline.")
  .meta({ title: "InlineProfile" });
export type InlineProfile = z.infer<typeof InlineProfileSchema>;
export const InlineProfileJsonSchema: JSONSchema = convert(InlineProfileSchema);

// Remote Tasks Profile

export const RemoteTasksProfileSchema = InlineTasksProfileSchema.extend({
  description: z.string().describe("The description of the profile."),
  changelog: z
    .string()
    .optional()
    .nullable()
    .describe(
      "When present, describes changes from the previous version or versions.",
    ),
})
  .describe('A tasks-based function profile fetched from GitHub. "profile.json"')
  .meta({ title: "RemoteTasksProfile" });
export type RemoteTasksProfile = z.infer<typeof RemoteTasksProfileSchema>;
export const RemoteTasksProfileJsonSchema: JSONSchema = convert(RemoteTasksProfileSchema);

// Remote Auto Profile

export const RemoteAutoProfileSchema = InlineAutoProfileSchema.extend({
  description: z.string().describe("The description of the profile."),
  changelog: z
    .string()
    .optional()
    .nullable()
    .describe(
      "When present, describes changes from the previous version or versions.",
    ),
})
  .describe('An auto function profile fetched from GitHub. "profile.json"')
  .meta({ title: "RemoteAutoProfile" });
export type RemoteAutoProfile = z.infer<typeof RemoteAutoProfileSchema>;
export const RemoteAutoProfileJsonSchema: JSONSchema = convert(RemoteAutoProfileSchema);

// Remote Profile (union of tasks and auto)

export const RemoteProfileSchema = z
  .union([RemoteTasksProfileSchema, RemoteAutoProfileSchema])
  .describe('A function profile fetched from GitHub. "profile.json"')
  .meta({ title: "RemoteProfile" });
export type RemoteProfile = z.infer<typeof RemoteProfileSchema>;
export const RemoteProfileJsonSchema: JSONSchema = convert(RemoteProfileSchema);

// Profile

export const ProfileSchema = z
  .union([InlineProfileSchema, RemoteProfileSchema])
  .describe("A function profile.")
  .meta({ title: "Profile" });
export type Profile = z.infer<typeof ProfileSchema>;
export const ProfileJsonSchema: JSONSchema = convert(ProfileSchema);
