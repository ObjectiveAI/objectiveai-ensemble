"use client";

import type { FieldProps, NumberInputSchema } from "../types";
import { getErrorMessage } from "../validation";

interface NumberFieldProps extends FieldProps<number> {
  schema: NumberInputSchema;
}

export default function NumberField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: NumberFieldProps) {
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || val === "-") {
      // Allow empty input while typing
      onChange(0);
    } else {
      const parsed = parseFloat(val);
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
          step="any"
          placeholder={schema.description || "Enter number..."}
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
