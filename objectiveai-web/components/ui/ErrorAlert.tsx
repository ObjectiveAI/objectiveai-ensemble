"use client";

interface ErrorAlertProps {
  /** The error message to display */
  message: string;
  /** Optional title (default: "Error") */
  title?: string;
  /** Optional retry callback - shows a retry button when provided */
  onRetry?: () => void;
  /** Whether to show in a full-page centered layout */
  fullPage?: boolean;
}

/**
 * Reusable error alert component with consistent styling.
 *
 * @example
 * // Basic inline error
 * <ErrorAlert message="Failed to load data" />
 *
 * @example
 * // Full page error with retry
 * <ErrorAlert
 *   fullPage
 *   title="Connection Error"
 *   message="Unable to reach the server"
 *   onRetry={fetchData}
 * />
 */
export function ErrorAlert({ message, title, onRetry, fullPage = false }: ErrorAlertProps) {
  const content = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: fullPage ? "center" : "flex-start",
        gap: "12px",
        padding: fullPage ? "60px 20px" : "16px",
        background: fullPage ? "transparent" : "rgba(239, 68, 68, 0.05)",
        border: fullPage ? "none" : "1px solid rgba(239, 68, 68, 0.2)",
        borderRadius: "12px",
        textAlign: fullPage ? "center" : "left",
      }}
      role="alert"
    >
      {fullPage && (
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-error)"
          strokeWidth="1.5"
          style={{ opacity: 0.6 }}
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}

      {title && (
        <p style={{
          color: "var(--color-error)",
          fontWeight: 600,
          fontSize: fullPage ? "16px" : "14px",
          margin: 0,
        }}>
          {title}
        </p>
      )}

      <p style={{
        color: fullPage ? "var(--text-muted)" : "var(--color-error)",
        fontSize: "14px",
        margin: 0,
        lineHeight: 1.5,
      }}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--accent)",
            background: "transparent",
            border: "1px solid var(--accent)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(107, 92, 255, 0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Try Again
        </button>
      )}
    </div>
  );

  return content;
}

export default ErrorAlert;
