import z from "zod";
import { convert, type JSONSchema } from "../../../../json_schema";

export const ResponseObjectSchema = z.literal("vector.completion");
export type ResponseObject = z.infer<typeof ResponseObjectSchema>;
export const ResponseObjectJsonSchema: JSONSchema = convert(ResponseObjectSchema);
