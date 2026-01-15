import z from "zod";

export const RoleSchema = z
  .enum(["assistant"])
  .describe("The role of the message author.");
export type Role = z.infer<typeof RoleSchema>;
