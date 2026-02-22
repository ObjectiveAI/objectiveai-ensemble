import { Functions } from "objectiveai";

export type Modality = "image" | "audio" | "video" | "file" | "string";

const ALL_MODALITIES: Modality[] = ["image", "audio", "video", "file"];

export function collectModalities(
  schema: Functions.Expression.InputSchema,
): Set<Modality> {
  const result = new Set<Modality>();
  collectModalitiesRecursive(schema, result);
  return result;
}

function collectModalitiesRecursive(
  schema: Functions.Expression.InputSchema,
  result: Set<Modality>,
): void {
  if ("anyOf" in schema) {
    for (const option of schema.anyOf) {
      collectModalitiesRecursive(option, result);
    }
  } else if (schema.type === "object") {
    for (const propSchema of Object.values(schema.properties)) {
      collectModalitiesRecursive(propSchema, result);
    }
  } else if (schema.type === "array") {
    collectModalitiesRecursive(schema.items, result);
  } else if (schema.type === "string") {
    result.add("string");
  } else if (ALL_MODALITIES.includes(schema.type as Modality)) {
    result.add(schema.type as Modality);
  }
}

