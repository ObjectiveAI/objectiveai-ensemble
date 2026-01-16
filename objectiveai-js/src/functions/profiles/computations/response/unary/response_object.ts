import z from "zod";

export const ResponseObjectSchema = z.literal("function.profile.computation");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
