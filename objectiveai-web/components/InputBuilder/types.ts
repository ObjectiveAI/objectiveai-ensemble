/**
 * Type definitions for the InputBuilder component system.
 *
 * Model: Each input is a list of content items. Each content item is
 * text, image, audio, video, or file. Any content item can also contain
 * a nested list of content items (infinite depth).
 */

import type {
  InputValue,
  InputSchema,
  ValidationError,
  ImageRichContentPart,
  AudioRichContentPart,
  VideoRichContentPart,
  FileRichContentPart,
} from "../SchemaForm/types";

// Re-export for convenience
export type {
  InputValue,
  InputSchema,
  ValidationError,
  ImageRichContentPart,
  AudioRichContentPart,
  VideoRichContentPart,
  FileRichContentPart,
};

/**
 * The types of content a user can add to a content list.
 */
export type ContentType = "text" | "image" | "audio" | "video" | "file" | "group";

/**
 * A single content item in the list.
 * - text: plain string
 * - image/audio/video/file: RichContentPart
 * - group: nested array of ContentItem (infinite recursion)
 */
export type ContentItem =
  | { type: "text"; value: string }
  | { type: "image"; value: ImageRichContentPart | null }
  | { type: "audio"; value: AudioRichContentPart | null }
  | { type: "video"; value: VideoRichContentPart | null }
  | { type: "file"; value: FileRichContentPart | null }
  | { type: "group"; children: ContentItem[] };

/**
 * Props for the root InputBuilder component.
 */
export interface InputBuilderProps {
  value: InputValue;
  onChange: (value: InputValue) => void;
  /** When present and object-typed, renders labeled fields from the schema properties. */
  schema?: InputSchema | null;
  disabled?: boolean;
  /** When true, only text inputs are shown (no image/audio/video/file upload buttons). */
  textOnly?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

/**
 * Props for a ContentList (recursive content container).
 */
export interface ContentListProps {
  items: ContentItem[];
  onChange: (items: ContentItem[]) => void;
  disabled?: boolean;
  textOnly?: boolean;
  isMobile?: boolean;
  depth: number;
}
