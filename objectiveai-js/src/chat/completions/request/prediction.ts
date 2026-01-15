import z from "zod";

export const PredictionContentPartSchema = z
  .object({
    type: z.literal("text"),
    text: z.string(),
  })
  .describe("A part of the predicted content.")
  .meta({ title: "PredictionContentPart" });
export type PredictionContentPart = z.infer<typeof PredictionContentPartSchema>;

export const PredictionContentSchema = z.union([
  z.string().meta({ title: "PredictionContentText" }),
  z
    .array(PredictionContentPartSchema)
    .meta({ title: "PredictionContentParts" }),
]);
export type PredictionContent = z.infer<typeof PredictionContentSchema>;

export const PredictionSchema = z
  .object({
    type: z.literal("content"),
    content: PredictionContentSchema,
  })
  .describe(
    "Configuration for a Predicted Output, which can greatly improve response times when large parts of the model response are known ahead of time. This is most common when you are regenerating a file with only minor changes to most of the content."
  );
export type Prediction = z.infer<typeof PredictionSchema>;
