import {
  ExpressionSchema,
  InputMapsExpressionSchema as CoreInputMapsExpressionSchema,
} from "src/functions/expression";
import z from "zod";

export const InputMapsExpressionSchema = z
  .array(
    ExpressionSchema.describe(
      "An expression evaluating to a 1D array of Inputs. This becomes one sub-array in the input maps, referenced by its position index. Receives: `input`.",
    ),
  )
  .describe(CoreInputMapsExpressionSchema.description!);
export type InputMapsExpression = z.infer<typeof InputMapsExpressionSchema>;
