import z from "zod";

export const ResponseObjectSchema = z.literal("chat.completion");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
