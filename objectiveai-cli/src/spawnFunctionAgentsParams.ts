import { z } from "zod";

export const SpawnFunctionAgentsParamsSchema = z.array(
  z.object({
    name: z.string(),
    spec: z.string(),
  }),
);

export type SpawnFunctionAgentsParams = z.infer<
  typeof SpawnFunctionAgentsParamsSchema
>;
