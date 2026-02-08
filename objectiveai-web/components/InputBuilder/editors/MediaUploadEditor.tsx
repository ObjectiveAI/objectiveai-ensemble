"use client";

import { useRef } from "react";
import type { InputValue } from "../../SchemaForm/types";
import { fileToBase64, getAudioFormat } from "../../SchemaForm/utils";

interface MediaUploadEditorProps {
  mediaType: "image" | "audio" | "video" | "file";
  value: InputValue;
  onChange: (value: InputValue) => void;
  disabled?: boolean;
}

const ACCEPT_MAP: Record<string, string> = {
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
  file: ".pdf,.doc,.docx,.txt,.json,.csv",
};

function getFileType(filename: string): "image" | "audio" | "video" | "file" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  return "file";
}

export default function MediaUploadEditor({
  mediaType,
  value,
  onChange,
  disabled,
}: MediaUploadEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = async (file: File) => {
    const base64 = await fileToBase64(file);
    const detectedType = getFileType(file.name);

    // Build the appropriate RichContentPart based on detected type
    // (or forced mediaType if the file extension doesn't match)
    const effectiveType = mediaType === "file" ? detectedType : mediaType;

    switch (effectiveType) {
      case "image":
        onChange({
          type: "image_url",
          image_url: { url: `data:${file.type};base64,${base64}` },
        });
        break;
      case "audio":
        onChange({
          type: "input_audio",
          input_audio: { data: base64, format: getAudioFormat(file.type) },
        });
        break;
      case "video":
        onChange({
          type: "video_url",
          video_url: { url: `data:${file.type};base64,${base64}` },
        });
        break;
      default:
        onChange({
          type: "file",
          file: { file_data: base64, filename: file.name },
        });
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  // Determine if we have content to preview
  const hasContent = value !== null && value !== undefined;

  if (hasContent && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;

    // Image preview
    if (v.type === "image_url") {
      const url = (v.image_url as { url: string })?.url;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={url}
            alt="Uploaded"
            style={{
              width: "48px",
              height: "48px",
              objectFit: "cover",
              borderRadius: "4px",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>
            Image
          </span>
          <RemoveButton onClick={handleRemove} disabled={disabled} />
        </div>
      );
    }

    // Audio preview
    if (v.type === "input_audio") {
      const audio = v.input_audio as { format: string };
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MediaIcon type="audio" />
          <span style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>
            Audio ({audio?.format?.toUpperCase()})
          </span>
          <RemoveButton onClick={handleRemove} disabled={disabled} />
        </div>
      );
    }

    // Video preview
    if (v.type === "video_url" || v.type === "input_video") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MediaIcon type="video" />
          <span style={{ fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>
            Video
          </span>
          <RemoveButton onClick={handleRemove} disabled={disabled} />
        </div>
      );
    }

    // File preview
    if (v.type === "file") {
      const file = v.file as { filename?: string };
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <MediaIcon type="file" />
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file?.filename || "File"}
          </span>
          <RemoveButton onClick={handleRemove} disabled={disabled} />
        </div>
      );
    }
  }

  // Upload button (no content yet)
  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept={ACCEPT_MAP[mediaType]}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          border: "1px dashed var(--border)",
          borderRadius: "8px",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "13px",
          transition: "border-color 0.15s, color 0.15s",
          width: "100%",
          justifyContent: "center",
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
        <UploadIcon />
        Upload {mediaType}
      </button>
    </div>
  );
}

function RemoveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="iconBtn iconBtn-sm"
      style={{ color: "var(--color-error)", flexShrink: 0 }}
      aria-label="Remove"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

function MediaIcon({ type }: { type: "audio" | "video" | "file" }) {
  if (type === "audio") {
    return (
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </span>
    );
  }
  if (type === "video") {
    return (
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      </span>
    );
  }
  return (
    <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    </span>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17,8 12,3 7,8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
