"use client";

import { useRef } from "react";
import type { FieldProps, AudioInputSchema, AudioRichContentPart } from "../types";
import { getErrorMessage } from "../validation";
import { fileToBase64, getAudioFormat } from "../utils";

interface AudioFieldProps extends FieldProps<AudioRichContentPart | null> {
  schema: AudioInputSchema;
}

export default function AudioField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: AudioFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const format = getAudioFormat(file.type);
      onChange({
        type: "input_audio",
        input_audio: {
          data: base64,
          format,
        },
      });
    } catch {
      // File read failed
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
        accept="audio/*"
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
            <AudioIcon />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "13px", color: "var(--text)" }}>
              Audio ({value.input_audio.format.toUpperCase()})
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="iconBtn iconBtn-sm"
            style={{ color: "var(--color-error)" }}
            aria-label="Remove audio"
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
          <AudioIcon />
          <span>Upload audio</span>
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

function AudioIcon() {
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
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
