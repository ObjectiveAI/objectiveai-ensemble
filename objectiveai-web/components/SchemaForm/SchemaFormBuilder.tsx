"use client";

import { useEffect, useCallback, useMemo } from "react";
import type { SchemaFormBuilderProps, ValidationError } from "./types";
import { validateValue } from "./validation";
import { getDefaultValue, valueMatchesSchema } from "./utils";
import SchemaField from "./SchemaField";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * SchemaFormBuilder - Root component for schema-driven dynamic forms.
 *
 * Generates a form based on an InputSchema, with:
 * - Automatic field generation for all schema types
 * - Recursive support for nested objects and arrays
 * - Real-time validation
 * - Mobile-responsive layout
 *
 * @example
 * ```tsx
 * const schema = {
 *   type: "object",
 *   properties: {
 *     name: { type: "string" },
 *     age: { type: "integer", minimum: 0 },
 *   },
 *   required: ["name"],
 * };
 *
 * function MyForm() {
 *   const [value, setValue] = useState({});
 *
 *   return (
 *     <SchemaFormBuilder
 *       schema={schema}
 *       value={value}
 *       onChange={setValue}
 *     />
 *   );
 * }
 * ```
 */
export default function SchemaFormBuilder({
  schema,
  value,
  onChange,
  onValidate,
  disabled,
  className,
}: SchemaFormBuilderProps) {
  const isMobile = useIsMobile();

  // Initialize with default values if value is null/undefined
  const effectiveValue = useMemo(() => {
    if (value === null || value === undefined || !valueMatchesSchema(value, schema)) {
      return getDefaultValue(schema);
    }
    return value;
  }, [value, schema]);

  // Validate on value change (debounced in production, immediate here for simplicity)
  const errors = useMemo<ValidationError[]>(() => {
    return validateValue(schema, effectiveValue, "", false);
  }, [schema, effectiveValue]);

  // Notify parent of validation results
  useEffect(() => {
    onValidate?.(errors);
  }, [errors, onValidate]);

  // Handle value change with initialization
  const handleChange = useCallback(
    (newValue: typeof effectiveValue) => {
      onChange(newValue);
    },
    [onChange]
  );

  return (
    <div className={className}>
      <SchemaField
        schema={schema}
        value={effectiveValue}
        onChange={handleChange}
        path=""
        errors={errors}
        disabled={disabled}
        isMobile={isMobile}
        depth={0}
      />
    </div>
  );
}
