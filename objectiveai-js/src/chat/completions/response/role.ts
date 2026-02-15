import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const RoleSchema = z
  .enum(["assistant"])
  .describe("The role of the message author.");
export type Role = z.infer<typeof RoleSchema>;
export const RoleJsonSchema: JSONSchema = convert(RoleSchema);
