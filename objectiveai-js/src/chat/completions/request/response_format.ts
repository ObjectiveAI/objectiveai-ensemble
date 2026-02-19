import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";
import { JsonValueSchema } from "src/json";

export const TextResponseFormatSchema = z
  .object({
    type: z.literal("text"),
  })
  .describe("The response will be arbitrary text.")
  .meta({ title: "TextResponseFormat" });
export type TextResponseFormat = z.infer<typeof TextResponseFormatSchema>;
export const TextResponseFormatJsonSchema: JSONSchema = convert(
  TextResponseFormatSchema,
);

export const JsonObjectResponseFormatSchema = z
  .object({
    type: z.literal("json_object"),
  })
  .describe("The response will be a JSON object.")
  .meta({ title: "JsonObjectResponseFormat" });
export type JsonObjectResponseFormat = z.infer<
  typeof JsonObjectResponseFormatSchema
>;
export const JsonObjectResponseFormatJsonSchema: JSONSchema = convert(
  JsonObjectResponseFormatSchema,
);

export const JsonSchemaResponseFormatJsonSchemaSchema = z
  .object({
    name: z.string().describe("The name of the JSON schema."),
    description: z
      .string()
      .optional()
      .nullable()
      .describe("The description of the JSON schema."),
    schema: JsonValueSchema.optional().describe("The JSON schema definition."),
    strict: z
      .boolean()
      .optional()
      .nullable()
      .describe("Whether to enforce strict adherence to the JSON schema."),
  })
  .describe("A JSON schema definition for constraining model output.")
  .meta({ title: "JsonSchemaResponseFormatJsonSchema" });
export type JsonSchemaResponseFormatJsonSchema = z.infer<
  typeof JsonSchemaResponseFormatJsonSchemaSchema
>;
export const JsonSchemaResponseFormatJsonSchemaJsonSchema: JSONSchema = convert(
  JsonSchemaResponseFormatJsonSchemaSchema,
);

export const JsonSchemaResponseFormatSchema = z
  .object({
    type: z.literal("json_schema"),
    json_schema: JsonSchemaResponseFormatJsonSchemaSchema,
  })
  .describe("The response will conform to the provided JSON schema.")
  .meta({ title: "JsonSchemaResponseFormat" });
export type JsonSchemaResponseFormat = z.infer<
  typeof JsonSchemaResponseFormatSchema
>;
export const JsonSchemaResponseFormatJsonSchema: JSONSchema = convert(
  JsonSchemaResponseFormatSchema,
);

export const GrammarResponseFormatSchema = z
  .object({
    type: z.literal("grammar"),
    grammar: z
      .string()
      .describe("The grammar definition to constrain the response."),
  })
  .describe("The response will conform to the provided grammar definition.")
  .meta({ title: "GrammarResponseFormat" });
export type GrammarResponseFormat = z.infer<typeof GrammarResponseFormatSchema>;
export const GrammarResponseFormatJsonSchema: JSONSchema = convert(
  GrammarResponseFormatSchema,
);

export const PythonResponseFormatSchema = z
  .object({
    type: z.literal("python"),
  })
  .describe("The response will be Python code.")
  .meta({ title: "PythonResponseFormat" });
export type PythonResponseFormat = z.infer<typeof PythonResponseFormatSchema>;
export const PythonResponseFormatJsonSchema: JSONSchema = convert(
  PythonResponseFormatSchema,
);

export const ResponseFormatSchema = z
  .union([
    TextResponseFormatSchema,
    JsonObjectResponseFormatSchema,
    JsonSchemaResponseFormatSchema,
    GrammarResponseFormatSchema,
    PythonResponseFormatSchema,
  ])
  .describe("The desired format of the model's response.")
  .meta({ title: "ResponseFormat" });
export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;
export const ResponseFormatJsonSchema: JSONSchema =
  convert(ResponseFormatSchema);
