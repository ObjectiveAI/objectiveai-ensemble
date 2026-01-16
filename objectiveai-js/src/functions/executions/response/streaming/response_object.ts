import z from "zod";

export const ResponseObjectSchema = z
  .enum(["scalar.function.execution.chunk", "vector.function.execution.chunk"])
  .describe("The object type.");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
