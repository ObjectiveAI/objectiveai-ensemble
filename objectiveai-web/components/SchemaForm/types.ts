/**
 * Type definitions for the SchemaForm component system.
 *
 * These types mirror the ObjectiveAI SDK's input schema types,
 * providing full type safety for dynamic form generation.
 */

// ============================================================================
// Input Schema Types
// ============================================================================

/**
 * Root input schema type - matches SDK InputSchema
 */
export type InputSchema =
  | ObjectInputSchema
  | ArrayInputSchema
  | StringInputSchema
  | NumberInputSchema
  | IntegerInputSchema
  | BooleanInputSchema
  | ImageInputSchema
  | AudioInputSchema
  | VideoInputSchema
  | FileInputSchema
  | AnyOfInputSchema;

export interface ObjectInputSchema {
  type: "object";
  description?: string | null;
  properties: Record<string, InputSchema>;
  required?: string[] | null;
}

export interface ArrayInputSchema {
  type: "array";
  description?: string | null;
  minItems?: number | null;
  maxItems?: number | null;
  items: InputSchema;
}

export interface StringInputSchema {
  type: "string";
  description?: string | null;
  enum?: string[] | null;
}

export interface NumberInputSchema {
  type: "number";
  description?: string | null;
  minimum?: number | null;
  maximum?: number | null;
}

export interface IntegerInputSchema {
  type: "integer";
  description?: string | null;
  minimum?: number | null;
  maximum?: number | null;
}

export interface BooleanInputSchema {
  type: "boolean";
  description?: string | null;
}

export interface ImageInputSchema {
  type: "image";
  description?: string | null;
}

export interface AudioInputSchema {
  type: "audio";
  description?: string | null;
}

export interface VideoInputSchema {
  type: "video";
  description?: string | null;
}

export interface FileInputSchema {
  type: "file";
  description?: string | null;
}

export interface AnyOfInputSchema {
  anyOf: InputSchema[];
  description?: string | null;
}

// ============================================================================
// Input Value Types
// ============================================================================

/**
 * Rich content part types for media inputs
 */
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
 * InputValue type - any valid value that can be passed to/from functions
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

// ============================================================================
// Form Field Types
// ============================================================================

/**
 * Field path for nested state management.
 * Uses dot notation for objects and bracket notation for arrays.
 * Example: "user.addresses[0].street"
 */
export type FieldPath = string;

/**
 * Validation error structure
 */
export interface ValidationError {
  path: FieldPath;
  message: string;
  type: "required" | "type" | "constraint" | "format";
}

/**
 * Common props for all field components
 */
export interface FieldProps<T = unknown> {
  /** The schema defining this field's type and constraints */
  schema: InputSchema;
  /** Current value of the field */
  value: T;
  /** Callback when value changes */
  onChange: (value: T) => void;
  /** Dot-notation path to this field */
  path: FieldPath;
  /** Validation errors for this field and its children */
  errors: ValidationError[];
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Whether this field is required */
  required?: boolean;
  /** Whether the form is in mobile layout */
  isMobile?: boolean;
  /** Nesting depth (for visual hierarchy) */
  depth?: number;
}

/**
 * Root form builder props
 */
export interface SchemaFormBuilderProps {
  /** The input schema defining the form structure */
  schema: InputSchema;
  /** Current form value */
  value: InputValue;
  /** Callback when value changes */
  onChange: (value: InputValue) => void;
  /** Callback when validation runs */
  onValidate?: (errors: ValidationError[]) => void;
  /** Whether the form is disabled */
  disabled?: boolean;
  /** Additional CSS class name */
  className?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isObjectSchema(schema: InputSchema): schema is ObjectInputSchema {
  return "type" in schema && schema.type === "object";
}

export function isArraySchema(schema: InputSchema): schema is ArrayInputSchema {
  return "type" in schema && schema.type === "array";
}

export function isStringSchema(schema: InputSchema): schema is StringInputSchema {
  return "type" in schema && schema.type === "string";
}

export function isNumberSchema(schema: InputSchema): schema is NumberInputSchema {
  return "type" in schema && schema.type === "number";
}

export function isIntegerSchema(schema: InputSchema): schema is IntegerInputSchema {
  return "type" in schema && schema.type === "integer";
}

export function isBooleanSchema(schema: InputSchema): schema is BooleanInputSchema {
  return "type" in schema && schema.type === "boolean";
}

export function isImageSchema(schema: InputSchema): schema is ImageInputSchema {
  return "type" in schema && schema.type === "image";
}

export function isAudioSchema(schema: InputSchema): schema is AudioInputSchema {
  return "type" in schema && schema.type === "audio";
}

export function isVideoSchema(schema: InputSchema): schema is VideoInputSchema {
  return "type" in schema && schema.type === "video";
}

export function isFileSchema(schema: InputSchema): schema is FileInputSchema {
  return "type" in schema && schema.type === "file";
}

export function isAnyOfSchema(schema: InputSchema): schema is AnyOfInputSchema {
  return "anyOf" in schema;
}

/**
 * Get a human-readable label for a schema type
 */
export function getSchemaTypeLabel(schema: InputSchema): string {
  if (isAnyOfSchema(schema)) {
    return "Union";
  }
  switch (schema.type) {
    case "object":
      return "Object";
    case "array":
      return "Array";
    case "string":
      return "String";
    case "number":
      return "Number";
    case "integer":
      return "Integer";
    case "boolean":
      return "Boolean";
    case "image":
      return "Image";
    case "audio":
      return "Audio";
    case "video":
      return "Video";
    case "file":
      return "File";
    default:
      return "Unknown";
  }
}
