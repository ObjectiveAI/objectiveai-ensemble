import z from "zod";
import { convert, type JSONSchema } from "../json_schema";

export const VerbositySchema = z
  .enum(["low", "medium", "high"])
  .describe(
    "Controls the verbosity and length of the model response. Lower values produce more concise responses, while higher values produce more detailed and comprehensive responses."
  );
export type Verbosity = z.infer<typeof VerbositySchema>;
export const VerbosityJsonSchema: JSONSchema = convert(VerbositySchema);
