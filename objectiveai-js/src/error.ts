import z from "zod";
import { JsonValueSchema, type JsonValue } from "./json";

export const ObjectiveAIErrorSchema = z
  .object({
    code: z.uint32().describe("The status code of the error."),
    message: JsonValueSchema.describe("The message or details of the error."),
  })
  .describe("An error returned by the ObjectiveAI API.")
  .meta({ title: "ObjectiveAIError" });
export type ObjectiveAIError = z.infer<typeof ObjectiveAIErrorSchema>;

/**
 * Error thrown when an API request fails.
 *
 * - `body`: The complete ObjectiveAIError (contains code and message)
 * - `message` (inherited from Error): JSON-serialized body for stack traces
 */
export class ObjectiveAIFetchError extends Error {
  readonly body: ObjectiveAIError;

  /**
   * Construct directly from an ObjectiveAIError (e.g., when streaming yields an error).
   */
  constructor(body: ObjectiveAIError);
  /**
   * Construct from a status code and optional raw body string.
   *
   * - If rawBody is missing/null/undefined, constructs with null message
   * - If rawBody parses to an ObjectiveAIError, uses that (ignores code param)
   * - Otherwise, constructs ObjectiveAIError with code and parsed JSON (or raw string) as message
   */
  constructor(code: number, rawBody?: string | null);
  constructor(codeOrBody: number | ObjectiveAIError, rawBody?: string | null) {
    let body: ObjectiveAIError;

    if (typeof codeOrBody !== "number") {
      // Direct ObjectiveAIError
      body = codeOrBody;
    } else if (rawBody === null || rawBody === undefined) {
      // No body, construct with null message
      body = { code: codeOrBody, message: null };
    } else {
      // Try to parse as JSON
      let parsed: JsonValue;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        // JSON parsing failed, use raw string as message
        body = { code: codeOrBody, message: rawBody };
        super(JSON.stringify(body));
        this.name = "ObjectiveAIFetchError";
        this.body = body;
        return;
      }

      // Check if parsed is already an ObjectiveAIError
      if (isObjectiveAIError(parsed)) {
        // Use the parsed ObjectiveAIError, ignore the code param
        body = parsed;
      } else {
        // Use parsed JSON as the message
        body = { code: codeOrBody, message: parsed };
      }
    }

    // Error.message is a JSON-serialized ObjectiveAIError for complete error info
    super(JSON.stringify(body));
    this.name = "ObjectiveAIFetchError";
    this.body = body;
  }

  /**
   * Convenience getter for the error code.
   */
  get code(): number {
    return this.body.code;
  }

  /**
   * Serialize to ObjectiveAIError JSON format.
   */
  toJSON(): ObjectiveAIError {
    return this.body;
  }
}

/**
 * Check if an object looks like an ObjectiveAI error response.
 */
export function isObjectiveAIError(obj: unknown): obj is ObjectiveAIError {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "code" in obj &&
    typeof (obj as { code: unknown }).code === "number" &&
    "message" in obj
  );
}
