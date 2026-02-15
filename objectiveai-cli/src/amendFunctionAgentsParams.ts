import { z } from "zod";

export const AmendFunctionAgentsParamsSchema = z.array(
  z.object({
    name: z.string(),
    spec: z.string(),
    overwriteInputSchema: z.record(z.string(), z.unknown()).optional(),
  }),
);

export type AmendFunctionAgentsParams = z.infer<
  typeof AmendFunctionAgentsParamsSchema
>;
