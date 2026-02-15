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
  .describe(
    "A list of possible assistant responses which the LLMs in the Ensemble will vote on. The output scores will be of the same length, each corresponding to one response. The winner is the response with the highest score.",
  )
  .meta({ title: "VectorResponses" });
export type VectorResponses = z.infer<typeof VectorResponsesSchema>;

export const VectorResponsesExpressionSchema = z
  .union([
    z
      .array(VectorResponseExpressionSchema)
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

// Quality Scalar Vector Responses (content parts only, no plain strings; for scalar parent functions)

export const QualityScalarVectorResponseSchema =
  RichContentPartsSchema.describe(VectorResponseSchema.description!);
export type QualityScalarVectorResponse = z.infer<
  typeof QualityScalarVectorResponseSchema
>;

export const QualityScalarVectorResponseExpressionSchema = z
  .union([
    QualityScalarVectorResponseSchema,
    ExpressionSchema.describe(
      "An expression which evaluates to an array of content parts. Receives: `input`, `map` (if mapped).",
    ),
  ])
  .describe(VectorResponseSchema.description!);
export type QualityScalarVectorResponseExpression = z.infer<
  typeof QualityScalarVectorResponseExpressionSchema
>;

export const QualityScalarVectorResponsesSchema = z
  .array(QualityScalarVectorResponseSchema)
  .describe(VectorResponsesSchema.description!);
export type QualityScalarVectorResponses = z.infer<
  typeof QualityScalarVectorResponsesSchema
>;

export const QualityScalarVectorResponsesExpressionSchema = z
  .array(QualityScalarVectorResponseExpressionSchema)
  .describe(VectorResponsesSchema.description!);
export type QualityScalarVectorResponsesExpression = z.infer<
  typeof QualityScalarVectorResponsesExpressionSchema
>;

// Quality Vector Vector Responses (must be a single expression; for vector parent functions)

export const QualityVectorVectorResponsesExpressionSchema =
  ExpressionSchema.describe(
    "An expression which evaluates to an array of possible assistant responses. " +
      "Vector function responses must be a single expression, not a fixed array. " +
      "Receives: `input`, `map` (if mapped).",
  );
export type QualityVectorVectorResponsesExpression = z.infer<
  typeof QualityVectorVectorResponsesExpressionSchema
>;
