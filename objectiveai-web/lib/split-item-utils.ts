/**
 * Utilities for simplifying and transforming split items from vector function execution.
 *
 * When displaying vector function results, we use `compileFunctionInputSplit` to get
 * the actual items being ranked. These utilities simplify those items for display:
 *
 * 1. removeCommonFields - Remove fields identical across ALL items
 * 2. flattenSingleField - Flatten single-field objects to their value
 * 3. simplifySplitItems - Combined pipeline
 * 4. toDisplayItem - Convert to discriminated display type
 */

/**
 * InputValue type matching the SDK's definition.
 * Represents any valid value that can be passed to/from functions.
 */
export type InputValue =
  | ImageRichContentPart
  | AudioRichContentPart
  | VideoRichContentPart
  | FileRichContentPart
  | { [key: string]: InputValue }
  | InputValue[]
  | string
  | number
  | boolean
  | null;

export interface ImageRichContentPart {
  type: "image_url";
  image_url: {
    url: string;
    detail?: string;
  };
}

export interface AudioRichContentPart {
  type: "input_audio";
  input_audio: {
    data: string;
    format: "wav" | "mp3";
  };
}

export interface VideoRichContentPart {
  type: "video_url" | "input_video";
  video_url: {
    url: string;
  };
}

export interface FileRichContentPart {
  type: "file";
  file: {
    file_data?: string;
    file_url?: string;
    filename?: string;
  };
}

/**
 * Discriminated union for display rendering.
 * Each type maps to a specific display mode.
 */
export type DisplayItem =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "image"; url: string; detail?: string }
  | { type: "audio"; data: string; format: "wav" | "mp3" }
  | { type: "video"; url: string }
  | { type: "file"; filename: string; data?: string; url?: string }
  | { type: "object"; value: Record<string, unknown> }
  | { type: "array"; value: unknown[] };

/**
 * Check if a value is a plain object (not an array, not null, not a rich content type).
 */
export function isPlainObject(value: unknown): value is Record<string, InputValue> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  // Check if it's a rich content type
  const obj = value as Record<string, unknown>;
  if (
    obj.type === "image_url" ||
    obj.type === "input_audio" ||
    obj.type === "video_url" ||
    obj.type === "input_video" ||
    obj.type === "file"
  ) {
    return false;
  }
  return true;
}

/**
 * Check if a value is a rich content type (image, audio, video, file).
 */
export function isRichContent(value: unknown): value is
  | ImageRichContentPart
  | AudioRichContentPart
  | VideoRichContentPart
  | FileRichContentPart {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    obj.type === "image_url" ||
    obj.type === "input_audio" ||
    obj.type === "video_url" ||
    obj.type === "input_video" ||
    obj.type === "file"
  );
}

/**
 * Deep equality check for InputValues.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return a === b;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
}

/**
 * Remove fields from objects that have the same value across ALL items.
 * This simplifies display by eliminating noise from common metadata.
 *
 * @example
 * Input: [{ a: 1, b: "same" }, { a: 2, b: "same" }]
 * Output: [{ a: 1 }, { a: 2 }]
 *
 * @example
 * Input: ["hello", "world"]
 * Output: ["hello", "world"] // Primitives unchanged
 */
export function removeCommonFields(items: InputValue[]): InputValue[] {
  if (items.length === 0) return items;

  // Only works on arrays of plain objects
  if (!items.every((item) => isPlainObject(item))) {
    return items;
  }

  const objects = items as Record<string, InputValue>[];
  if (objects.length === 0) return items;

  // Find keys that exist in ALL objects with the same value
  const firstKeys = Object.keys(objects[0]);
  const commonKeys = firstKeys.filter((key) => {
    const firstValue = objects[0][key];
    return objects.every((obj) => key in obj && deepEqual(obj[key], firstValue));
  });

  // If all keys are common, don't remove any (would result in empty objects)
  if (commonKeys.length === firstKeys.length) {
    return items;
  }

  // Remove common keys from all objects
  return objects.map((obj) => {
    const result: Record<string, InputValue> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!commonKeys.includes(key)) {
        result[key] = value;
      }
    }
    return result;
  });
}

/**
 * If all items are objects with exactly one field AND all have the same key,
 * flatten to just that field's value.
 *
 * @example
 * Input: [{ text: "hello" }, { text: "world" }]
 * Output: ["hello", "world"]
 *
 * @example
 * Input: [{ a: 1, b: 2 }, { a: 3, b: 4 }]
 * Output: [{ a: 1, b: 2 }, { a: 3, b: 4 }] // Multi-field, unchanged
 */
