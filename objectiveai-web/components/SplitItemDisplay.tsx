"use client";

import Image from "next/image";
import type { DisplayItem } from "@/lib/split-item-utils";

interface SplitItemDisplayProps {
  item: DisplayItem;
  /** Maximum width for content (images, text truncation) */
  maxWidth?: number;
  /** Whether to show expanded view for complex objects */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Render a DisplayItem with appropriate visual treatment based on its type.
 */
export default function SplitItemDisplay({
  item,
  maxWidth = 200,
  compact = true,
  className,
}: SplitItemDisplayProps) {
  switch (item.type) {
    case "string":
      return <StringDisplay value={item.value} maxWidth={maxWidth} className={className} />;

    case "number":
      return <NumberDisplay value={item.value} className={className} />;

    case "boolean":
      return <BooleanDisplay value={item.value} className={className} />;

    case "image":
      return <ImageDisplay url={item.url} maxWidth={maxWidth} className={className} />;

    case "audio":
      return <AudioDisplay format={item.format} className={className} />;

    case "video":
      return <VideoDisplay url={item.url} maxWidth={maxWidth} className={className} />;

    case "file":
      return <FileDisplay filename={item.filename} className={className} />;

    case "object":
      return <ObjectDisplay value={item.value} compact={compact} className={className} />;

    case "array":
      return <ArrayDisplay value={item.value} compact={compact} className={className} />;

    default:
      return <span className={className}>Unknown</span>;
  }
}

// Individual display components

function StringDisplay({
  value,
  maxWidth,
  className,
}: {
  value: string;
  maxWidth: number;
  className?: string;
}) {
  // Estimate max characters based on width (roughly 8px per char at default size)
  const maxChars = Math.floor(maxWidth / 8);
  const truncated = value.length > maxChars;
  const display = truncated ? value.slice(0, maxChars - 3) + "..." : value;

  return (
    <span
      title={truncated ? value : undefined}
      className={className}
      style={{
        maxWidth: `${maxWidth}px`,
        display: "inline-block",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {display}
    </span>
  );
}

function NumberDisplay({ value, className }: { value: number; className?: string }) {
  return (
    <span className={className} style={{ fontFamily: "var(--font-mono, monospace)" }}>
      {value}
    </span>
  );
}

function BooleanDisplay({ value, className }: { value: boolean; className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-mono, monospace)",
        color: value ? "var(--color-success)" : "var(--color-error)",
      }}
    >
      {value ? "true" : "false"}
    </span>
  );
}

function ImageDisplay({
  url,
  maxWidth,
  className,
}: {
  url: string;
  maxWidth: number;
  className?: string;
}) {
  return (
    <Image
      src={url}
      alt="Ranked item"
      className={className}
      width={maxWidth}
      height={60}
      unoptimized
      style={{
        width: "auto",
        height: "auto",
        maxWidth: `${maxWidth}px`,
        maxHeight: "60px",
        objectFit: "contain",
        borderRadius: "4px",
        border: "1px solid var(--border)",
      }}
    />
  );
}

function AudioDisplay({ format, className }: { format: string; className?: string }) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <AudioIcon />
      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        {format.toUpperCase()}
      </span>
    </div>
  );
}

function VideoDisplay({
  url,
  maxWidth,
  className,
}: {
  url: string;
  maxWidth: number;
  className?: string;
}) {
  // For data URLs, show icon; for real URLs, could show video element
  const isDataUrl = url.startsWith("data:");

  if (isDataUrl) {
    return (
      <div className={className} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <VideoIcon />
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Video</span>
      </div>
    );
  }

  return (
    <video
      src={url}
      className={className}
      style={{
        maxWidth: `${maxWidth}px`,
        maxHeight: "60px",
        objectFit: "contain",
        borderRadius: "4px",
      }}
      muted
    />
  );
}

function FileDisplay({ filename, className }: { filename: string; className?: string }) {
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <FileIcon />
      <span
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          maxWidth: "150px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {filename}
      </span>
    </div>
  );
}

function ObjectDisplay({
  value,
  compact,
  className,
}: {
  value: Record<string, unknown>;
  compact: boolean;
  className?: string;
}) {
  if (compact) {
    // Show first 2-3 key-value pairs
    const entries = Object.entries(value).slice(0, 3);
    const hasMore = Object.keys(value).length > 3;

    return (
      <span
        className={className}
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {entries.map(([k, v]) => `${k}: ${truncateValue(v)}`).join(", ")}
        {hasMore && " ..."}
      </span>
    );
  }

  // Full JSON view
  return (
    <pre
      className={className}
      style={{
        fontSize: "11px",
        background: "var(--page-bg)",
        padding: "8px",
        borderRadius: "4px",
        overflow: "auto",
        maxHeight: "100px",
        margin: 0,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ArrayDisplay({
  value,
  compact,
  className,
}: {
  value: unknown[];
  compact: boolean;
  className?: string;
}) {
  if (compact) {
    const preview = value.slice(0, 3).map(truncateValue).join(", ");
    const hasMore = value.length > 3;

    return (
      <span
        className={className}
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        [{preview}
        {hasMore && ", ..."}]
      </span>
    );
  }

  return (
    <pre
      className={className}
      style={{
        fontSize: "11px",
        background: "var(--page-bg)",
        padding: "8px",
        borderRadius: "4px",
        overflow: "auto",
        maxHeight: "100px",
        margin: 0,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

// Helper functions

function truncateValue(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") {
    return v.length > 20 ? v.slice(0, 17) + "..." : v;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  if (Array.isArray(v)) {
    return `[${v.length}]`;
  }
  if (typeof v === "object") {
    return "{...}";
  }
  return String(v);
}

// Icons

function AudioIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-muted)" }}
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-muted)" }}
    >
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-muted)" }}
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}
