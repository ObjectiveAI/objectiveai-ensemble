"use client";

import type { FieldProps, StringInputSchema } from "../types";
import { getErrorMessage } from "../validation";

interface StringFieldProps extends FieldProps<string> {
  schema: StringInputSchema;
}

export default function StringField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: StringFieldProps) {
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  // Enum: render as select dropdown
  if (schema.enum && schema.enum.length > 0) {
    return (
      <div className="schemaFieldWrapper">
        <select
          className="select"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          style={{
            borderColor: hasError ? "var(--color-error)" : undefined,
            width: "100%",
            padding: isMobile ? "12px" : "10px 12px",
            fontSize: isMobile ? "16px" : "14px",
          }}
        >
          {schema.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {hasError && <span className="fieldError">{errorMessage}</span>}
      </div>
    );
  }

  // Plain string: render as textarea
  return (
    <div className="schemaFieldWrapper">
      <div
        className="aiTextField"
        style={{
          borderColor: hasError ? "var(--color-error)" : undefined,
        }}
      >
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={schema.description || "Enter text..."}
          disabled={disabled}
          rows={3}
          style={{
            width: "100%",
            resize: "vertical",
            minHeight: "80px",
            fontSize: isMobile ? "16px" : "14px",
          }}
        />
      </div>
      {hasError && <span className="fieldError">{errorMessage}</span>}
    </div>
  );
}
