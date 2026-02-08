"use client";

import type { FieldProps, BooleanInputSchema } from "../types";
import { getErrorMessage } from "../validation";

interface BooleanFieldProps extends FieldProps<boolean> {
  schema: BooleanInputSchema;
}

export default function BooleanField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
}: BooleanFieldProps) {
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  return (
    <div className="schemaFieldWrapper">
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          type="checkbox"
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={{
            width: "18px",
            height: "18px",
            accentColor: "var(--accent)",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        />
        <span
          style={{
            fontSize: "14px",
            color: hasError ? "var(--color-error)" : "var(--text)",
          }}
        >
          {schema.description || "Enable"}
        </span>
      </label>
      {hasError && <span className="fieldError">{errorMessage}</span>}
    </div>
  );
}
