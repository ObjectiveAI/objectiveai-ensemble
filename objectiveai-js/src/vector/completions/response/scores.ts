import z from "zod";

export const ScoresSchema = z
  .array(z.number())
  .describe(
    "The scores for each response in the request, aggregated from the votes of the Ensemble LLMs."
  );
export type Scores = z.infer<typeof ScoresSchema>;

export namespace Scores {
  export function merged(a: Scores, b: Scores): [Scores, boolean] {
    if (a.length === b.length) {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return [b, true];
        }
      }
      return [a, false];
    } else {
      return [b, true];
    }
  }
}
