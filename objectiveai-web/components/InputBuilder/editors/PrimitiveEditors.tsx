"use client";

import type { InputValue } from "../../SchemaForm/types";

interface StringEditorProps {
  value: InputValue;
  onChange: (value: InputValue) => void;
  disabled?: boolean;
}

export function StringEditor({ value, onChange, disabled }: StringEditorProps) {
  return (
    <div className="aiTextField" style={{ flex: 1 }}>
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter text..."
        rows={2}
        style={{ resize: "vertical" }}
      />
    </div>
  );
}
