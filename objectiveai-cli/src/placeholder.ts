import z from "zod";

export const PlaceholderTaskSpecEntrySchema = z.object({
  spec: z.string().nonempty(),
  token: z.string().nonempty(),
});
export type PlaceholderTaskSpecEntry = z.infer<
  typeof PlaceholderTaskSpecEntrySchema
>;

export const PlaceholderTaskSpecsSchema = z.array(
  z.union([PlaceholderTaskSpecEntrySchema, z.null()]),
);
export type PlaceholderTaskSpecs = z.infer<typeof PlaceholderTaskSpecsSchema>;
