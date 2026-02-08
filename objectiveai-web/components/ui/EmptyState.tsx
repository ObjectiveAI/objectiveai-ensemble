"use client";

import Link from "next/link";

interface EmptyStateProps {
  /** Main message to display */
  message: string;
  /** Optional title above the message */
  title?: string;
  /** Optional icon (as emoji or React node) */
  icon?: React.ReactNode;
  /** Optional action button/link */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

/**
 * Reusable empty state component for when no data is available.
 *
 * @example
 * // Basic empty state
 * <EmptyState message="No functions found" />
 *
 * @example
 * // With icon and action
 * <EmptyState
 *   icon="📭"
 *   title="No results"
 *   message="Try adjusting your search filters"
 *   action={{ label: "Clear filters", onClick: clearFilters }}
 * />
 *
 * @example
 * // With link action
 * <EmptyState
 *   message="You haven't created any API keys yet"
 *   action={{ label: "Create your first key", href: "/account/keys/create" }}
 * />
 */
export function EmptyState({ message, title, icon, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--text-muted)",
      }}
    >
      {icon && (
        <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>
          {icon}
        </div>
      )}

      {title && (
        <p style={{
          fontSize: "16px",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: "4px",
        }}>
          {title}
        </p>
      )}

      <p style={{ fontSize: "14px", marginBottom: action ? "16px" : 0 }}>
        {message}
      </p>

      {action && (
        action.href ? (
          <Link
            href={action.href}
            style={{
              color: "var(--accent)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            {action.label} →
          </Link>
        ) : (
          <button
            onClick={action.onClick}
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
            {action.label}
          </button>
        )
      )}
    </div>
  );
}

export default EmptyState;
