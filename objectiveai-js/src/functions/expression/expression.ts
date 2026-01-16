import z from "zod";

export const ExpressionSchema = z
  .object({
    $jmespath: z.string().describe("A JMESPath expression."),
  })
  .describe("An expression which evaluates to a value.")
  .meta({ title: "Expression" });
export type Expression = z.infer<typeof ExpressionSchema>;
