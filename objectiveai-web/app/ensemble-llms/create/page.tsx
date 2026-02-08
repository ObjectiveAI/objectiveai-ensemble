"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { validateEnsembleLlm, loadWasm } from "@/lib/wasm-validation";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { COPY_FEEDBACK_DURATION_MS, DROPDOWN_BLUR_DELAY_MS, WASM_VALIDATION_DEBOUNCE_MS } from "../../../lib/constants";

// Common model suggestions
const MODEL_SUGGESTIONS = [
  "openai/gpt-4o",
  "openai/gpt-4o-mini",
  "anthropic/claude-3-5-sonnet",
  "anthropic/claude-3-haiku",
  "google/gemini-2.0-flash",
];

// Output mode options
const OUTPUT_MODES = ["instruction", "json_schema", "tool_call"] as const;
type OutputMode = (typeof OUTPUT_MODES)[number];

// Reasoning effort options
const REASONING_EFFORTS = ["low", "medium", "high"] as const;
type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

interface EnsembleLlmConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  top_logprobs?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  output_mode?: OutputMode;
  reasoning?: { effort: ReasoningEffort };
  provider?: { order: string[] };
}

export default function CreateEnsembleLlmPage() {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [wasmReady, setWasmReady] = useState(false);
  const [computedId, setComputedId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Form state
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState<string>("");
  const [topP, setTopP] = useState<string>("");
  const [topLogprobs, setTopLogprobs] = useState<string>("");
  const [frequencyPenalty, setFrequencyPenalty] = useState<string>("");
  const [presencePenalty, setPresencePenalty] = useState<string>("");
  const [outputMode, setOutputMode] = useState<OutputMode | "">("");
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort | "">("");
  const [providerOrder, setProviderOrder] = useState<string>("");

  // Model suggestions dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load WASM on mount
  useEffect(() => {
    loadWasm().then((wasm) => {
      setWasmReady(!!wasm);
    });
  }, []);

  // Build the configuration object (must be before validation hooks)
  const config = useMemo<EnsembleLlmConfig | null>(() => {
    if (!model.trim()) return null;

    const cfg: EnsembleLlmConfig = { model: model.trim() };

    if (temperature !== "") {
      const temp = parseFloat(temperature);
      if (!isNaN(temp) && temp >= 0 && temp <= 2) {
        cfg.temperature = temp;
      }
    }

    if (topP !== "") {
      const tp = parseFloat(topP);
      if (!isNaN(tp) && tp >= 0 && tp <= 1) {
        cfg.top_p = tp;
      }
    }

    if (topLogprobs !== "") {
      const tlp = parseInt(topLogprobs, 10);
      if (!isNaN(tlp) && tlp >= 2 && tlp <= 20) {
        cfg.top_logprobs = tlp;
      }
    }

    if (frequencyPenalty !== "") {
      const fp = parseFloat(frequencyPenalty);
      if (!isNaN(fp) && fp >= -2 && fp <= 2) {
        cfg.frequency_penalty = fp;
      }
    }

    if (presencePenalty !== "") {
      const pp = parseFloat(presencePenalty);
      if (!isNaN(pp) && pp >= -2 && pp <= 2) {
        cfg.presence_penalty = pp;
      }
    }

    if (outputMode) {
      cfg.output_mode = outputMode;
    }

    if (reasoningEffort) {
      cfg.reasoning = { effort: reasoningEffort };
    }

    if (providerOrder.trim()) {
      const providers = providerOrder
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);
      if (providers.length > 0) {
        cfg.provider = { order: providers };
      }
    }

    return cfg;
  }, [model, temperature, topP, topLogprobs, frequencyPenalty, presencePenalty, outputMode, reasoningEffort, providerOrder]);

  // Validate configuration and compute ID when config changes
  const runValidation = useCallback(async (cfg: EnsembleLlmConfig | null) => {
    if (!cfg) {
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
    const result = await validateEnsembleLlm(cfg);
    setIsValidating(false);

    if (result.success && result.data) {
      setComputedId(result.data.id);
      setValidationError(null);
    } else {
      setComputedId(null);
      setValidationError(result.error || "Validation failed");
    }
  }, [wasmReady]);

  // Debounce validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runValidation(config);
    }, WASM_VALIDATION_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [config, runValidation]);

  const configJson = config ? JSON.stringify(config, null, 2) : "";
  const isValid = config !== null;

  const handleCopyJson = () => {
    if (configJson) {
      navigator.clipboard.writeText(configJson);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    }
  };

  const filteredSuggestions = MODEL_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(model.toLowerCase())
  );

  return (
    <div className="page">
      <div className="container">
        {/* Breadcrumb */}
        <div style={{ marginBottom: "16px" }}>
          <Link
            href="/ensemble-llms"
            style={{
              color: "var(--text-muted)",
              textDecoration: "none",
              fontSize: "14px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Ensemble LLMs
          </Link>
        </div>

        {/* Page Header */}
        <div style={{ marginBottom: isMobile ? "32px" : "40px" }}>
          <span className="tag" style={{ marginBottom: "12px", display: "inline-block" }}>
            Create
          </span>
          <h1 style={{ fontSize: isMobile ? "28px" : "32px", fontWeight: 700, marginBottom: "8px" }}>
            Create Ensemble LLM
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: isMobile ? "14px" : "15px", maxWidth: "600px" }}>
            Configure a single LLM with specific model, parameters, and settings. The resulting configuration can be used directly in your code.
          </p>
        </div>

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "24px" : "32px",
            alignItems: "start",
          }}
        >
          {/* Left Column - Form */}
          <div className="card" style={{ padding: isMobile ? "20px" : "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "20px" }}>Configuration</h2>

            {/* Model Field (Required) */}
            <div style={{ marginBottom: "20px", position: "relative" }}>
              <label
                htmlFor="model-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Model <span style={{ color: "var(--accent)" }}>*</span>
              </label>
              <input
                id="model-input"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), DROPDOWN_BLUR_DELAY_MS)}
                placeholder="e.g., openai/gpt-4o"
                className="input"
                style={{ fontFamily: "monospace" }}
                aria-describedby="model-hint"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    marginTop: "4px",
                    zIndex: 10,
                    maxHeight: "200px",
                    overflow: "auto",
                    boxShadow: "0 4px 12px var(--shadow)",
                  }}
                >
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        setModel(suggestion);
                        setShowSuggestions(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        fontSize: "14px",
                        fontFamily: "monospace",
                        textAlign: "left",
                        background: "none",
                        border: "none",
                        color: "var(--text)",
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--nav-surface)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
              <p id="model-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                The model identifier (e.g., provider/model-name)
              </p>
            </div>

            {/* Temperature */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="temperature-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Temperature
              </label>
              <input
                id="temperature-input"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0-2 (default: 1.0)"
                min={0}
                max={2}
                step={0.1}
                className="input"
                aria-describedby="temperature-hint"
              />
              <p id="temperature-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Controls randomness (0 = deterministic, 2 = most random)
              </p>
            </div>

            {/* Top P */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="top-p-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Top P
              </label>
              <input
                id="top-p-input"
                type="number"
                value={topP}
                onChange={(e) => setTopP(e.target.value)}
                placeholder="0-1 (default: 1.0)"
                min={0}
                max={1}
                step={0.05}
                className="input"
                aria-describedby="top-p-hint"
              />
              <p id="top-p-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Nucleus sampling threshold
              </p>
            </div>

            {/* Top Logprobs */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="top-logprobs-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Top Logprobs
              </label>
              <input
                id="top-logprobs-input"
                type="number"
                value={topLogprobs}
                onChange={(e) => setTopLogprobs(e.target.value)}
                placeholder="2-20"
                min={2}
                max={20}
                step={1}
                className="input"
                aria-describedby="top-logprobs-hint"
              />
              <p id="top-logprobs-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Enables probabilistic voting (required for vector completions)
              </p>
            </div>

            {/* Frequency Penalty */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="frequency-penalty-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Frequency Penalty
              </label>
              <input
                id="frequency-penalty-input"
                type="number"
                value={frequencyPenalty}
                onChange={(e) => setFrequencyPenalty(e.target.value)}
                placeholder="-2 to 2"
                min={-2}
                max={2}
                step={0.1}
                className="input"
                aria-describedby="frequency-penalty-hint"
              />
              <p id="frequency-penalty-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Penalizes repeated tokens based on frequency
              </p>
            </div>

            {/* Presence Penalty */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="presence-penalty-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Presence Penalty
              </label>
              <input
                id="presence-penalty-input"
                type="number"
                value={presencePenalty}
                onChange={(e) => setPresencePenalty(e.target.value)}
                placeholder="-2 to 2"
                min={-2}
                max={2}
                step={0.1}
                className="input"
                aria-describedby="presence-penalty-hint"
              />
              <p id="presence-penalty-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Penalizes tokens based on presence in text so far
              </p>
            </div>

            {/* Output Mode */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="output-mode-select"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Output Mode
              </label>
              <select
                id="output-mode-select"
                value={outputMode}
                onChange={(e) => setOutputMode(e.target.value as OutputMode | "")}
                className="select"
                aria-describedby="output-mode-hint"
              >
                <option value="">Default</option>
                {OUTPUT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              <p id="output-mode-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                How the LLM should format its output
              </p>
            </div>

            {/* Reasoning Effort */}
            <div style={{ marginBottom: "20px" }}>
              <label
                htmlFor="reasoning-effort-select"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Reasoning Effort
              </label>
              <select
                id="reasoning-effort-select"
                value={reasoningEffort}
                onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort | "")}
                className="select"
                aria-describedby="reasoning-effort-hint"
              >
                <option value="">None</option>
                {REASONING_EFFORTS.map((effort) => (
                  <option key={effort} value={effort}>
                    {effort}
                  </option>
                ))}
              </select>
              <p id="reasoning-effort-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Amount of reasoning to apply (for supported models)
              </p>
            </div>

            {/* Provider Order */}
            <div style={{ marginBottom: "0" }}>
              <label
                htmlFor="provider-order-input"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}
              >
                Provider Order
              </label>
              <input
                id="provider-order-input"
                type="text"
                value={providerOrder}
                onChange={(e) => setProviderOrder(e.target.value)}
                placeholder="e.g., openai, azure, together"
                className="input"
                aria-describedby="provider-order-hint"
              />
              <p id="provider-order-hint" style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Comma-separated list of provider preferences
              </p>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div style={{ position: isMobile ? "static" : "sticky", top: "120px" }}>
            {/* ID Preview Card */}
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
                  <span>Enter a model to see the computed ID</span>
                )}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                {wasmReady
                  ? "IDs are computed deterministically from the configuration using XXHash3-128"
                  : "WASM validation enables real-time ID computation"}
              </p>
            </div>

            {/* JSON Preview Card */}
            <div className="card" style={{ padding: isMobile ? "20px" : "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 600 }}>JSON Configuration</h3>
                <button
                  onClick={handleCopyJson}
                  disabled={!isValid}
                  className="pillBtnGhost"
                  style={{
                    padding: "8px 16px",
                    fontSize: "13px",
                    opacity: isValid ? 1 : 0.5,
                    cursor: isValid ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {copied ? (
                      <polyline points="20 6 9 17 4 12" />
                    ) : (
                      <>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </>
                    )}
                  </svg>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre
                style={{
                  background: "var(--nav-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "16px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  overflow: "auto",
                  maxHeight: "400px",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  color: isValid ? "var(--text)" : "var(--text-muted)",
                }}
              >
                {isValid ? configJson : "{\n  // Enter a model to generate configuration\n}"}
              </pre>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div
          className="card"
          style={{
            padding: isMobile ? "20px" : "24px",
            background: "var(--nav-surface)",
            marginTop: "40px",
          }}
        >
          <h3
            style={{
              fontSize: "15px",
              fontWeight: 600,
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            About Ensemble LLMs
          </h3>
          <ul
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              lineHeight: 1.7,
              paddingLeft: "20px",
              margin: 0,
            }}
          >
            <li>
              <strong>Content-Addressed:</strong> IDs are computed from the definition itself - identical configurations always produce identical IDs
            </li>
            <li>
              <strong>Immutable:</strong> Once defined, an Ensemble LLM configuration cannot be changed (changing it creates a new ID)
            </li>
            <li>
              <strong>No Storage Needed:</strong> Copy the JSON and use it directly in your code or save it to GitHub
            </li>
            <li>
              <strong>Top Logprobs:</strong> Set this (2-20) to enable probabilistic voting for vector completions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