export function flattenSingleField(items: InputValue[]): InputValue[] {
  if (items.length === 0) return items;

  // Only works on arrays of plain objects
  if (!items.every((item) => isPlainObject(item))) {
    return items;
  }

  const objects = items as Record<string, InputValue>[];

  // Check if all objects have exactly one key
  const allSingleKey = objects.every((obj) => Object.keys(obj).length === 1);
  if (!allSingleKey) return items;

  // Check if all objects have the SAME key
  const firstKey = Object.keys(objects[0])[0];
  const sameKey = objects.every((obj) => Object.keys(obj)[0] === firstKey);
  if (!sameKey) return items;

  // Flatten: extract the single field's value
  return objects.map((obj) => obj[firstKey]);
}

/**
 * Simplify split items for display by:
 * 1. Removing fields that are identical across all items
 * 2. Flattening single-field objects to their values
 *
 * @example
 * Input: [{ text: "hello", version: 1 }, { text: "world", version: 1 }]
 * Output: ["hello", "world"]
 */
export function simplifySplitItems(items: InputValue[]): InputValue[] {
  if (items.length === 0) return items;

  // Step 1: Remove common fields
  let simplified = removeCommonFields(items);

  // Step 2: Flatten single-field objects
  simplified = flattenSingleField(simplified);

  return simplified;
}

/**
 * Convert an InputValue to a DisplayItem for rendering.
 * Handles all value types including media (images, audio, video, files).
 */
export function toDisplayItem(value: InputValue): DisplayItem {
  // Null
  if (value === null) {
    return { type: "string", value: "null" };
  }

  // Primitives
  if (typeof value === "string") {
    return { type: "string", value };
  }
  if (typeof value === "number") {
    return { type: "number", value };
  }
  if (typeof value === "boolean") {
    return { type: "boolean", value };
  }

  // Arrays
  if (Array.isArray(value)) {
    // Check if it's an array containing a single rich content part
    // (common pattern for media items)
    if (value.length === 1 && isRichContent(value[0])) {
      return toDisplayItem(value[0]);
    }
    return { type: "array", value };
  }

  // Rich content types
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    if (obj.type === "image_url" && typeof obj.image_url === "object" && obj.image_url !== null) {
      const imageUrl = obj.image_url as { url: string; detail?: string };
      return { type: "image", url: imageUrl.url, detail: imageUrl.detail };
    }

    if (obj.type === "input_audio" && typeof obj.input_audio === "object" && obj.input_audio !== null) {
      const audio = obj.input_audio as { data: string; format: "wav" | "mp3" };
      return { type: "audio", data: audio.data, format: audio.format };
    }

    if (
      (obj.type === "video_url" || obj.type === "input_video") &&
      typeof obj.video_url === "object" &&
      obj.video_url !== null
    ) {
      const video = obj.video_url as { url: string };
      return { type: "video", url: video.url };
    }

    if (obj.type === "file" && typeof obj.file === "object" && obj.file !== null) {
      const file = obj.file as { file_data?: string; file_url?: string; filename?: string };
      return {
        type: "file",
        filename: file.filename || "Unknown file",
        data: file.file_data,
        url: file.file_url,
      };
    }

    // Generic object
    return { type: "object", value: obj as Record<string, unknown> };
  }

  // Fallback
  return { type: "string", value: String(value) };
}

/**
 * Determine the best display mode for an array of items.
 *
 * - "simple": All items are strings or can be represented as short strings
 * - "mixed": Items have different types or some are complex
 * - "media": All items are media (images, audio, video, files)
 * - "complex": Items are complex objects that need JSON display
 */
export function getDisplayMode(
  items: InputValue[]
): "simple" | "mixed" | "media" | "complex" {
  if (items.length === 0) return "simple";

  const displayItems = items.map(toDisplayItem);
  const types = new Set(displayItems.map((d) => d.type));

  // Check if all media
  const mediaTypes = new Set(["image", "audio", "video", "file"]);
  const allMedia = displayItems.every((d) => mediaTypes.has(d.type));
  if (allMedia) return "media";

  // Check if mixed types (different display types)
  if (types.size > 1) return "mixed";

  // Check if all simple (string, number, boolean) - same type
  const simpleTypes = new Set(["string", "number", "boolean"]);
  const allSimple = displayItems.every((d) => simpleTypes.has(d.type));
  if (allSimple) return "simple";

  // Complex objects/arrays
  return "complex";
}
