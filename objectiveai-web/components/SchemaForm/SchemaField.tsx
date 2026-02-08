"use client";

import type { FieldProps, InputValue } from "./types";
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

// Field components
import StringField from "./fields/StringField";
import NumberField from "./fields/NumberField";
import IntegerField from "./fields/IntegerField";
import BooleanField from "./fields/BooleanField";
import ImageField from "./fields/ImageField";
import AudioField from "./fields/AudioField";
import VideoField from "./fields/VideoField";
import FileField from "./fields/FileField";
import ObjectField from "./fields/ObjectField";
import ArrayField from "./fields/ArrayField";
import AnyOfField from "./fields/AnyOfField";

/**
 * SchemaField - The main dispatcher component for schema-driven forms.
 *
 * Routes to the appropriate field component based on schema type.
 * Supports recursive rendering for nested schemas (objects, arrays, anyOf).
 */
export default function SchemaField(props: FieldProps<InputValue>) {
  const { schema } = props;

  // AnyOf (union types)
  if (isAnyOfSchema(schema)) {
    return <AnyOfField {...props} schema={schema} />;
  }

  // Object
  if (isObjectSchema(schema)) {
    return (
      <ObjectField
        {...props}
        schema={schema}
        value={(props.value as Record<string, InputValue>) ?? {}}
      />
    );
  }

  // Array
  if (isArraySchema(schema)) {
    return (
      <ArrayField
        {...props}
        schema={schema}
        value={(props.value as InputValue[]) ?? []}
      />
    );
  }

  // String
  if (isStringSchema(schema)) {
    return (
      <StringField
        {...props}
        schema={schema}
        value={(props.value as string) ?? ""}
      />
    );
  }

  // Number
  if (isNumberSchema(schema)) {
    return (
      <NumberField
        {...props}
        schema={schema}
        value={(props.value as number) ?? 0}
      />
    );
  }

  // Integer
  if (isIntegerSchema(schema)) {
    return (
      <IntegerField
        {...props}
        schema={schema}
        value={(props.value as number) ?? 0}
      />
    );
  }

  // Boolean
  if (isBooleanSchema(schema)) {
    return (
      <BooleanField
        {...props}
        schema={schema}
        value={(props.value as boolean) ?? false}
      />
    );
  }

  // Image
  if (isImageSchema(schema)) {
    return <ImageField {...props} schema={schema} value={props.value as never} />;
  }

  // Audio
  if (isAudioSchema(schema)) {
    return <AudioField {...props} schema={schema} value={props.value as never} />;
  }

  // Video
  if (isVideoSchema(schema)) {
    return <VideoField {...props} schema={schema} value={props.value as never} />;
  }

  // File
  if (isFileSchema(schema)) {
    return <FileField {...props} schema={schema} value={props.value as never} />;
  }

  // Fallback: Unknown schema type
  return (
    <div
      style={{
        padding: "12px",
        border: "1px dashed var(--border)",
        borderRadius: "8px",
        color: "var(--text-muted)",
        fontSize: "13px",
      }}
    >
      Unknown schema type
    </div>
  );
}
