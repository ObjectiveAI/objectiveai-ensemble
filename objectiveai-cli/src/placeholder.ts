import z from "zod";

export const PlaceholderTaskSpecsSchema = z.array(
  z.union([z.string().nonempty(), z.null()]),
);
export type PlaceholderTaskSpecs = z.infer<typeof PlaceholderTaskSpecsSchema>;
