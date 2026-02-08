"use client";

interface FormFieldProps {
  /** Unique ID for the input (used for label htmlFor) */
  id: string;
  /** Label text */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Helper text shown below the input */
  hint?: string;
  /** Error message (replaces hint when present) */
  error?: string;
  /** The form control (input, select, textarea) */
  children: React.ReactNode;
}

/**
 * Reusable form field wrapper with label, hint text, and error handling.
 * Ensures consistent styling and accessibility across forms.
 *
 * @example
 * <FormField id="email" label="Email" required hint="We'll never share your email">
 *   <input id="email" type="email" className="input" />
 * </FormField>
 *
 * @example
 * <FormField id="model" label="Model" error={modelError}>
 *   <input id="model" className="input" style={{ borderColor: modelError ? 'var(--color-error)' : undefined }} />
 * </FormField>
 */
export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: FormFieldProps) {
  const hintId = hint || error ? `${id}-hint` : undefined;

  return (
    <div style={{ marginBottom: "20px" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "var(--text)",
        }}
      >
        {label}
        {required && (
          <span style={{ color: "var(--accent)", marginLeft: "4px" }}>*</span>
        )}
      </label>

      {children}

      {(hint || error) && (
        <p
          id={hintId}
          style={{
            fontSize: "12px",
            color: error ? "var(--color-error)" : "var(--text-muted)",
            marginTop: "6px",
          }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export default FormField;
