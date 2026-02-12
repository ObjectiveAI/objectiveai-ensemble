import { z } from "zod";

export const AmendFunctionAgentsParamsSchema = z.array(
  z.object({
    name: z.string(),
    spec: z.string(),
  }),
);

export type AmendFunctionAgentsParams = z.infer<
  typeof AmendFunctionAgentsParamsSchema
>;
