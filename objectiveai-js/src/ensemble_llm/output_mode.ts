import z from "zod";

export const OutputModeSchema = z
  .enum(["instruction", "json_schema", "tool_call"])
  .describe(
    'For Vector Completions only, specifies the LLM\'s voting output mode. For "instruction", the assistant is instructed to output a key. For "json_schema", the assistant is constrained to output a valid key using a JSON schema. For "tool_call", the assistant is instructed to output a tool call to select the key.'
  );
export type OutputMode = z.infer<typeof OutputModeSchema>;
