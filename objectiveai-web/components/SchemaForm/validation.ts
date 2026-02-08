/**
 * Validation logic for SchemaForm inputs.
 *
 * Validates values against their schemas, returning structured errors
 * with paths for targeting specific fields.
 */

import type {
  InputSchema,
  FieldPath,
  ValidationError,
} from "./types";
import {
  isAnyOfSchema,
  isObjectSchema,
  isArraySchema,
  isStringSchema,
  isNumberSchema,
  isIntegerSchema,
  isBooleanSchema,
  isImageSchema,
  isAudioSchema,
  isVideoSchema,
  isFileSchema,
} from "./types";
import { joinPath, isImagePart, isAudioPart, isVideoPart, isFilePart } from "./utils";

/**
 * Validate a value against a schema.
 *
 * @param schema - The schema to validate against
 * @param value - The value to validate
 * @param path - The path to this value (for error targeting)
 * @param required - Whether this field is required
 * @returns Array of validation errors (empty if valid)
 */
export function validateValue(
  schema: InputSchema,
  value: unknown,
  path: FieldPath = "",
  required: boolean = false
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required check
  if (required && isEmptyValue(value)) {
    errors.push({
      path,
      message: "This field is required",
      type: "required",
    });
    // Don't validate further if required and empty
    return errors;
  }

  // Skip validation for null/undefined optional fields
  if (value === null || value === undefined) {
    return errors;
  }

  // AnyOf validation
  if (isAnyOfSchema(schema)) {
    return validateAnyOf(schema.anyOf, value, path);
  }

  // Type-specific validation
  if (isObjectSchema(schema)) {
    return [...errors, ...validateObject(schema, value, path)];
  }

  if (isArraySchema(schema)) {
    return [...errors, ...validateArray(schema, value, path)];
  }

  if (isStringSchema(schema)) {
    return [...errors, ...validateString(schema, value, path)];
  }

  if (isNumberSchema(schema)) {
    return [...errors, ...validateNumber(schema, value, path)];
  }

  if (isIntegerSchema(schema)) {
    return [...errors, ...validateInteger(schema, value, path)];
  }

  if (isBooleanSchema(schema)) {
    return [...errors, ...validateBoolean(value, path)];
  }

  if (isImageSchema(schema)) {
    return [...errors, ...validateImage(value, path)];
  }

  if (isAudioSchema(schema)) {
    return [...errors, ...validateAudio(value, path)];
  }

  if (isVideoSchema(schema)) {
    return [...errors, ...validateVideo(value, path)];
  }

  if (isFileSchema(schema)) {
    return [...errors, ...validateFile(value, path)];
  }

  return errors;
}

// ============================================================================
// Type-Specific Validators
// ============================================================================

function validateObject(
  schema: { properties: Record<string, InputSchema>; required?: string[] | null },
  value: unknown,
  path: FieldPath
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({
      path,
      message: "Expected an object",
      type: "type",
    });
    return errors;
  }

  const obj = value as Record<string, unknown>;
  const requiredSet = new Set(schema.required ?? []);

  // Validate each property
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const propPath = joinPath(path, key);
    const propValue = obj[key];
    const isRequired = requiredSet.has(key);

    errors.push(...validateValue(propSchema, propValue, propPath, isRequired));
  }

  return errors;
}

function validateArray(
  schema: { items: InputSchema; minItems?: number | null; maxItems?: number | null },
  value: unknown,
  path: FieldPath
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Array.isArray(value)) {
    errors.push({
      path,
      message: "Expected an array",
      type: "type",
    });
    return errors;
  }

  // Length constraints
  if (schema.minItems != null && value.length < schema.minItems) {
    errors.push({
      path,
      message: `Minimum ${schema.minItems} item${schema.minItems === 1 ? "" : "s"} required`,
      type: "constraint",
    });
  }

  if (schema.maxItems != null && value.length > schema.maxItems) {
    errors.push({
      path,
      message: `Maximum ${schema.maxItems} item${schema.maxItems === 1 ? "" : "s"} allowed`,
      type: "constraint",
    });
  }

  // Validate each item
  value.forEach((item, index) => {
    const itemPath = joinPath(path, index);
    errors.push(...validateValue(schema.items, item, itemPath, false));
  });

  return errors;
}

