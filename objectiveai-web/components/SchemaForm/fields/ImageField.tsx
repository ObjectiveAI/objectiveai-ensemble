"use client";

import { useRef } from "react";
import Image from "next/image";
import type { FieldProps, ImageInputSchema, ImageRichContentPart } from "../types";
import { getErrorMessage } from "../validation";
import { fileToBase64 } from "../utils";

interface ImageFieldProps extends FieldProps<ImageRichContentPart | null> {
  schema: ImageInputSchema;
}

export default function ImageField({
  schema,
  value,
  onChange,
  path,
  errors,
  disabled,
  isMobile,
}: ImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorMessage = getErrorMessage(errors, path);
  const hasError = !!errorMessage;

  const handleFileSelect = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      onChange({
        type: "image_url",
        image_url: {
          url: `data:${file.type};base64,${base64}`,
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
        accept="image/*"
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
          <Image
            src={value.image_url.url}
            alt="Uploaded"
            width={80}
            height={80}
            unoptimized
            style={{
              width: isMobile ? "60px" : "80px",
              height: isMobile ? "60px" : "80px",
              objectFit: "cover",
              borderRadius: "6px",
              border: "1px solid var(--border)",
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Image uploaded
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="iconBtn iconBtn-sm"
            style={{ color: "var(--color-error)" }}
            aria-label="Remove image"
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
          <ImageIcon />
          <span>Upload image</span>
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

function ImageIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}
