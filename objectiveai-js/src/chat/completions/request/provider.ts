import z from "zod";
import { convert, type JSONSchema } from "../../../json_schema";

export const ProviderDataCollectionSchema = z
  .enum(["allow", "deny"])
  .describe("Specifies whether to allow providers which collect data.");
export type ProviderDataCollection = z.infer<
  typeof ProviderDataCollectionSchema
>;
export const ProviderDataCollectionJsonSchema: JSONSchema = convert(
  ProviderDataCollectionSchema,
);

export const ProviderSortSchema = z
  .enum(["price", "throughput", "latency"])
  .describe("Specifies the sorting strategy for provider selection.");
export type ProviderSort = z.infer<typeof ProviderSortSchema>;
export const ProviderSortJsonSchema: JSONSchema = convert(ProviderSortSchema);

export const ProviderMaxPriceSchema = z.object({
  prompt: z
    .number()
    .optional()
    .nullable()
    .describe("Maximum price for prompt tokens."),
  completion: z
    .number()
    .optional()
    .nullable()
    .describe("Maximum price for completion tokens."),
  image: z
    .number()
    .optional()
    .nullable()
    .describe("Maximum price for image generation."),
  audio: z
    .number()
    .optional()
    .nullable()
    .describe("Maximum price for audio generation."),
  request: z
    .number()
    .optional()
    .nullable()
    .describe("Maximum price per request."),
});
export type ProviderMaxPrice = z.infer<typeof ProviderMaxPriceSchema>;
export const ProviderMaxPriceJsonSchema: JSONSchema = convert(
  ProviderMaxPriceSchema,
);

export const ProviderSchema = z
  .object({
    data_collection: ProviderDataCollectionSchema.optional().nullable(),
    zdr: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "Whether to enforce Zero Data Retention (ZDR) policies when selecting providers.",
      ),
    sort: ProviderSortSchema.optional().nullable(),
    max_price: ProviderMaxPriceSchema.optional().nullable(),
    preferred_min_throughput: z
      .number()
      .optional()
      .nullable()
      .describe("Preferred minimum throughput for the provider."),
    preferred_max_latency: z
      .number()
      .optional()
      .nullable()
      .describe("Preferred maximum latency for the provider."),
    min_throughput: z
      .number()
      .optional()
      .nullable()
      .describe("Minimum throughput for the provider."),
    max_latency: z
      .number()
      .optional()
      .nullable()
      .describe("Maximum latency for the provider."),
  })
  .describe("Options for selecting the upstream provider of this completion.")
  .meta({ title: "CompletionProvider" });
export type Provider = z.infer<typeof ProviderSchema>;
export const ProviderJsonSchema: JSONSchema = convert(ProviderSchema);
