import z from "zod";
import { convert, type JSONSchema } from "../json_schema";

export const ProviderQuantizationSchema = z
  .enum([
    "int4",
    "int8",
    "fp4",
    "fp6",
    "fp8",
    "fp16",
    "bf16",
    "fp32",
    "unknown",
  ])
  .describe("An LLM quantization.")
  .meta({ title: "ProviderQuantization" });
export type ProviderQuantization = z.infer<typeof ProviderQuantizationSchema>;
export const ProviderQuantizationJsonSchema: JSONSchema = convert(
  ProviderQuantizationSchema,
);

export const ProviderSchema = z
  .object({
    allow_fallbacks: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "Whether to allow fallback providers if the preferred provider is unavailable.",
      ),
    require_parameters: z
      .boolean()
      .optional()
      .nullable()
      .describe(
        "Whether to require that the provider supports all specified parameters.",
      ),
    order: z
      .array(z.string().meta({ title: "ProviderName" }))
      .optional()
      .nullable()
      .describe(
        "An ordered list of provider names to use when selecting a provider for this model.",
      ),
    only: z
      .array(z.string().meta({ title: "ProviderName" }))
      .optional()
      .nullable()
      .describe(
        "A list of provider names to restrict selection to when selecting a provider for this model.",
      ),
    ignore: z
      .array(z.string().meta({ title: "ProviderName" }))
      .optional()
      .nullable()
      .describe(
        "A list of provider names to ignore when selecting a provider for this model.",
      ),
    quantizations: z
      .array(ProviderQuantizationSchema)
      .optional()
      .nullable()
      .describe(
        "Specifies the quantizations to allow when selecting providers for this model.",
      ),
  })
  .describe("Options for selecting the upstream provider of this model.")
  .meta({ title: "EnsembleLlmProvider" });
export type Provider = z.infer<typeof ProviderSchema>;
export const ProviderJsonSchema: JSONSchema = convert(ProviderSchema);
