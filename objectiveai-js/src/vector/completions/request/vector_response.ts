import {
  RichContentPartsSchema,
  RichContentSchema,
} from "src/chat/completions/request/message";
import { ExpressionSchema } from "src/functions/expression/expression";
import z from "zod";

export const VectorResponseSchema = RichContentSchema.describe(
  "A possible assistant response. The LLMs in the Ensemble may vote for this option.",
).meta({ title: "VectorResponse" });
export type VectorResponse = z.infer<typeof VectorResponseSchema>;

export const VectorResponseExpressionSchema = z
  .union([
    VectorResponseSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to a possible assistant response. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(VectorResponseSchema.description!)
  .meta({ title: "VectorResponseExpression" });
export type VectorResponseExpression = z.infer<
  typeof VectorResponseExpressionSchema
>;

export const VectorResponsesSchema = z
  .array(VectorResponseSchema)
  .min(2)
  .describe(
    "A list of possible assistant responses which the LLMs in the Ensemble will vote on. The output scores will be of the same length, each corresponding to one response. The winner is the response with the highest score.",
  )
  .meta({ title: "VectorResponses" });
export type VectorResponses = z.infer<typeof VectorResponsesSchema>;

export const VectorResponsesExpressionSchema = z
  .union([
    z
      .array(VectorResponseExpressionSchema)
      .min(1)
      .describe(VectorResponsesSchema.description!)
      .meta({ title: "VectorResponseExpressions" }),
    ExpressionSchema.describe(
      "An expression which evaluates to an array of possible assistant responses. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(VectorResponsesSchema.description!)
  .meta({ title: "VectorResponsesExpression" });
export type VectorResponsesExpression = z.infer<
  typeof VectorResponsesExpressionSchema
>;

// Quality Vector Responses (content parts only, no plain strings)

export const QualityVectorResponseSchema = RichContentPartsSchema.describe(
  VectorResponseSchema.description!,
);
export type QualityVectorResponse = z.infer<typeof QualityVectorResponseSchema>;

export const QualityVectorResponseExpressionSchema = z
  .union([
    QualityVectorResponseSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to an array of content parts. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(VectorResponseSchema.description!);
export type QualityVectorResponseExpression = z.infer<
  typeof QualityVectorResponseExpressionSchema
>;

export const QualityVectorResponsesSchema = z
  .array(QualityVectorResponseSchema)
  .min(2)
  .describe(VectorResponsesSchema.description!);
export type QualityVectorResponses = z.infer<
  typeof QualityVectorResponsesSchema
>;

export const QualityVectorResponsesExpressionSchema = z
  .array(QualityVectorResponseExpressionSchema)
  .min(2)
  .describe(VectorResponsesSchema.description!);
export type QualityVectorResponsesExpression = z.infer<
  typeof QualityVectorResponsesExpressionSchema
>;
