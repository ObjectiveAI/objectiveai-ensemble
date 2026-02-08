"use client";

import type { FieldProps, ObjectInputSchema, InputValue } from "../types";
import { getErrorsForPath } from "../validation";
import { joinPath } from "../utils";
import SchemaField from "../SchemaField";

interface ObjectFieldProps extends FieldProps<Record<string, InputValue>> {
  schema: ObjectInputSchema;
}

export default function ObjectField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
  depth = 0,
}: ObjectFieldProps) {
  const required = new Set(schema.required ?? []);
  const properties = Object.entries(schema.properties);

  const handlePropertyChange = (key: string, newValue: InputValue) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  // Visual styling based on depth
  const isNested = depth > 0;
  const bgColors = [
    "transparent",
    "rgba(107, 92, 255, 0.02)",
    "rgba(107, 92, 255, 0.04)",
    "rgba(107, 92, 255, 0.06)",
  ];
  const bg = isNested ? bgColors[depth % bgColors.length] : "transparent";

  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? "16px" : "20px",
      }}
    >
      {properties.map(([key, propSchema]) => {
        const fieldPath = joinPath(path, key);
        const fieldErrors = getErrorsForPath(errors, fieldPath);
        const isRequired = required.has(key);
        const propValue = value?.[key];

        return (
          <div key={key} className="schemaFormField">
            <FieldLabel
              name={key}
              description={propSchema.description}
              required={isRequired}
              isMobile={isMobile}
            />
            <SchemaField
              schema={propSchema}
              value={propValue}
              onChange={(newVal) => handlePropertyChange(key, newVal)}
              path={fieldPath}
              errors={fieldErrors}
              required={isRequired}
              disabled={disabled}
              isMobile={isMobile}
              depth={depth + 1}
            />
          </div>
        );
      })}
    </div>
  );

  // For nested objects, wrap in a visual container
  if (isNested) {
    return (
      <div
        style={{
          padding: "16px",
          background: bg,
          borderRadius: "8px",
          border: "1px solid var(--border)",
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

function FieldLabel({
  name,
  description,
  required,
  isMobile,
}: {
  name: string;
  description?: string | null;
  required: boolean;
  isMobile?: boolean;
}) {
  // Convert snake_case or camelCase to Title Case
  const displayName = name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  return (
    <div style={{ marginBottom: "8px" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: isMobile ? "14px" : "13px",
          fontWeight: 500,
          color: "var(--text)",
        }}
      >
        {displayName}
        {required && (
          <span style={{ color: "var(--color-error)", fontSize: "12px" }}>*</span>
        )}
      </label>
      {description && (
        <span
          style={{
            display: "block",
            fontSize: "12px",
            color: "var(--text-muted)",
            marginTop: "2px",
          }}
        >
          {description}
        </span>
      )}
    </div>
  );
}
