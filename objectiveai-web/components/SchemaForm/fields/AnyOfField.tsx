"use client";

import { useState } from "react";
import type { FieldProps, AnyOfInputSchema, InputValue } from "../types";
import { getSchemaTypeLabel } from "../types";
import { getErrorMessage } from "../validation";
import { getDefaultValue, detectMatchingSchemaIndex } from "../utils";
import SchemaField from "../SchemaField";

interface AnyOfFieldProps extends FieldProps<InputValue> {
  schema: AnyOfInputSchema;
}

export default function AnyOfField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
  depth = 0,
}: AnyOfFieldProps) {
  // Detect which schema currently matches the value
  const [selectedIndex, setSelectedIndex] = useState(() =>
    detectMatchingSchemaIndex(schema.anyOf, value)
  );

  const errorMessage = getErrorMessage(errors, path);

  const handleTypeChange = (newIndex: number) => {
    setSelectedIndex(newIndex);
    // Reset to default value for the new type
    onChange(getDefaultValue(schema.anyOf[newIndex]));
  };

  const getOptionLabel = (schemaOption: typeof schema.anyOf[0]): string => {
    // Use description if available
    if ("description" in schemaOption && schemaOption.description) {
      return schemaOption.description;
    }
    // Otherwise use type label
    return getSchemaTypeLabel(schemaOption);
  };

  return (
    <div className="schemaFieldWrapper">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Type selector */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--text-muted, #888)",
              marginBottom: "6px",
            }}
          >
            Type
          </label>
          <select
            className="select"
            value={selectedIndex}
            onChange={(e) => handleTypeChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            style={{
              width: isMobile ? "100%" : "200px",
              padding: isMobile ? "12px" : "10px 12px",
              fontSize: isMobile ? "16px" : "14px",
            }}
          >
            {schema.anyOf.map((opt, idx) => (
              <option key={idx} value={idx}>
                {getOptionLabel(opt)}
              </option>
            ))}
          </select>
        </div>

        {/* Render selected schema's field */}
        <SchemaField
          schema={schema.anyOf[selectedIndex]}
          value={value}
          onChange={onChange}
          path={path}
          errors={errors}
          disabled={disabled}
          isMobile={isMobile}
          depth={depth}
        />
      </div>

      {errorMessage && <span className="fieldError">{errorMessage}</span>}
    </div>
  );
}
