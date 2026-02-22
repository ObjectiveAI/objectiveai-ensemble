import { EnsembleSchema } from "src/vector/completions/request/ensemble";
import { ProfileSchema as VectorProfileSchema } from "src/vector/completions/request/profile";
import z from "zod";
import { convert, type JSONSchema } from "../json_schema";
import { RemoteSchema } from "./remote";

// Inline/Remote Auto Profiles (single ensemble+weights for all tasks)

export const InlineAutoProfileSchema = z
  .object({
    ensemble: EnsembleSchema,
    profile: VectorProfileSchema.describe(
      "The weights for each LLM in the ensemble.",
    ),
  })
  .describe(
    "An auto function profile defined inline. Applies a single ensemble and weights to all vector completion tasks.",
  )
  .meta({ title: "InlineAutoProfile" });
export type InlineAutoProfile = z.infer<typeof InlineAutoProfileSchema>;

export namespace InlineAutoProfileExt {
  export function validate(self: InlineAutoProfile): void {
    if (typeof self.ensemble === "object") {
      if (self.ensemble.llms.length !== self.profile.length) {
        throw new Error(
          `Ensemble has ${self.ensemble.llms.length} LLMs but profile has ${self.profile.length} entries.`,
        );
      }
    }
    for (const [i, entry] of self.profile.entries()) {
      const weight = typeof entry === "number" ? entry : entry.weight;
      if (weight < 0 || weight > 1) {
        throw new Error(
          `Profile entry ${i} has invalid weight ${weight}. Must be in [0, 1].`,
        );
      }
    }
  }
}

export const RemoteAutoProfileSchema = InlineAutoProfileSchema.extend({
  description: z.string().describe("The description of the profile."),
})
  .describe('A remote auto function profile. "profile.json"')
  .meta({ title: "RemoteAutoProfile" });
export type RemoteAutoProfile = z.infer<typeof RemoteAutoProfileSchema>;

export namespace RemoteAutoProfileExt {
  export function validate(self: RemoteAutoProfile): void {
    InlineAutoProfileExt.validate(self);
  }
}

// Task Profile

export const RemoteTaskProfileSchema = z
  .object({
    remote: RemoteSchema,
    owner: z
      .string()
      .describe("The owner of the repository containing the profile."),
    repository: z
      .string()
      .describe("The name of the repository containing the profile."),
    commit: z
      .string()
      .describe(
        "The commit SHA of the repository containing the profile.",
      ),
  })
  .describe(
    "The identifiers for a remote function profile.",
  )
  .meta({ title: "RemoteTaskProfile" });
export type RemoteTaskProfile = z.infer<typeof RemoteTaskProfileSchema>;

export const PlaceholderTaskProfileSchema = z
  .object({})
  .strict()
  .describe("A placeholder profile for placeholder function tasks.")
  .meta({ title: "PlaceholderTaskProfile" });
export type PlaceholderTaskProfile = z.infer<
  typeof PlaceholderTaskProfileSchema
>;

export type TaskProfile =
  | RemoteTaskProfile
  | InlineAutoProfile
  | { tasks: TaskProfile[]; profile: z.infer<typeof VectorProfileSchema> }
  | PlaceholderTaskProfile;
export const TaskProfileSchema: z.ZodType<TaskProfile> = z
  .union([
    RemoteTaskProfileSchema,
    InlineAutoProfileSchema,
    z
      .lazy(() => InlineTasksProfileSchema)
      .meta({ title: "InlineTasksProfile", recursive: true }),
    PlaceholderTaskProfileSchema,
  ])
  .describe("The profile for a task.")
  .meta({ title: "TaskProfile" });

export namespace TaskProfileExt {
  export function validate(self: TaskProfile): void {
    if ("owner" in self) {
      try {
        RemoteTaskProfileSchema.parse(self);
      } catch (error) {
        throw new Error(`Invalid RemoteTaskProfile: ${error}`);
      }
    } else if ("profile" in self) {
      InlineProfileExt.validate(self as InlineProfile);
    } else {
      try {
        PlaceholderTaskProfileSchema.parse(self);
      } catch (error) {
        throw new Error(`Invalid PlaceholderTaskProfile: ${error}`);
      }
    }
  }
}

