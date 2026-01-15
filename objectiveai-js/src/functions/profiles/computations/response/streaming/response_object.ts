import z from "zod";

export const ResponseObjectSchema = z.literal(
  "function.profile.computation.chunk"
);
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
