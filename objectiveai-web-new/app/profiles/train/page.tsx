"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Functions } from "objectiveai";
import { createPublicClient } from "../../../lib/client";
import { useObjectiveAI } from "../../../hooks/useObjectiveAI";
import { useIsMobile } from "../../../hooks/useIsMobile";

interface DatasetItem {
  input: Record<string, unknown>;
  target: {
    type: "scalar" | "vector" | "vector_winner";
    value: number | number[];
  };
}

interface FunctionOption {
  owner: string;
  repository: string;
  commit: string;
}

interface FittingStats {
  loss: number;
  executions: number;
  starts: number;
  rounds: number;
  errors: number;
}

interface TrainingResult {
  id: string;
  profile: { weights: Record<string, number> };
  fitting_stats: FittingStats;
  executions_errors: boolean;
  usage?: {
    cost?: number;
    total_cost?: number;
  };
}

export default function ProfileTrainPage() {
  const isMobile = useIsMobile();
  const { getClient } = useObjectiveAI();
  const [availableFunctions, setAvailableFunctions] = useState<FunctionOption[]>([]);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(true);
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState<number | null>(null);

  // Training dataset
  const [datasetItems, setDatasetItems] = useState<DatasetItem[]>([
    { input: {}, target: { type: "scalar", value: 0.5 } },
  ]);
  const [inputJsonErrors, setInputJsonErrors] = useState<Record<number, string | null>>({});

  // Training parameters
  const [n, setN] = useState("1");
  const [ensembleId, setEnsembleId] = useState("");
  const [targetType, setTargetType] = useState<"scalar" | "vector" | "vector_winner">("scalar");

  // Validation errors
  const [nError, setNError] = useState<string | null>(null);
  const [ensembleError, setEnsembleError] = useState<string | null>(null);

  // Execution state
  const [isTraining, setIsTraining] = useState(false);
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [result, setResult] = useState<TrainingResult | null>(null);

  // UI state
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Validate n
  const validateN = (value: string): string | null => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return "Must be a valid integer";
    if (num < 1) return "Minimum value is 1";
    if (num > 100) return "Maximum value is 100";
    return null;
  };

  // Validate ensemble ID
  const validateEnsembleId = (value: string): string | null => {
    if (!value.trim()) return "Ensemble ID is required";
    if (value.length < 22) return "Must be at least 22 characters";
    return null;
  };

  // Fetch available functions
  useEffect(() => {
    async function fetchFunctions() {
      try {
        setIsLoadingFunctions(true);
        const publicClient = createPublicClient();
        const data = await Functions.listPairs(publicClient);

        const seen = new Set<string>();
        const uniqueFunctions: FunctionOption[] = [];

        for (const pair of data.data || []) {
          const key = `${pair.function.owner}/${pair.function.repository}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFunctions.push({
              owner: pair.function.owner,
              repository: pair.function.repository,
              commit: pair.function.commit,
            });
          }
        }

        setAvailableFunctions(uniqueFunctions);
        if (uniqueFunctions.length > 0) {
          setSelectedFunctionIndex(0);
        }
      } catch {
        // Silent failure - show empty function list
      } finally {
        setIsLoadingFunctions(false);
      }
    }
    fetchFunctions();
  }, []);

  const selectedFunction =
    selectedFunctionIndex !== null ? availableFunctions[selectedFunctionIndex] : null;

  // Dataset management
  const addItem = () => {
    const defaultTarget =
      targetType === "scalar"
        ? { type: "scalar" as const, value: 0.5 }
        : targetType === "vector"
          ? { type: "vector" as const, value: [0.5, 0.5] as number[] }
          : { type: "vector_winner" as const, value: 0 };
    setDatasetItems([...datasetItems, { input: {}, target: defaultTarget }]);
  };

  const removeItem = (index: number) => {
    setDatasetItems(datasetItems.filter((_, i) => i !== index));
    setInputJsonErrors((prev) => {
      const newErrors: Record<number, string | null> = {};
      Object.keys(prev).forEach((key) => {
        const keyNum = parseInt(key, 10);
        if (keyNum < index) newErrors[keyNum] = prev[keyNum];
        else if (keyNum > index) newErrors[keyNum - 1] = prev[keyNum];
      });
      return newErrors;
    });
  };

  const updateItemInput = (index: number, jsonString: string) => {
    const updated = [...datasetItems];
    try {
      updated[index] = { ...updated[index], input: JSON.parse(jsonString) };
      setInputJsonErrors((prev) => ({ ...prev, [index]: null }));
    } catch {
      updated[index] = { ...updated[index], input: { _raw: jsonString } };
      setInputJsonErrors((prev) => ({
        ...prev,
        [index]: jsonString.trim().length > 0 ? "Invalid JSON format" : null,
      }));
    }
    setDatasetItems(updated);
  };

  const updateItemTargetValue = (index: number, value: string) => {
    const updated = [...datasetItems];
    const target = updated[index].target;

    if (target.type === "scalar") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updated[index] = { ...updated[index], target: { type: "scalar", value: numValue } };
      }
    } else if (target.type === "vector_winner") {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue)) {
        updated[index] = { ...updated[index], target: { type: "vector_winner", value: numValue } };
      }
    } else if (target.type === "vector") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          updated[index] = { ...updated[index], target: { type: "vector", value: parsed } };
        }
      } catch {
        // Keep current value while user is typing
      }
    }
    setDatasetItems(updated);
  };

  // Update all targets when target type changes
  const handleTargetTypeChange = (newType: "scalar" | "vector" | "vector_winner") => {
    setTargetType(newType);
    setDatasetItems((prev) =>
      prev.map((item) => ({
        ...item,
        target:
          newType === "scalar"
            ? { type: "scalar", value: 0.5 }
            : newType === "vector"
              ? { type: "vector", value: [0.5, 0.5] }
              : { type: "vector_winner", value: 0 },
      }))
    );
  };

  // Build request
  const buildRequest = () => {
    if (!selectedFunction) return null;
    return {
      function: {
        owner: selectedFunction.owner,
        repository: selectedFunction.repository,
        commit: selectedFunction.commit,
      },
      dataset: datasetItems.map((item) => ({
        input: item.input,
        target: item.target,
      })),
      n: parseInt(n, 10),
      ensemble: ensembleId,
      from_cache: true,
      from_rng: true,
    };
  };

  // Submit training
  const handleSubmit = async () => {
    // Validate
    const nErr = validateN(n);
    const ensErr = validateEnsembleId(ensembleId);
    setNError(nErr);
    setEnsembleError(ensErr);

    if (nErr || ensErr) return;
    if (!selectedFunction) return;

    const hasJsonErrors = Object.values(inputJsonErrors).some((e) => e !== null);
    if (hasJsonErrors) return;

    setIsTraining(true);
    setTrainingError(null);
    setResult(null);

    try {
      const client = await getClient();
      const request = buildRequest();
      if (!request) throw new Error("Invalid request configuration");

      const data = await Functions.Profiles.Computations.remoteFunctionCreate(
        client,
        request.function.owner,
        request.function.repository,
        request.function.commit ?? null,
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dataset: request.dataset as any,
          n: request.n,
          ensemble: request.ensemble,
          from_cache: request.from_cache,
          from_rng: request.from_rng,
        },
      );

      setResult(data as unknown as TrainingResult);
    } catch (err) {
      setTrainingError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setIsTraining(false);
    }
  };

  // Format input for display
  const formatInputForDisplay = (input: Record<string, unknown>): string => {
    if (input._raw && typeof input._raw === "string") return input._raw;
    return JSON.stringify(input, null, 2);
  };

  const formatTargetValue = (target: DatasetItem["target"]): string => {
    if (target.type === "vector") return JSON.stringify(target.value);
    return String(target.value);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Breadcrumb */}
        <nav
          style={{
            display: "flex",
            gap: "8px",
            fontSize: "14px",
            color: "var(--text-muted)",
            marginBottom: "20px",
          }}
        >
          <Link href="/profiles" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Profiles
          </Link>
          <span>/</span>
          <span>Train</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? "24px" : "32px" }}>
          <span className="tag" style={{ marginBottom: "12px", display: "inline-block" }}>
            Beta
          </span>
          <h1 className="heading2" style={{ marginBottom: "8px" }}>
            Train Profile
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: isMobile ? "15px" : "17px",
              maxWidth: "700px",
              lineHeight: 1.6,
            }}
          >
            Train optimal weights for a function by providing example inputs with expected outputs.
            ObjectiveAI learns the best ensemble weights to minimize loss on your training data.
          </p>
        </div>

        {/* Main Layout */}
        <div
          style={{
            display: isMobile ? "flex" : "grid",
            flexDirection: "column",
            gridTemplateColumns: "1fr 1fr",
            gap: isMobile ? "16px" : "32px",
            alignItems: isMobile ? "stretch" : "start",
            maxWidth: "1000px",
          }}
        >
          {/* Left - Configuration */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
            {/* Function Selector */}
            <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
              <h3
                style={{
                  fontSize: isMobile ? "11px" : "12px",
                  fontWeight: 600,
                  marginBottom: isMobile ? "16px" : "24px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                }}
              >
                Function
              </h3>

              {isLoadingFunctions ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                  Loading functions...
                </div>
              ) : availableFunctions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                  No functions available
                </div>
              ) : (
                <select
                  className="select"
                  value={selectedFunctionIndex ?? ""}
                  onChange={(e) => setSelectedFunctionIndex(parseInt(e.target.value, 10))}
                  style={{
                    width: "100%",
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    fontSize: isMobile ? "14px" : "15px",
                  }}
                >
                  {availableFunctions.map((fn, idx) => (
                    <option key={`${fn.owner}/${fn.repository}`} value={idx}>
                      {fn.owner}/{fn.repository}
                    </option>
                  ))}
                </select>
              )}

              {selectedFunction && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    marginTop: "12px",
                  }}
                >
                  Commit:{" "}
                  <code
                    style={{
                      background: "var(--page-bg)",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedFunction.commit.substring(0, 7)}
                  </code>
                </p>
              )}
            </div>

            {/* Training Parameters */}
            <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
              <h3
                style={{
                  fontSize: isMobile ? "11px" : "12px",
                  fontWeight: 600,
                  marginBottom: isMobile ? "16px" : "24px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                }}
              >
                Training Parameters
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Ensemble ID */}
                <div>
                  <label
                    htmlFor="ensemble-id"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "var(--text)",
                    }}
                  >
                    Ensemble ID
                    <span
                      style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}
                    >
                      The ensemble to learn weights for
                    </span>
                  </label>
                  <div
                    className="aiTextField"
                    style={{
                      borderColor: ensembleError ? "var(--color-error)" : undefined,
                    }}
                  >
                    <input
                      id="ensemble-id"
                      type="text"
                      value={ensembleId}
                      onChange={(e) => {
                        setEnsembleId(e.target.value);
                        setEnsembleError(validateEnsembleId(e.target.value));
                      }}
                      onBlur={(e) => setEnsembleError(validateEnsembleId(e.target.value))}
                      placeholder="22-character ensemble ID"
                      aria-invalid={!!ensembleError}
                      aria-describedby={ensembleError ? "ensemble-id-error" : undefined}
                      style={{
                        fontFamily: "monospace",
                        fontSize: "14px",
                        borderColor: ensembleError ? "var(--color-error)" : undefined,
                      }}
                    />
                  </div>
                  {ensembleError && (
                    <p
                      id="ensemble-id-error"
                      style={{ fontSize: "12px", color: "var(--color-error)", marginTop: "6px" }}
                    >
                      {ensembleError}
                    </p>
                  )}
                </div>

                {/* N (executions per dataset item) */}
                <div>
                  <label
                    htmlFor="n-param"
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "var(--text)",
                    }}
                  >
                    Executions per item (n)
                    <span
                      style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}
                    >
                      Higher values improve quality
                    </span>
                  </label>
                  <div
                    className="aiTextField"
                    style={{ borderColor: nError ? "var(--color-error)" : undefined }}
                  >
                    <input
                      id="n-param"
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={n}
                      onChange={(e) => {
                        setN(e.target.value);
                        setNError(validateN(e.target.value));
                      }}
                      onBlur={(e) => setNError(validateN(e.target.value))}
                      placeholder="1"
                      aria-invalid={!!nError}
                      aria-describedby={nError ? "n-param-error" : undefined}
                      style={{ borderColor: nError ? "var(--color-error)" : undefined }}
                    />
                  </div>
                  {nError && (
                    <p
                      id="n-param-error"
                      style={{ fontSize: "12px", color: "var(--color-error)", marginTop: "6px" }}
                    >
                      {nError}
                    </p>
                  )}
                </div>

                {/* Target Type */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      marginBottom: "8px",
                      color: "var(--text)",
                    }}
                  >
                    Target Type
                    <span
                      style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "8px" }}
                    >
                      How expected outputs are specified
                    </span>
                  </label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {(["scalar", "vector", "vector_winner"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => handleTargetTypeChange(type)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: "1px solid",
                          borderColor: targetType === type ? "var(--accent)" : "var(--border)",
                          background: targetType === type ? "rgba(107, 92, 255, 0.1)" : "none",
                          color: targetType === type ? "var(--accent)" : "var(--text)",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: targetType === type ? 600 : 400,
                          transition: "all 0.15s",
                        }}
                      >
                        {type === "scalar"
                          ? "Scalar"
                          : type === "vector"
                            ? "Vector"
                            : "Vector Winner"}
                      </button>
                    ))}
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "8px",
                    }}
                  >
                    {targetType === "scalar"
                      ? "A single value in [0, 1] — the desired function output."
                      : targetType === "vector"
                        ? "An array of values summing to ~1 — the desired score distribution."
                        : "An index — which response should score highest."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Dataset */}
          <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: isMobile ? "16px" : "24px",
              }}
            >
              <h3
                style={{
                  fontSize: isMobile ? "11px" : "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--text-muted)",
                }}
              >
                Dataset
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {datasetItems.length} item{datasetItems.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {datasetItems.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: isMobile ? "12px" : "16px",
                    background: "var(--page-bg)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
                      Item {index + 1}
                    </span>
                    {datasetItems.length > 1 && (
                      <button
                        onClick={() => removeItem(index)}
                        style={{
                          padding: "4px 8px",
                          background: "none",
                          border: "none",
                          color: "var(--color-error)",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Input */}
                  <div style={{ marginBottom: "12px" }}>
                    <label
                      htmlFor={`item-input-${index}`}
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        marginBottom: "6px",
                        color: "var(--text-muted)",
                      }}
                    >
                      Input (JSON)
                    </label>
                    <div
                      className="aiTextField"
                      style={{
                        borderColor: inputJsonErrors[index] ? "var(--color-error)" : undefined,
                      }}
                    >
                      <textarea
                        id={`item-input-${index}`}
                        value={formatInputForDisplay(item.input)}
                        onChange={(e) => updateItemInput(index, e.target.value)}
                        placeholder='{"text": "example input"}'
                        rows={3}
                        style={{
                          fontFamily: "monospace",
                          fontSize: "13px",
                          borderColor: inputJsonErrors[index] ? "var(--color-error)" : undefined,
                        }}
                        aria-invalid={!!inputJsonErrors[index]}
                        aria-describedby={
                          inputJsonErrors[index] ? `item-error-${index}` : undefined
                        }
                      />
                    </div>
                    {inputJsonErrors[index] && (
                      <p
                        id={`item-error-${index}`}
                        style={{
                          fontSize: "12px",
                          color: "var(--color-error)",
                          marginTop: "6px",
                        }}
                      >
                        {inputJsonErrors[index]}
                      </p>
                    )}
                  </div>

                  {/* Target Value */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: 500,
                        marginBottom: "6px",
                        color: "var(--text-muted)",
                      }}
                    >
                      Target
                      <span style={{ marginLeft: "6px", fontWeight: 400 }}>
                        {targetType === "scalar"
                          ? "(0-1)"
                          : targetType === "vector"
                            ? "(JSON array)"
                            : "(winning index)"}
                      </span>
                    </label>
                    <div className="aiTextField">
                      <input
                        type={targetType === "vector" ? "text" : "number"}
                        step={targetType === "scalar" ? "0.01" : "1"}
                        min={targetType === "scalar" ? "0" : "0"}
                        max={targetType === "scalar" ? "1" : undefined}
                        value={formatTargetValue(item.target)}
                        onChange={(e) => updateItemTargetValue(index, e.target.value)}
                        placeholder={
                          targetType === "scalar"
                            ? "0.5"
                            : targetType === "vector"
                              ? "[0.7, 0.2, 0.1]"
                              : "0"
                        }
                        style={{
                          fontFamily: targetType === "vector" ? "monospace" : undefined,
                          fontSize: "13px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Item Button */}
              <button
                onClick={addItem}
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
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Dataset Item
              </button>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div
          style={{
            maxWidth: "1000px",
            marginTop: isMobile ? "24px" : "32px",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "16px",
            alignItems: isMobile ? "stretch" : "center",
          }}
        >
          {/* Start Training Button */}
          <button
            onClick={handleSubmit}
            disabled={isTraining || !selectedFunction || !ensembleId}
            className="pillBtn"
            style={{
              padding: isMobile ? "14px 24px" : "14px 32px",
              opacity: isTraining || !selectedFunction || !ensembleId ? 0.5 : 1,
              cursor:
                isTraining || !selectedFunction || !ensembleId ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {isTraining ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Training...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Start Training
              </>
            )}
          </button>

          {/* Preview JSON Toggle */}
          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            style={{
              marginLeft: isMobile ? 0 : "auto",
              padding: "10px 16px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 500,
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            {showJsonPreview ? "Hide" : "Show"} Request Preview
          </button>
        </div>

        {/* Error */}
        {trainingError && (
          <div
            className="card"
            style={{
              maxWidth: "1000px",
              marginTop: "16px",
              padding: "16px 20px",
              borderColor: "var(--color-error)",
            }}
          >
            <p style={{ color: "var(--color-error)", fontSize: "14px" }}>{trainingError}</p>
          </div>
        )}

        {/* JSON Preview */}
        {showJsonPreview && (
          <div
            className="card"
            style={{
              maxWidth: "1000px",
              marginTop: "16px",
              padding: isMobile ? "16px" : "20px",
              background: "var(--nav-surface)",
            }}
          >
            <h4
              style={{
                fontSize: "12px",
                fontWeight: 600,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              Training Request Preview
            </h4>
            <pre
              style={{
                background: "var(--page-bg)",
                padding: "16px",
                borderRadius: "8px",
                overflow: "auto",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "var(--text)",
                lineHeight: 1.5,
                maxHeight: "300px",
              }}
            >
              {JSON.stringify(buildRequest(), null, 2)}
            </pre>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
              This is the request that will be sent to{" "}
              <code
                style={{
                  background: "var(--page-bg)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                POST /api/profiles/train
              </code>
            </p>
          </div>
        )}

        {/* Training Results */}
        {result ? (
          <div
            className="card"
            style={{
              maxWidth: "1000px",
              marginTop: isMobile ? "32px" : "40px",
              padding: isMobile ? "20px" : "24px",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgb(34, 197, 94)"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Training Complete
            </h3>

            {/* Fitting Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  background: "var(--page-bg)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Loss
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: result.fitting_stats.loss < 0.1 ? "rgb(34, 197, 94)" : "var(--text)",
                  }}
                >
                  {result.fitting_stats.loss.toFixed(4)}
                </p>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "var(--page-bg)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Executions
                </p>
                <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "monospace" }}>
                  {result.fitting_stats.executions}
                </p>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "var(--page-bg)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Rounds
                </p>
                <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "monospace" }}>
                  {result.fitting_stats.rounds}
                </p>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "var(--page-bg)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Errors
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: result.fitting_stats.errors > 0 ? "rgb(249, 115, 22)" : "var(--text)",
                  }}
                >
                  {result.fitting_stats.errors}
                </p>
              </div>
            </div>

            {/* Learned Weights */}
            {result.profile?.weights && (
              <div>
                <h4
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--text-muted)",
                    marginBottom: "12px",
                  }}
                >
                  Learned Weights
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  {Object.entries(result.profile.weights).map(([key, weight]) => (
                    <div
                      key={key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        background: "var(--page-bg)",
                        borderRadius: "8px",
                      }}
                    >
                      <code style={{ fontSize: "13px", color: "var(--text)" }}>{key}</code>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--accent)",
                        }}
                      >
                        {(weight as number).toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(result.profile, null, 2));
              }}
              className="pillBtn"
              style={{
                padding: "10px 20px",
                fontSize: "13px",
              }}
            >
              Copy Profile JSON
            </button>

            {/* Usage */}
            {result.usage && (
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "16px",
                }}
              >
                Cost: ${(result.usage.total_cost ?? result.usage.cost ?? 0).toFixed(4)}
              </p>
            )}
          </div>
        ) : (
          <div
            className="card"
            style={{
              maxWidth: "1000px",
              marginTop: isMobile ? "32px" : "40px",
              padding: isMobile ? "20px" : "24px",
              background: "var(--nav-surface)",
              border: "1px dashed var(--border)",
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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-muted)"
                strokeWidth="2"
              >
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              Training Results
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: "16px",
              }}
            >
              When training completes, this section will show:
            </p>
            <ul
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.8,
                paddingLeft: "20px",
              }}
            >
              <li>
                <strong>Learned Weights</strong> — Optimized weights for each LLM in the ensemble
              </li>
              <li>
                <strong>Fitting Stats</strong> — Loss, rounds, executions, and errors
              </li>
              <li>
                <strong>Profile Export</strong> — Copy as profile JSON for GitHub hosting
              </li>
            </ul>
          </div>
        )}

        {/* Info Card */}
        <div
          className="card"
          style={{
            maxWidth: "1000px",
            padding: "24px",
            marginTop: "40px",
            background: "var(--nav-surface)",
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
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            How Profile Training Works
          </h3>
          <div
            style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}
          >
            <p style={{ marginBottom: "12px" }}>
              ObjectiveAI doesn&apos;t fine-tune LLMs—it learns optimal{" "}
              <strong style={{ color: "var(--text)" }}>weights</strong> over fixed models. This is
              faster, more interpretable, and doesn&apos;t require model access.
            </p>
            <p style={{ marginBottom: "12px" }}>
              <strong style={{ color: "var(--text)" }}>Training Process:</strong>
            </p>
            <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={{ marginBottom: "4px" }}>
                You provide a dataset of inputs with target outputs
              </li>
              <li style={{ marginBottom: "4px" }}>
                ObjectiveAI executes the function n times per dataset item
              </li>
              <li style={{ marginBottom: "4px" }}>
                A loss function measures how far outputs are from targets
              </li>
              <li style={{ marginBottom: "4px" }}>
                Weights are adjusted to minimize loss across multiple starts and rounds
              </li>
              <li style={{ marginBottom: "4px" }}>
                The final weights are saved as a Profile
              </li>
            </ol>
            <p>
              The resulting Profile can be hosted on GitHub and used with{" "}
              <code
                style={{
                  background: "var(--card-bg)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                Functions.Executions.create()
              </code>{" "}
              to apply the learned weights.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
