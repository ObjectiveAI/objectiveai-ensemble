import z from "zod";

export const ResultSchema = z.union([
  z.object({
    ok: z.literal(true),
    value: z.string(),
    error: z.undefined(),
  }),
  z.object({
    ok: z.literal(false),
    value: z.undefined(),
    error: z.string(),
  }),
]);
export type Result<T = string> =
  | {
      ok: true;
      value: T;
      error: undefined;
    }
  | {
      ok: false;
      value: undefined;
      error: string;
    };
