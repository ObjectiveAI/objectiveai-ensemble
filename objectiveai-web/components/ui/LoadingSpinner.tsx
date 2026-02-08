"use client";

interface LoadingSpinnerProps {
  /** Size of the spinner in pixels (default: 40) */
  size?: number;
  /** Whether to center the spinner in a full-page container */
  fullPage?: boolean;
  /** Optional loading message to display */
  message?: string;
}

/**
 * Reusable loading spinner component with consistent styling.
 *
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // Full page centered spinner with message
 * <LoadingSpinner fullPage message="Loading functions..." />
 *
 * @example
 * // Custom size
 * <LoadingSpinner size={24} />
 */
export function LoadingSpinner({ size = 40, fullPage = false, message }: LoadingSpinnerProps) {
  const spinner = (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: "3px solid var(--border)",
        borderTopColor: "var(--accent)",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
      role="status"
      aria-label={message || "Loading"}
    />
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "200px",
          gap: "16px",
          padding: "40px 20px",
          color: "var(--text-muted)",
        }}
      >
        {spinner}
        {message && <p style={{ fontSize: "14px" }}>{message}</p>}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