export const TaskProfilesSchema = z
  .array(TaskProfileSchema)
  .describe("The list of task profiles.")
  .meta({ title: "TaskProfiles" });
export type TaskProfiles = z.infer<typeof TaskProfilesSchema>;

// Inline/Remote Tasks Profiles (per-task configuration)

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

export namespace InlineTasksProfileExt {
  export function validate(self: InlineTasksProfile): void {
    if (self.tasks.length !== self.profile.length) {
      throw new Error(
        `Profile has ${self.profile.length} entries but there are ${self.tasks.length} tasks.`,
      );
    }
    let weightSum = 0;
    for (const entry of self.profile) {
      const weight = typeof entry === "number" ? entry : entry.weight;
      weightSum += weight;
    }
    if (weightSum < 0.99 || weightSum > 1.01) {
      throw new Error(
        `Profile weights sum to ${weightSum}, but must sum to 1.`,
      );
    }
  }
}

export const RemoteTasksProfileSchema = InlineTasksProfileSchema.extend({
  description: z.string().describe("The description of the profile."),
})
  .describe(
    'A remote tasks-based function profile. "profile.json"',
  )
  .meta({ title: "RemoteTasksProfile" });
export type RemoteTasksProfile = z.infer<typeof RemoteTasksProfileSchema>;

export namespace RemoteTasksProfileExt {
  export function validate(self: RemoteTasksProfile): void {
    InlineTasksProfileExt.validate(self);
  }
}

// Inline Profile (union of tasks and auto)

export const InlineProfileSchema = z
  .union([InlineTasksProfileSchema, InlineAutoProfileSchema])
  .describe("A function profile defined inline.")
  .meta({ title: "InlineProfile" });
export type InlineProfile = z.infer<typeof InlineProfileSchema>;

export namespace InlineProfileExt {
  export function validate(self: InlineProfile): void {
    if ("tasks" in self) {
      InlineTasksProfileExt.validate(self);
    } else {
      InlineAutoProfileExt.validate(self);
    }
  }
}

// Remote Profile (union of tasks and auto)

export const RemoteProfileSchema = z
  .union([RemoteTasksProfileSchema, RemoteAutoProfileSchema])
  .describe('A remote function profile. "profile.json"')
  .meta({ title: "RemoteProfile" });
export type RemoteProfile = z.infer<typeof RemoteProfileSchema>;

export namespace RemoteProfileExt {
  export function validate(self: RemoteProfile): void {
    if ("tasks" in self) {
      RemoteTasksProfileExt.validate(self);
    } else {
      RemoteAutoProfileExt.validate(self);
    }
  }
}

// Profile

export const ProfileSchema = z
  .union([InlineProfileSchema, RemoteProfileSchema])
  .describe("A function profile.")
  .meta({ title: "Profile" });
export type Profile = z.infer<typeof ProfileSchema>;

export namespace ProfileExt {
  export function validate(self: Profile): void {
    if ("description" in self) {
      RemoteProfileExt.validate(self);
    } else {
      InlineProfileExt.validate(self);
    }
  }
}

// JSON Schema conversions (deferred to end of file so all schemas are initialized)

export const InlineAutoProfileJsonSchema: JSONSchema = convert(InlineAutoProfileSchema);
export const RemoteAutoProfileJsonSchema: JSONSchema = convert(RemoteAutoProfileSchema);
export const RemoteTaskProfileJsonSchema: JSONSchema = convert(RemoteTaskProfileSchema);
export const PlaceholderTaskProfileJsonSchema: JSONSchema = convert(PlaceholderTaskProfileSchema);
export const TaskProfileJsonSchema: JSONSchema = convert(TaskProfileSchema);
export const TaskProfilesJsonSchema: JSONSchema = convert(TaskProfilesSchema);
export const InlineTasksProfileJsonSchema: JSONSchema = convert(InlineTasksProfileSchema);
export const RemoteTasksProfileJsonSchema: JSONSchema = convert(RemoteTasksProfileSchema);
export const InlineProfileJsonSchema: JSONSchema = convert(InlineProfileSchema);
export const RemoteProfileJsonSchema: JSONSchema = convert(RemoteProfileSchema);
export const ProfileJsonSchema: JSONSchema = convert(ProfileSchema);
