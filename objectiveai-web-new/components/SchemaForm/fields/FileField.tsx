"use client";

import { useRef } from "react";
import type { FieldProps, FileInputSchema, FileRichContentPart } from "../types";
import { getErrorMessage } from "../validation";
import { fileToBase64 } from "../utils";

interface FileFieldProps extends FieldProps<FileRichContentPart | null> {
  schema: FileInputSchema;
}

export default function FileField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: FileFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      onChange({
        type: "file",
        file: {
          file_data: base64,
          filename: file.name,
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
            <FileIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: "13px",
                color: "var(--text)",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {value.file.filename || "Uploaded file"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="iconBtn iconBtn-sm"
            style={{ color: "var(--color-error)" }}
            aria-label="Remove file"
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
          <FileIcon />
          <span>Upload file</span>
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

function FileIcon() {
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
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}
