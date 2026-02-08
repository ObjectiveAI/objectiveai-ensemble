"use client";

import React from "react";
import type { ContentItem, ContentListProps } from "./types";
import { getDepthBg } from "./utils";
import { StringEditor } from "./editors/PrimitiveEditors";
import MediaUploadEditor from "./editors/MediaUploadEditor";

const MAX_DEPTH = 10;

export default function ContentList({
  items,
  onChange,
  disabled,
  textOnly,
  isMobile,
  depth,
}: ContentListProps) {
  const updateItem = (index: number, updated: ContentItem) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = (type: ContentItem["type"]) => {
    const newItem: ContentItem =
      type === "group"
        ? { type: "group", children: [] }
        : type === "text"
          ? { type: "text", value: "" }
          : { type, value: null } as ContentItem;
    onChange([...items, newItem]);
  };

  const bg = getDepthBg(depth + 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "flex-start",
            padding: "12px",
            background: bg,
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        >
          {/* Content type badge */}
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "var(--text-muted)",
              minWidth: "36px",
              paddingTop: "8px",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {item.type === "group" ? "grp" : item.type.slice(0, 3)}
          </span>

          {/* Content editor */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <ContentItemEditor
              item={item}
              onChange={(updated) => updateItem(index, updated)}
              disabled={disabled}
              textOnly={textOnly}
              isMobile={isMobile}
              depth={depth}
            />
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => removeItem(index)}
            disabled={disabled}
            className="iconBtn iconBtn-sm"
            style={{ color: "var(--color-error)", marginTop: "4px", flexShrink: 0 }}
            aria-label="Remove content"
          >
            <CloseIcon />
          </button>
        </div>
      ))}

      {/* Add content buttons */}
      <AddContentBar onAdd={addItem} disabled={disabled} textOnly={textOnly} isMobile={isMobile} depth={depth} />
    </div>
  );
}

function ContentItemEditor({
  item,
  onChange,
  disabled,
  textOnly,
  isMobile,
  depth,
}: {
  item: ContentItem;
  onChange: (item: ContentItem) => void;
  disabled?: boolean;
  textOnly?: boolean;
  isMobile?: boolean;
  depth: number;
}) {
  switch (item.type) {
    case "text":
      return (
        <StringEditor
          value={item.value}
          onChange={(v) => onChange({ type: "text", value: typeof v === "string" ? v : "" })}
          disabled={disabled}
        />
      );

    case "image":
      return (
        <MediaUploadEditor
          mediaType="image"
          value={item.value}
          onChange={(v) => onChange({ type: "image", value: v as typeof item.value })}
          disabled={disabled}
        />
      );

    case "audio":
      return (
        <MediaUploadEditor
          mediaType="audio"
          value={item.value}
          onChange={(v) => onChange({ type: "audio", value: v as typeof item.value })}
          disabled={disabled}
        />
      );

    case "video":
      return (
        <MediaUploadEditor
          mediaType="video"
          value={item.value}
          onChange={(v) => onChange({ type: "video", value: v as typeof item.value })}
          disabled={disabled}
        />
      );

    case "file":
      return (
        <MediaUploadEditor
          mediaType="file"
          value={item.value}
          onChange={(v) => onChange({ type: "file", value: v as typeof item.value })}
          disabled={disabled}
        />
      );

    case "group":
      if (depth + 1 >= MAX_DEPTH) {
        return (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            Max nesting depth reached
          </div>
        );
      }
      return (
        <ContentList
          items={item.children}
          onChange={(children) => onChange({ type: "group", children })}
          disabled={disabled}
          textOnly={textOnly}
          isMobile={isMobile}
          depth={depth + 1}
        />
      );
  }
}

function AddContentBar({
  onAdd,
  disabled,
  textOnly,
  isMobile,
  depth,
}: {
  onAdd: (type: ContentItem["type"]) => void;
  disabled?: boolean;
  textOnly?: boolean;
  isMobile?: boolean;
  depth: number;
}) {
  const buttons: { type: ContentItem["type"]; label: string; icon: React.ReactNode }[] = [
    { type: "text", label: "Text", icon: <TextIcon /> },
    ...(!textOnly
      ? [
          { type: "image" as const, label: "Image", icon: <ImageIcon /> },
          { type: "audio" as const, label: "Audio", icon: <AudioIcon /> },
          { type: "video" as const, label: "Video", icon: <VideoIcon /> },
          { type: "file" as const, label: "File", icon: <FileIcon /> },
        ]
      : []),
  ];

  // Allow nesting groups up to max depth
  if (depth + 1 < MAX_DEPTH) {
    buttons.push({ type: "group", label: "Group", icon: <GroupIcon /> });
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
      }}
    >
      {buttons.map(({ type, label, icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onAdd(type)}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: isMobile ? "8px 12px" : "6px 10px",
            border: "1px dashed var(--border)",
            borderRadius: "6px",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "12px",
            fontWeight: 500,
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

// --- Icons ---

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,7 4,4 20,4 20,7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23,7 16,12 23,17 23,7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
