import z from "zod";

export const ResponseObjectSchema = z.literal("vector.completion.chunk");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
