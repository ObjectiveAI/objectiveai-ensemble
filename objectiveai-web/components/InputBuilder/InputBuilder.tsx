"use client";

import { useMemo, useCallback } from "react";
import type { InputBuilderProps, ContentItem } from "./types";
import type { InputValue } from "../SchemaForm/types";
import { isObjectSchema } from "../SchemaForm/types";
import ContentList from "./ContentList";
import { inputValueToContentItems, contentItemsToInputValue } from "./utils";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function InputBuilder({
  value,
  onChange,
  schema,
  disabled,
  textOnly,
  label,
  description,
  className,
}: InputBuilderProps) {
  const isMobile = useIsMobile();

  // Object schema: render each property as a labeled ContentList
  if (schema && isObjectSchema(schema)) {
    const objValue = (value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {}) as Record<string, InputValue>;
    const requiredSet = new Set(schema.required ?? []);

    return (
      <div className={className} style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "20px" }}>
        {Object.entries(schema.properties).map(([key, propSchema]) => {
          const isRequired = requiredSet.has(key);
          const propDescription = propSchema.description;
          const displayName = key
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (s) => s.toUpperCase())
            .trim();

          return (
            <PropertyContentList
              key={key}
              displayName={displayName}
              description={propDescription}
              required={isRequired}
              value={objValue[key]}
              onChange={(newVal) => onChange({ ...objValue, [key]: newVal })}
              disabled={disabled}
              textOnly={textOnly}
              isMobile={isMobile}
            />
          );
        })}
      </div>
    );
  }

  // No schema or non-object schema: single ContentList
  return (
    <SingleContentList
      value={value}
      onChange={onChange}
      disabled={disabled}
      textOnly={textOnly}
      isMobile={isMobile}
      label={label}
      description={description}
      className={className}
    />
  );
}

/**
 * A single property field backed by a ContentList.
 */
function PropertyContentList({
  displayName,
  description,
  required,
  value,
  onChange,
  disabled,
  textOnly,
  isMobile,
}: {
  displayName: string;
  description?: string | null;
  required: boolean;
  value: InputValue;
  onChange: (value: InputValue) => void;
  disabled?: boolean;
  textOnly?: boolean;
  isMobile?: boolean;
}) {
  const items = useMemo(() => inputValueToContentItems(value), [value]);
  const handleChange = useCallback(
    (newItems: ContentItem[]) => {
      onChange(contentItemsToInputValue(newItems));
    },
    [onChange]
  );

  return (
    <div>
      <div style={{ marginBottom: "8px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: isMobile ? "14px" : "13px",
            fontWeight: 500,
            color: "var(--text)",
          }}
        >
          {displayName}
          {required && (
            <span style={{ color: "var(--color-error)", fontSize: "12px" }}>*</span>
          )}
        </label>
        {description && (
          <span
            style={{
              display: "block",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "2px",
            }}
          >
            {description}
          </span>
        )}
      </div>
      <ContentList
        items={items}
        onChange={handleChange}
        disabled={disabled}
        textOnly={textOnly}
        isMobile={isMobile}
        depth={0}
      />
    </div>
  );
}

/**
 * A standalone ContentList with optional label.
 */
function SingleContentList({
  value,
  onChange,
  disabled,
  textOnly,
  isMobile,
  label,
  description,
  className,
}: {
  value: InputValue;
  onChange: (value: InputValue) => void;
  disabled?: boolean;
  textOnly?: boolean;
  isMobile?: boolean;
  label?: string;
  description?: string;
  className?: string;
}) {
  const items = useMemo(() => inputValueToContentItems(value), [value]);
  const handleChange = useCallback(
    (newItems: ContentItem[]) => {
      onChange(contentItemsToInputValue(newItems));
    },
    [onChange]
  );

  return (
    <div className={className}>
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
      <ContentList
        items={items}
        onChange={handleChange}
        disabled={disabled}
        textOnly={textOnly}
        isMobile={isMobile}
        depth={0}
      />
    </div>
  );
}
