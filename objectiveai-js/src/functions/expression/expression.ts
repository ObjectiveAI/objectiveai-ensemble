import z from "zod";
import { convert, type JSONSchema } from "../../json_schema";

export const JMESPathExpressionSchema = z
  .object({
    $jmespath: z.string().describe("A JMESPath expression."),
  })
  .strict()
  .describe("A JMESPath expression which evaluates to a value.")
  .meta({ title: "JMESPathExpression" });
export type JMESPathExpression = z.infer<typeof JMESPathExpressionSchema>;
export const JMESPathExpressionJsonSchema: JSONSchema = convert(JMESPathExpressionSchema);

export const StarlarkExpressionSchema = z
  .object({
    $starlark: z.string().describe("A Starlark expression."),
  })
  .strict()
  .describe("A Starlark expression which evaluates to a value.")
  .meta({ title: "StarlarkExpression" });
export type StarlarkExpression = z.infer<typeof StarlarkExpressionSchema>;
export const StarlarkExpressionJsonSchema: JSONSchema = convert(StarlarkExpressionSchema);

export const ExpressionSchema = z
  .union([JMESPathExpressionSchema, StarlarkExpressionSchema])
  .describe("An expression (JMESPath or Starlark) which evaluates to a value.")
  .meta({ title: "Expression" });
export type Expression = z.infer<typeof ExpressionSchema>;
export const ExpressionJsonSchema: JSONSchema = convert(ExpressionSchema);