function validateString(
  schema: { enum?: string[] | null },
  value: unknown,
  path: FieldPath
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "string") {
    errors.push({
      path,
      message: "Expected a string",
      type: "type",
    });
    return errors;
  }

  // Enum constraint
  if (schema.enum && schema.enum.length > 0 && !schema.enum.includes(value)) {
    errors.push({
      path,
      message: `Must be one of: ${schema.enum.join(", ")}`,
      type: "constraint",
    });
  }

  return errors;
}

function validateNumber(
  schema: { minimum?: number | null; maximum?: number | null },
  value: unknown,
  path: FieldPath
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "number" || isNaN(value)) {
    errors.push({
      path,
      message: "Expected a number",
      type: "type",
    });
    return errors;
  }

  // Range constraints
  if (schema.minimum != null && value < schema.minimum) {
    errors.push({
      path,
      message: `Minimum value is ${schema.minimum}`,
      type: "constraint",
    });
  }

  if (schema.maximum != null && value > schema.maximum) {
    errors.push({
      path,
      message: `Maximum value is ${schema.maximum}`,
      type: "constraint",
    });
  }

  return errors;
}

function validateInteger(
  schema: { minimum?: number | null; maximum?: number | null },
  value: unknown,
  path: FieldPath
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "number" || isNaN(value) || !Number.isInteger(value)) {
    errors.push({
      path,
      message: "Expected an integer",
      type: "type",
    });
    return errors;
  }

  // Range constraints
  if (schema.minimum != null && value < schema.minimum) {
    errors.push({
      path,
      message: `Minimum value is ${schema.minimum}`,
      type: "constraint",
    });
  }

  if (schema.maximum != null && value > schema.maximum) {
    errors.push({
      path,
      message: `Maximum value is ${schema.maximum}`,
      type: "constraint",
    });
  }

  return errors;
}

function validateBoolean(value: unknown, path: FieldPath): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "boolean") {
    errors.push({
      path,
      message: "Expected a boolean",
      type: "type",
    });
  }

  return errors;
}

function validateImage(value: unknown, path: FieldPath): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isImagePart(value)) {
    errors.push({
      path,
      message: "Expected an image",
      type: "type",
    });
  }

  return errors;
}

function validateAudio(value: unknown, path: FieldPath): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isAudioPart(value)) {
    errors.push({
      path,
      message: "Expected audio",
      type: "type",
    });
  }

  return errors;
}

function validateVideo(value: unknown, path: FieldPath): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isVideoPart(value)) {
    errors.push({
      path,
      message: "Expected a video",
      type: "type",
    });
  }

  return errors;
}

function validateFile(value: unknown, path: FieldPath): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!isFilePart(value)) {
    errors.push({
      path,
      message: "Expected a file",
      type: "type",
    });
  }

  return errors;
}

function validateAnyOf(
  schemas: InputSchema[],
  value: unknown,
  path: FieldPath
): ValidationError[] {
  // Value must match at least one schema
  for (const schema of schemas) {
    const schemaErrors = validateValue(schema, value, path, false);
    if (schemaErrors.length === 0) {
      return []; // Found a match
    }
  }

  // No match found
  return [
    {
      path,
      message: "Value doesn't match any allowed type",
      type: "type",
    },
  ];
}

// ============================================================================
// Helpers
// ============================================================================

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  return false;
}

/**
 * Get errors for a specific path and its children.
 */
export function getErrorsForPath(
  errors: ValidationError[],
  path: FieldPath
): ValidationError[] {
  if (!path) {
    return errors;
  }
  return errors.filter(
    (e) => e.path === path || e.path.startsWith(`${path}.`) || e.path.startsWith(`${path}[`)
  );
}

/**
 * Check if a path has any errors.
 */
export function hasErrors(errors: ValidationError[], path: FieldPath): boolean {
  return getErrorsForPath(errors, path).length > 0;
}

/**
 * Get the first error message for a path.
 */
export function getErrorMessage(
  errors: ValidationError[],
  path: FieldPath
): string | undefined {
  const pathErrors = errors.filter((e) => e.path === path);
  return pathErrors[0]?.message;
}
