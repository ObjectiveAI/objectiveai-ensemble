import z from "zod";
import { convert, type JSONSchema } from "../json_schema";

export const StopSchema = z
  .union([
    z
      .string()
      .describe("Generation will stop when this string is generated.")
      .meta({ title: "StopString" }),
    z
      .array(z.string().meta({ title: "StopString" }))
      .describe("Generation will stop when any of these strings are generated.")
      .meta({ title: "StopStrings" }),
  ])
  .describe(
    "The assistant will stop when any of the provided strings are generated."
  )
  .meta({ title: "Stop" });
export type Stop = z.infer<typeof StopSchema>;
export const StopJsonSchema: JSONSchema = convert(StopSchema);
