"use client";

import { useRef } from "react";
import Image from "next/image";

// Content item types - must be valid RichContent for vector function responses
// See: objectiveai-rs/src/chat/completions/request/message.rs
//
// RichContent is #[serde(untagged)] with these variants (tried in order):
//   1. Text(String) - plain string like "hello"
//   2. Parts(Vec<RichContentPart>) - array like [{ type: "file", ... }]
//
// A direct object { type: "file", ... } matches NEITHER variant!
// So media/files MUST be wrapped in arrays to match RichContent::Parts.
type TextItem = string;
type ImagePart = { type: "image_url"; image_url: { url: string } };
type AudioPart = { type: "input_audio"; input_audio: { data: string; format: "wav" | "mp3" } };
type VideoPart = { type: "video_url"; video_url: { url: string } };
type FilePart = { type: "file"; file: { file_data: string; filename: string } };
type RichContentPart = ImagePart | AudioPart | VideoPart | FilePart;
// ContentItem: string (RichContent::Text) or array of parts (RichContent::Parts)
type ContentItem = TextItem | RichContentPart[];

interface ArrayInputProps {
  label?: string;
  description?: string;
  value: ContentItem[];
  onChange: (items: ContentItem[]) => void;
  isMobile?: boolean;
  textOnly?: boolean;
}

// SVG Icons (matching design system - use currentColor)
const PaperclipIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const AudioIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

// Helper to detect file type from extension
function getFileType(filename: string): "image" | "audio" | "video" | "file" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "audio";
  if (["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) return "video";
  return "file";
}

// Helper to get audio format
function getAudioFormat(filename: string): "wav" | "mp3" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ext === "wav" ? "wav" : "mp3";
}

// Helper to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ArrayInput({ label, description, value, onChange, isMobile, textOnly }: ArrayInputProps) {
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const addTextItem = () => {
    onChange([...value, ""]);
  };

  const updateItem = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (index: number, file: File) => {
    const fileType = getFileType(file.name);
    const base64 = await fileToBase64(file);

    let contentPart: RichContentPart;

    switch (fileType) {
      case "image":
        contentPart = {
          type: "image_url",
          image_url: { url: `data:${file.type};base64,${base64}` },
        };
        break;
      case "audio":
        contentPart = {
          type: "input_audio",
          input_audio: { data: base64, format: getAudioFormat(file.name) },
        };
        break;
      case "video":
        contentPart = {
          type: "video_url",
          video_url: { url: `data:${file.type};base64,${base64}` },
        };
        break;
      default:
        contentPart = {
          type: "file",
          file: { file_data: base64, filename: file.name },
        };
    }

    // Wrap in array - RichContent::Parts requires Vec<RichContentPart>
    const updated = [...value];
    updated[index] = [contentPart];
    onChange(updated);
  };

  const triggerFileInput = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  // Shared button styles
  const iconButtonStyle: React.CSSProperties = {
    padding: "8px",
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    cursor: "pointer",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "border-color 0.15s, color 0.15s, background 0.15s",
  };

  return (
    <div>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text)",
          }}
        >
          {label}
          {description && (
            <span
              style={{
                fontWeight: 400,
                color: "var(--text-muted)",
                marginLeft: "8px",
                display: isMobile ? "block" : "inline",
                marginTop: isMobile ? "4px" : "0",
              }}
            >
              {description}
            </span>
          )}
        </label>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {value.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            {/* Item number */}
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-muted)",
                minWidth: "20px",
                paddingTop: "12px",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {index + 1}.
            </span>

            {/* Content area */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {typeof item === "string" ? (
                // Text input
                <div className="aiTextField">
                  <textarea
                    placeholder={`Item ${index + 1}...`}
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    rows={2}
                    style={{ resize: "vertical" }}
                  />
                </div>
              ) : (
                // Media preview (item is RichContent::Parts = array of RichContentPart)
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--card-bg)",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {(() => {
                    const part = item[0]; // First part in the array
                    if (!part) return null;

                    if (part.type === "image_url") {
                      return (
                        <>
                          <Image
                            src={part.image_url.url}
                            alt={`Item ${index + 1}`}
                            width={48}
                            height={48}
                            unoptimized
                            style={{
                              objectFit: "cover",
                              borderRadius: "4px",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Image</span>
                        </>
                      );
                    }
                    if (part.type === "input_audio") {
                      return (
                        <>
                          <span style={{ color: "var(--text-muted)", flexShrink: 0 }}><AudioIcon /></span>
                          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                            Audio ({part.input_audio.format.toUpperCase()})
                          </span>
                        </>
                      );
                    }
                    if (part.type === "video_url") {
                      return (
                        <>
                          <span style={{ color: "var(--text-muted)", flexShrink: 0 }}><VideoIcon /></span>
                          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Video</span>
                        </>
                      );
                    }
                    if (part.type === "file") {
                      return (
                        <>
                          <span style={{ color: "var(--text-muted)", flexShrink: 0 }}><FileIcon /></span>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--text-muted)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {part.file.filename}
                          </span>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* File upload button - only show if not textOnly */}
            {!textOnly && (
              <>
                <input
                  type="file"
                  ref={(el) => { fileInputRefs.current[index] = el; }}
                  style={{ display: "none" }}
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.json,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(index, file);
                    e.target.value = ""; // Reset for re-selection
                  }}
                />
                <button
                  type="button"
                  onClick={() => triggerFileInput(index)}
                  style={iconButtonStyle}
                  title="Upload file"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                >
                  <PaperclipIcon />
                </button>
              </>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeItem(index)}
              style={iconButtonStyle}
              title="Remove item"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-error)";
                e.currentTarget.style.color = "var(--color-error)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <CloseIcon />
            </button>
          </div>
        ))}

        {/* Add item button */}
        <button
          type="button"
          onClick={addTextItem}
          style={{
            padding: "10px 16px",
            background: "none",
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            cursor: "pointer",
            color: "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          <PlusIcon />
          Add Item
        </button>
      </div>
    </div>
  );
}
