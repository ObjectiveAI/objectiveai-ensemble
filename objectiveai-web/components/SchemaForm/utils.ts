/**
 * Utility functions for SchemaForm component.
 *
 * Provides path-based state management, default value generation,
 * and other helpers for working with nested schemas.
 */

import type {
  InputSchema,
  InputValue,
  ImageRichContentPart,
  AudioRichContentPart,
  VideoRichContentPart,
  FileRichContentPart,
} from "./types";
import { isAnyOfSchema } from "./types";

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Parse a path string into segments.
 *
 * @example
 * parsePath("user.addresses[0].street")
 * // Returns: ["user", "addresses", "0", "street"]
 */
export function parsePath(path: string): string[] {
  if (!path) return [];

  const segments: string[] = [];
  let current = "";

  for (let i = 0; i < path.length; i++) {
    const char = path[i];

    if (char === ".") {
      if (current) {
        segments.push(current);
        current = "";
      }
    } else if (char === "[") {
      if (current) {
        segments.push(current);
        current = "";
      }
    } else if (char === "]") {
      if (current) {
        segments.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

/**
 * Join path segments into a path string.
 *
 * @example
 * joinPath("user", "addresses") // "user.addresses"
 * joinPath("items", 0) // "items[0]"
 * joinPath("", "name") // "name"
 */
export function joinPath(base: string, key: string | number): string {
  if (typeof key === "number") {
    return base ? `${base}[${key}]` : `[${key}]`;
  }

  return base ? `${base}.${key}` : key;
}

/**
 * Get a value at a path from a nested object.
 *
 * @example
 * getAtPath({ user: { name: "Alice" } }, "user.name")
 * // Returns: "Alice"
 */
export function getAtPath(obj: unknown, path: string): unknown {
  if (!path) return obj;

  const segments = parsePath(path);
  let current: unknown = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a value at a path in a nested object (immutably).
 * Returns a new object with the value updated.
 *
 * @example
 * setAtPath({ user: { name: "Alice" } }, "user.name", "Bob")
 * // Returns: { user: { name: "Bob" } }
 */
export function setAtPath<T>(obj: T, path: string, value: unknown): T {
  if (!path) return value as T;

  const segments = parsePath(path);
  return setAtPathRecursive(obj, segments, 0, value) as T;
}

function setAtPathRecursive(
  obj: unknown,
  segments: string[],
  index: number,
  value: unknown
): unknown {
  if (index === segments.length) {
    return value;
  }

  const segment = segments[index];
  const isArrayIndex = /^\d+$/.test(segment);

  if (isArrayIndex) {
    const arr = Array.isArray(obj) ? [...obj] : [];
    const idx = parseInt(segment, 10);
    arr[idx] = setAtPathRecursive(arr[idx], segments, index + 1, value);
    return arr;
  } else {
    const objCopy =
      typeof obj === "object" && obj !== null
        ? { ...(obj as Record<string, unknown>) }
        : {};
    objCopy[segment] = setAtPathRecursive(objCopy[segment], segments, index + 1, value);
    return objCopy;
  }
}

// ============================================================================
// Default Value Generation
// ============================================================================

/**
 * Generate a default value for a schema type.
 */
export function getDefaultValue(schema: InputSchema): InputValue {
  if (isAnyOfSchema(schema)) {
    // Use first option's default
    return getDefaultValue(schema.anyOf[0]);
  }

  switch (schema.type) {
    case "object":
      return Object.fromEntries(
        Object.entries(schema.properties).map(([key, propSchema]) => [
          key,
          getDefaultValue(propSchema),
        ])
      );

    case "array":
      // Create array with minimum required items
      const minItems = schema.minItems ?? 0;
      const items = [];
      for (let i = 0; i < minItems; i++) {
        items.push(getDefaultValue(schema.items));
      }
      return items;

    case "string":
      // Use first enum value if available
      return schema.enum?.[0] ?? "";

    case "number":
    case "integer":
      // Use minimum if set, otherwise 0
      return schema.minimum ?? 0;

    case "boolean":
      return false;

    case "image":
    case "audio":
    case "video":
    case "file":
      // Media types start as null (no file selected)
      return null;

    default:
      return null;
  }
}

// ============================================================================
// Schema Matching
// ============================================================================

/**
 * Detect which schema in an anyOf array best matches a given value.
 * Returns the index of the matching schema, or 0 if no match found.
 */
export function detectMatchingSchemaIndex(
  schemas: InputSchema[],
  value: InputValue
): number {
  if (value === null || value === undefined) {
    return 0;
  }

  for (let i = 0; i < schemas.length; i++) {
    if (valueMatchesSchema(value, schemas[i])) {
      return i;
    }
  }

  return 0;
}

/**
 * Check if a value matches a schema type (basic type check).
 */
export function valueMatchesSchema(value: InputValue, schema: InputSchema): boolean {
  if (value === null || value === undefined) {
    return true; // Null can match any schema
  }

  if (isAnyOfSchema(schema)) {
    return schema.anyOf.some((s) => valueMatchesSchema(value, s));
  }

  switch (schema.type) {
    case "string":
      return typeof value === "string";

    case "number":
    case "integer":
      return typeof value === "number";

    case "boolean":
      return typeof value === "boolean";

    case "array":
      return Array.isArray(value);

    case "object":
      return (
        typeof value === "object" &&
        !Array.isArray(value) &&
        !isRichContentPart(value)
      );

    case "image":
      return isImagePart(value);

    case "audio":
      return isAudioPart(value);

    case "video":
      return isVideoPart(value);

    case "file":
      return isFilePart(value);

    default:
      return false;
  }
}

// ============================================================================
// Rich Content Type Guards
// ============================================================================

export function isRichContentPart(
  value: unknown
): value is
  | ImageRichContentPart
  | AudioRichContentPart
  | VideoRichContentPart
  | FileRichContentPart {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.type === "image_url" ||
    obj.type === "input_audio" ||
    obj.type === "video_url" ||
    obj.type === "input_video" ||
    obj.type === "file"
  );
}

export function isImagePart(value: unknown): value is ImageRichContentPart {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return obj.type === "image_url";
}

export function isAudioPart(value: unknown): value is AudioRichContentPart {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return obj.type === "input_audio";
}

export function isVideoPart(value: unknown): value is VideoRichContentPart {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return obj.type === "video_url" || obj.type === "input_video";
}

export function isFilePart(value: unknown): value is FileRichContentPart {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return obj.type === "file";
}

// ============================================================================
// File Utilities
// ============================================================================

/**
 * Convert a File to a base64 data URL.
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract just the base64 part (after the data URL prefix)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Detect audio format from mime type.
 */
export function getAudioFormat(mimeType: string): "wav" | "mp3" {
  if (mimeType.includes("mp3") || mimeType.includes("mpeg")) {
    return "mp3";
  }
  return "wav";
}
