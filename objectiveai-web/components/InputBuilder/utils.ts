/**
 * Utility functions for InputBuilder.
 *
 * Converts between the ContentItem[] internal model and
 * the InputValue wire format the backend expects.
 */

import type { InputValue } from "../SchemaForm/types";
import type { ContentItem } from "./types";
import {
  isImagePart,
  isAudioPart,
  isVideoPart,
  isFilePart,
} from "../SchemaForm/utils";

/**
 * Convert an InputValue (from state/API) into our internal ContentItem[] model.
 * Handles the case where the value is already an array, a single item, or an object.
 */
export function inputValueToContentItems(value: InputValue): ContentItem[] {
  if (value === null || value === undefined) return [];

  // If it's already an array, convert each element
  if (Array.isArray(value)) {
    return value.map(toContentItem);
  }

  // Single value — wrap as one item
  return [toContentItem(value)];
}

/**
 * Convert a single InputValue to a ContentItem.
 */
function toContentItem(value: InputValue): ContentItem {
  if (value === null || value === undefined) {
    return { type: "text", value: "" };
  }

  if (typeof value === "string") {
    return { type: "text", value };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return { type: "text", value: String(value) };
  }

  if (Array.isArray(value)) {
    // Nested array → group
    return { type: "group", children: value.map(toContentItem) };
  }

  // Object — check for RichContentPart types
  if (typeof value === "object") {
    if (isImagePart(value)) return { type: "image", value };
    if (isAudioPart(value)) return { type: "audio", value };
    if (isVideoPart(value)) return { type: "video", value };
    if (isFilePart(value)) return { type: "file", value };

    // Generic object — convert to a group of its values
    const entries = Object.entries(value as Record<string, InputValue>);
    return {
      type: "group",
      children: entries.map(([, v]) => toContentItem(v)),
    };
  }

  return { type: "text", value: "" };
}

/**
 * Convert our internal ContentItem[] model back to InputValue for the API.
 * Produces an array of mixed content that the backend accepts.
 */
export function contentItemsToInputValue(items: ContentItem[]): InputValue {
  if (items.length === 0) return [];
  return items.map(contentItemToValue);
}

function contentItemToValue(item: ContentItem): InputValue {
  switch (item.type) {
    case "text":
      return item.value;
    case "image":
      return item.value;
    case "audio":
      return item.value;
    case "video":
      return item.value;
    case "file":
      return item.value;
    case "group":
      return item.children.map(contentItemToValue);
  }
}

/**
 * Background colors for nested depth indicators.
 */
const DEPTH_BG_COLORS = [
  "transparent",
  "rgba(107, 92, 255, 0.02)",
  "rgba(107, 92, 255, 0.04)",
  "rgba(107, 92, 255, 0.06)",
];

export function getDepthBg(depth: number): string {
  return DEPTH_BG_COLORS[depth % DEPTH_BG_COLORS.length];
}
