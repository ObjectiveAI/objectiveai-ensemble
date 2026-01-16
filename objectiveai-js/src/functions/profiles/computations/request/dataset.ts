import { InputValueSchema } from "src/functions/expression/input";
import z from "zod";

export const ScalarTargetSchema = z
  .object({
    type: z.literal("scalar"),
    value: z.number(),
  })
  .describe("A scalar target output. The desired output is this exact scalar.");
export type ScalarTarget = z.infer<typeof ScalarTargetSchema>;

export const VectorTargetSchema = z
  .object({
    type: z.literal("vector"),
    value: z.array(z.number()),
  })
  .describe("A vector target output. The desired output is this exact vector.");
export type VectorTarget = z.infer<typeof VectorTargetSchema>;

export const VectorWinnerTargetSchema = z
  .object({
    type: z.literal("vector_winner"),
    value: z.uint32(),
  })
  .describe(
    "A vector winner target output. The desired output is a vector where the highest value is at the specified index."
  );
export type VectorWinnerTarget = z.infer<typeof VectorWinnerTargetSchema>;

export const TargetSchema = z
  .discriminatedUnion("type", [
    ScalarTargetSchema,
    VectorTargetSchema,
    VectorWinnerTargetSchema,
  ])
  .describe("The target output for a given function input.");
export type Target = z.infer<typeof TargetSchema>;

export const DatasetItemSchema = z
  .object({
    input: InputValueSchema,
    target: TargetSchema,
  })
  .describe("A Function input and its corresponding target output.");
export type DatasetItem = z.infer<typeof DatasetItemSchema>;

export const DatasetSchema = z
  .array(DatasetItemSchema)
  .describe(
    "The dataset of input and target output pairs to use for computing the profile."
  );
export type Dataset = z.infer<typeof DatasetSchema>;
