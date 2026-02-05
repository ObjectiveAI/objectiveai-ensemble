"use client";

import { useRef } from "react";
import type { FieldProps, VideoInputSchema, VideoRichContentPart } from "../types";
import { getErrorMessage } from "../validation";
import { fileToBase64 } from "../utils";

interface VideoFieldProps extends FieldProps<VideoRichContentPart | null> {
  schema: VideoInputSchema;
}

export default function VideoField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: VideoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      onChange({
        type: "video_url",
        video_url: {
          url: `data:${file.type};base64,${base64}`,
        },
      });
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="schemaFieldWrapper">
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        disabled={disabled}
        style={{ display: "none" }}
      />

      {value ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            border: `1px solid ${hasError ? "var(--color-error)" : "var(--border)"}`,
            borderRadius: "8px",
            background: "var(--page-bg)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              height: "48px",
              borderRadius: "6px",
              background: "var(--accent-light)",
              color: "var(--accent)",
            }}
          >
            <VideoIcon />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "13px", color: "var(--text)" }}>
              Video uploaded
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="iconBtn iconBtn-sm"
            style={{ color: "var(--color-error)" }}
            aria-label="Remove video"
          >
            <CloseIcon />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            width: "100%",
            padding: isMobile ? "16px" : "14px",
            border: `1px dashed ${hasError ? "var(--color-error)" : "var(--border)"}`,
            borderRadius: "8px",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: disabled ? "not-allowed" : "pointer",
            fontSize: "14px",
            transition: "border-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = hasError
              ? "var(--color-error)"
              : "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <VideoIcon />
          <span>Upload video</span>
        </button>
      )}

      {hasError && <span className="fieldError">{errorMessage}</span>}
      {schema.description && !hasError && (
        <span className="fieldHint">{schema.description}</span>
      )}
    </div>
  );
}

function CloseIcon() {
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
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
