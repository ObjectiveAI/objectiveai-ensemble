import z from "zod";
import { convert, type JSONSchema } from "./json_schema";
import {
  Expression,
  ExpressionSchema,
} from "./functions/expression/expression";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export const JsonValueSchema: z.ZodType<JsonValue> = z
  .lazy(() =>
    z.union([
      z.null().describe("Null").meta({ title: "JsonValueNull" }),
      z.boolean().describe("Boolean").meta({ title: "JsonValueBoolean" }),
      z.number().describe("Number").meta({ title: "JsonValueNumber" }),
      z.string().describe("String").meta({ title: "JsonValueString" }),
      z
        .array(
          JsonValueSchema.meta({
            title: "JsonValue",
            recursive: true,
          })
        )
        .describe("Array")
        .meta({ title: "JsonValueArray" }),
      z
        .record(
          z.string(),
          JsonValueSchema.meta({
            title: "JsonValue",
            recursive: true,
          })
        )
        .describe("Object")
        .meta({ title: "JsonValueObject" }),
    ])
  )
  .describe("A JSON value.")
  .meta({ title: "JsonValue" });
export const JsonValueJsonSchema: JSONSchema = convert(JsonValueSchema);

export type JsonValueExpression =
  | null
  | boolean
  | number
  | string
  | (Expression | JsonValueExpression)[]
  | { [key: string]: Expression | JsonValueExpression }
  | Expression;
export const JsonValueExpressionSchema: z.ZodType<JsonValueExpression> = z
  .lazy(() =>
    z.union([
      z.null().describe("Null").meta({ title: "JsonValueNull" }),
      z.boolean().describe("Boolean").meta({ title: "JsonValueBoolean" }),
      z.number().describe("Number").meta({ title: "JsonValueNumber" }),
      z.string().describe("String").meta({ title: "JsonValueString" }),
      z
        .array(
          JsonValueExpressionSchema.meta({
            title: "JsonValueExpression",
            recursive: true,
          })
        )
        .describe("Array (values may be expressions)")
        .meta({ title: "JsonValueExpressionArray" }),
      z
        .record(
          z.string(),
          JsonValueExpressionSchema.meta({
            title: "JsonValueExpression",
            recursive: true,
          })
        )
        .describe("Object (values may be expressions)")
        .meta({ title: "JsonValueExpressionObject" }),
      ExpressionSchema.describe(
        "An expression which evaluates to a JSON value. Receives: `input`, `map` (if mapped)."
      ),
    ])
  )
  .describe(JsonValueSchema.description!)
  .meta({ title: "JsonValueExpression" });
export const JsonValueExpressionJsonSchema: JSONSchema = convert(JsonValueExpressionSchema);
