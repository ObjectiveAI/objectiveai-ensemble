"use client";

import type { FieldProps, IntegerInputSchema } from "../types";
import { getErrorMessage } from "../validation";

interface IntegerFieldProps extends FieldProps<number> {
  schema: IntegerInputSchema;
}

export default function IntegerField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: IntegerFieldProps) {
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || val === "-") {
      onChange(0);
    } else {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <div className="schemaFieldWrapper">
      <div
        className="aiTextField"
        style={{
          borderColor: hasError ? "var(--color-error)" : undefined,
        }}
      >
        <input
          type="number"
          value={value ?? ""}
          onChange={handleChange}
          min={schema.minimum ?? undefined}
          max={schema.maximum ?? undefined}
          step="1"
          placeholder={schema.description || "Enter integer..."}
          disabled={disabled}
          style={{
            width: "100%",
            padding: isMobile ? "12px" : "10px 12px",
            fontSize: isMobile ? "16px" : "14px",
          }}
        />
      </div>
      {hasError && <span className="fieldError">{errorMessage}</span>}
      {(schema.minimum != null || schema.maximum != null) && (
        <span className="fieldHint">
          {schema.minimum != null && `Min: ${schema.minimum}`}
          {schema.minimum != null && schema.maximum != null && " · "}
          {schema.maximum != null && `Max: ${schema.maximum}`}
        </span>
      )}
    </div>
  );
}
