import z from "zod";

export const JMESPathExpressionSchema = z
  .object({
    $jmespath: z.string().describe("A JMESPath expression."),
  })
  .describe("A JMESPath expression which evaluates to a value.")
  .meta({ title: "JMESPathExpression" });
export type JMESPathExpression = z.infer<typeof JMESPathExpressionSchema>;

export const StarlarkExpressionSchema = z
  .object({
    $starlark: z.string().describe("A Starlark expression."),
  })
  .describe("A Starlark expression which evaluates to a value.")
  .meta({ title: "StarlarkExpression" });
export type StarlarkExpression = z.infer<typeof StarlarkExpressionSchema>;

export const ExpressionSchema = z
  .union([JMESPathExpressionSchema, StarlarkExpressionSchema])
  .describe("An expression (JMESPath or Starlark) which evaluates to a value.")
  .meta({ title: "Expression" });
export type Expression = z.infer<typeof ExpressionSchema>;
