import z from "zod";
import { convert, type JSONSchema } from "../../json_schema";

export const ApiKeySchema = z
  .string()
  .describe(
    "An ObjectiveAI API Key. The format is always `apk` followed by 32 hexadecimal characters.",
  );
export type ApiKey = z.infer<typeof ApiKeySchema>;
export const ApiKeyJsonSchema: JSONSchema = convert(ApiKeySchema);

export const ApiKeyWithMetadataSchema = z
  .object({
    api_key: ApiKeySchema,
    created: z
      .string()
      .describe("The RFC 3339 timestamp when the API key was created."),
    expires: z
      .string()
      .nullable()
      .describe(
        "The RFC 3339 timestamp when the API key expires, or null if it does not expire.",
      ),
    disabled: z
      .string()
      .nullable()
      .describe(
        "The RFC 3339 timestamp when the API key was disabled, or null if it is not disabled.",
      ),
    name: z.string().describe("The name of the API key."),
    description: z
      .string()
      .nullable()
      .describe(
        "The description of the API key, or null if no description was provided.",
      ),
  })
  .describe("An ObjectiveAI API Key with metadata.");
export type ApiKeyWithMetadata = z.infer<typeof ApiKeyWithMetadataSchema>;
export const ApiKeyWithMetadataJsonSchema: JSONSchema = convert(
  ApiKeyWithMetadataSchema,
);
