import z from "zod";

export const ResponseObjectSchema = z
  .enum(["scalar.function.execution", "vector.function.execution"])
  .describe("The object type.");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
