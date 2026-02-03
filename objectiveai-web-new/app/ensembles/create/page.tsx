"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { validateEnsemble, loadWasm } from "@/lib/wasm-validation";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { COPY_FEEDBACK_DURATION_MS } from "../../../lib/constants";

interface EnsembleLlmEntry {
  id: string;
  ensemble_llm: string;
  count: number;
}

// SVG Icons
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function CreateEnsemblePage() {
  const [entries, setEntries] = useState<EnsembleLlmEntry[]>([
    { id: crypto.randomUUID(), ensemble_llm: "", count: 1 },
  ]);
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);
  const [computedId, setComputedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Load WASM on mount
  useEffect(() => {
    loadWasm().then((wasm) => {
      setWasmReady(!!wasm);
    });
  }, []);

  // Calculate total count
  const totalCount = useMemo(() => {
    return entries.reduce((sum, entry) => sum + entry.count, 0);
  }, [entries]);

  // Validation
  const isValid = useMemo(() => {
    const hasAtLeastOneEntry = entries.some((e) => e.ensemble_llm.trim().length > 0);
    const allEntriesValid = entries.every(
      (e) => e.ensemble_llm.trim().length === 0 || e.count >= 1
    );
    const totalInRange = totalCount >= 1 && totalCount <= 128;
    return hasAtLeastOneEntry && allEntriesValid && totalInRange;
  }, [entries, totalCount]);

  // Generate the ensemble JSON
  const ensembleJson = useMemo(() => {
    const validEntries = entries.filter((e) => e.ensemble_llm.trim().length > 0);
    if (validEntries.length === 0) return null;

    const ensemble = {
      ensemble_llms: validEntries.map((e) => ({
        ensemble_llm: e.ensemble_llm.trim(),
        count: e.count,
      })),
    };

    return JSON.stringify(ensemble, null, 2);
  }, [entries]);

  // Validate configuration and compute ID when config changes
  const runValidation = useCallback(async (json: string | null) => {
    if (!json) {
      setComputedId(null);
      setValidationError(null);
      return;
    }

    if (!wasmReady) {
      setComputedId(null);
      setValidationError(null);
      return;
    }

    setIsValidating(true);
    try {
      const ensembleConfig = JSON.parse(json);
      const result = await validateEnsemble(ensembleConfig);

      if (result.success && result.data) {
        setComputedId(result.data.id);
        setValidationError(null);
      } else {
        setComputedId(null);
        setValidationError(result.error || "Validation failed");
      }
    } catch {
      setComputedId(null);
      setValidationError("Invalid configuration");
    }
    setIsValidating(false);
  }, [wasmReady]);

  // Debounce validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runValidation(ensembleJson);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [ensembleJson, runValidation]);

  const addEntry = () => {
    setEntries([...entries, { id: crypto.randomUUID(), ensemble_llm: "", count: 1 }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, field: "ensemble_llm" | "count", value: string | number) => {
    setEntries(
      entries.map((e) =>
        e.id === id
          ? { ...e, [field]: field === "count" ? Math.max(1, Number(value)) : value }
          : e
      )
    );
  };

  const copyToClipboard = async () => {
    if (!ensembleJson) return;
    try {
      await navigator.clipboard.writeText(ensembleJson);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

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
    <div className="page">
      <div className="container">
        {/* Back link */}
        <Link
          href="/ensembles"
          style={{
            color: "var(--text-muted)",
            textDecoration: "none",
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Ensembles
        </Link>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? "24px" : "32px" }}>
          <span className="tag" style={{ marginBottom: "12px", display: "inline-block" }}>
            Create
          </span>
          <h1 className="heading2" style={{ marginBottom: "8px" }}>
            Create Ensemble
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: isMobile ? "15px" : "17px" }}>
            Combine multiple Ensemble LLMs into a voting ensemble
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "32px" }}>
          {/* Form Section */}
          <div>
            <div className="card" style={{ padding: isMobile ? "20px" : "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px" }}>
                Ensemble LLMs
              </h2>

              {/* Entries list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Entry number */}
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "var(--text-muted)",
                        minWidth: "20px",
                        paddingTop: "14px",
                        fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {index + 1}.
                    </span>

                    {/* Fields */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Ensemble LLM ID */}
                      <div className="aiTextField">
                        <input
                          type="text"
                          placeholder="Ensemble LLM ID (22 characters)"
                          value={entry.ensemble_llm}
                          onChange={(e) => updateEntry(entry.id, "ensemble_llm", e.target.value)}
                          style={{ fontFamily: "monospace" }}
                        />
                      </div>

                      {/* Count */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label
                          style={{
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            minWidth: "50px",
                          }}
                        >
                          Count:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="128"
                          value={entry.count}
                          onChange={(e) => updateEntry(entry.id, "count", e.target.value)}
                          className="input"
                          style={{
                            width: "80px",
                            padding: "8px 12px",
                            fontSize: "14px",
                            textAlign: "center",
                          }}
                        />
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      style={{
                        ...iconButtonStyle,
                        marginTop: "4px",
                        opacity: entries.length === 1 ? 0.5 : 1,
                        cursor: entries.length === 1 ? "not-allowed" : "pointer",
                      }}
                      disabled={entries.length === 1}
                      title="Remove LLM"
                      onMouseEnter={(e) => {
                        if (entries.length > 1) {
                          e.currentTarget.style.borderColor = "var(--color-error)";
                          e.currentTarget.style.color = "var(--color-error)";
                        }
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

                {/* Add button */}
                <button
                  type="button"
                  onClick={addEntry}
                  style={{
                    padding: "12px 16px",
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
                    marginTop: "4px",
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
                  Add Ensemble LLM
                </button>
              </div>

              {/* Total count indicator */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "12px 16px",
                  background: "var(--nav-surface)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Total Votes
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color:
                      totalCount < 1 || totalCount > 128
                        ? "var(--color-error)"
                        : "var(--text)",
                  }}
                >
                  {totalCount} / 128
                </span>
              </div>

              {/* Validation message */}
              {totalCount > 128 && (
                <p
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "var(--color-error)",
                  }}
                >
                  Total count cannot exceed 128. Please reduce the count values.
                </p>
              )}
            </div>
          </div>

          {/* JSON Output Section */}
          <div>
            {/* Computed ID Card */}
            <div
              className="card"
              style={{
                padding: isMobile ? "20px" : "24px",
                marginBottom: "16px",
                background: validationError ? "rgba(239, 68, 68, 0.05)" : "var(--nav-surface)",
                borderColor: validationError ? "rgba(239, 68, 68, 0.3)" : undefined,
              }}
            >
              <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                Computed ID
                {isValidating && (
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid var(--border)",
                      borderTopColor: "var(--accent)",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                {computedId && !isValidating && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </h3>
              <div
                style={{
                  background: "var(--card-bg)",
                  border: `1px solid ${validationError ? "rgba(239, 68, 68, 0.3)" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: validationError ? "var(--color-error)" : computedId ? "var(--accent)" : "var(--text-muted)",
                  wordBreak: "break-all",
                }}
              >
                {validationError ? (
                  <span>{validationError}</span>
                ) : computedId ? (
                  <span style={{ fontWeight: 600 }}>{computedId}</span>
                ) : !wasmReady ? (
                  <span style={{ fontStyle: "italic" }}>Loading WASM validation...</span>
                ) : (
                  <span>Add Ensemble LLMs to see the computed ID</span>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: isMobile ? "20px" : "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 600 }}>
                  Ensemble Configuration
                </h2>
                <button
                  onClick={copyToClipboard}
                  disabled={!isValid}
                  className="pillBtnGhost"
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: isValid ? 1 : 0.5,
                    cursor: isValid ? "pointer" : "not-allowed",
                  }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>

              {/* JSON preview */}
              <div
                style={{
                  background: "var(--nav-surface)",
                  borderRadius: "12px",
                  padding: "16px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  lineHeight: 1.6,
                  overflow: "auto",
                  maxHeight: "400px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: isValid ? "var(--text)" : "var(--text-muted)",
                }}
              >
                {ensembleJson || "// Add at least one Ensemble LLM ID to generate configuration"}
              </div>

              {/* Usage hint */}
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "rgba(107, 92, 255, 0.05)",
                  borderRadius: "8px",
                  border: "1px solid rgba(107, 92, 255, 0.1)",
                }}
              >
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Use this configuration in your code with the ObjectiveAI SDK or API.
                  Ensembles are content-addressed - identical configurations always produce the same ID.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div
          className="card"
          style={{
            padding: "24px",
            marginTop: "40px",
            background: "var(--nav-surface)",
          }}
        >
          <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>
            About Ensembles
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
            An Ensemble is a collection of Ensemble LLMs that vote together. Each entry specifies:
          </p>
          <ul style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.8, paddingLeft: "20px" }}>
            <li>
              <strong style={{ color: "var(--text)" }}>Ensemble LLM ID</strong> - The 22-character
              content-addressed ID of an Ensemble LLM configuration
            </li>
            <li>
              <strong style={{ color: "var(--text)" }}>Count</strong> - How many votes this LLM gets
              (1-128 total across all LLMs)
            </li>
          </ul>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "16px" }}>
            Weights are applied at execution time, not stored in the Ensemble definition.
            This allows the same Ensemble to behave differently with different weight configurations.
          </p>
        </div>
      </div>
    </div>
  );
}
