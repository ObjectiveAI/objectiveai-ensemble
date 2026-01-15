import z from "zod";

export const ResponseObjectSchema = z.literal("vector.completion");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
