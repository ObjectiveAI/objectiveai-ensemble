"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface TrainingExample {
  input: Record<string, unknown>;
  expectedOutput: number | number[];
}

interface FunctionOption {
  owner: string;
  repository: string;
  commit: string;
  type: "scalar" | "vector";
}

export default function ProfileTrainPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [availableFunctions, setAvailableFunctions] = useState<FunctionOption[]>([]);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(true);
  const [selectedFunctionIndex, setSelectedFunctionIndex] = useState<number | null>(null);

  // Training data
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([
    { input: {}, expectedOutput: 0.5 }
  ]);

  // Training parameters
  const [learningRate, setLearningRate] = useState("0.01");
  const [iterations, setIterations] = useState("100");

  // UI state
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Check viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch available functions
  useEffect(() => {
    async function fetchFunctions() {
      try {
        setIsLoadingFunctions(true);
        const response = await fetch("/api/functions/pairs");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch functions");

        // Deduplicate functions (may have multiple profiles per function)
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
              type: "scalar", // Default - would need to fetch details to know actual type
            });
          }
        }

        setAvailableFunctions(uniqueFunctions);
        if (uniqueFunctions.length > 0) {
          setSelectedFunctionIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch functions:", err);
      } finally {
        setIsLoadingFunctions(false);
      }
    }
    fetchFunctions();
  }, []);

  // Get selected function
  const selectedFunction = selectedFunctionIndex !== null
    ? availableFunctions[selectedFunctionIndex]
    : null;

  // Add training example
  const addExample = () => {
    setTrainingExamples([
      ...trainingExamples,
      { input: {}, expectedOutput: 0.5 }
    ]);
  };

  // Remove training example
  const removeExample = (index: number) => {
    setTrainingExamples(trainingExamples.filter((_, i) => i !== index));
  };

  // Update example input (as JSON string)
  const updateExampleInput = (index: number, jsonString: string) => {
    const updated = [...trainingExamples];
    try {
      updated[index] = { ...updated[index], input: JSON.parse(jsonString) };
    } catch {
      // Invalid JSON, store as raw for editing
      updated[index] = { ...updated[index], input: { _raw: jsonString } };
    }
    setTrainingExamples(updated);
  };

  // Update example expected output
  const updateExampleOutput = (index: number, value: string) => {
    const updated = [...trainingExamples];
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updated[index] = { ...updated[index], expectedOutput: numValue };
      setTrainingExamples(updated);
    }
  };

  // Build the training request JSON
  const buildTrainingRequest = () => {
    if (!selectedFunction) return null;

    return {
      function: {
        owner: selectedFunction.owner,
        repository: selectedFunction.repository,
        commit: selectedFunction.commit,
      },
      training_data: trainingExamples.map(ex => ({
        input: ex.input,
        expected_output: ex.expectedOutput,
      })),
      parameters: {
        learning_rate: parseFloat(learningRate),
        iterations: parseInt(iterations, 10),
      },
    };
  };

  // Format input for display
  const formatInputForDisplay = (input: Record<string, unknown>): string => {
    if (input._raw && typeof input._raw === "string") {
      return input._raw;
    }
    return JSON.stringify(input, null, 2);
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: isMobile ? "0 16px" : "0 32px" }}>
        {/* Breadcrumb */}
        <nav style={{
          display: "flex",
          gap: "8px",
          fontSize: "14px",
          color: "var(--text-muted)",
          marginBottom: "20px",
        }}>
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
          <p style={{
            color: "var(--text-muted)",
            fontSize: isMobile ? "15px" : "17px",
            maxWidth: "700px",
            lineHeight: 1.6,
          }}>
            Train optimal weights for a function by providing example inputs with expected outputs.
            ObjectiveAI learns the best ensemble weights to minimize loss on your training data.
          </p>
        </div>

        {/* Main Layout */}
        <div style={{
          display: isMobile ? "flex" : "grid",
          flexDirection: "column",
          gridTemplateColumns: "1fr 1fr",
          gap: isMobile ? "16px" : "32px",
          alignItems: isMobile ? "stretch" : "start",
          maxWidth: "1000px",
        }}>
          {/* Left - Configuration */}
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
            {/* Function Selector */}
            <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
              <h3 style={{
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 600,
                marginBottom: isMobile ? "16px" : "24px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
              }}>
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
                <p style={{
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  marginTop: "12px",
                }}>
                  Commit: <code style={{
                    background: "var(--page-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                  }}>
                    {selectedFunction.commit.substring(0, 7)}
                  </code>
                </p>
              )}
            </div>

            {/* Training Parameters */}
            <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
              <h3 style={{
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 600,
                marginBottom: isMobile ? "16px" : "24px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
              }}>
                Training Parameters
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}>
                    Learning Rate
                    <span style={{
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      marginLeft: "8px",
                    }}>
                      Step size for weight updates
                    </span>
                  </label>
                  <div className="aiTextField">
                    <input
                      type="number"
                      step="0.001"
                      min="0.0001"
                      max="1"
                      value={learningRate}
                      onChange={(e) => setLearningRate(e.target.value)}
                      placeholder="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}>
                    Iterations
                    <span style={{
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      marginLeft: "8px",
                    }}>
                      Training rounds
                    </span>
                  </label>
                  <div className="aiTextField">
                    <input
                      type="number"
                      step="10"
                      min="10"
                      max="10000"
                      value={iterations}
                      onChange={(e) => setIterations(e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Training Data */}
          <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: isMobile ? "16px" : "24px",
            }}>
              <h3 style={{
                fontSize: isMobile ? "11px" : "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
              }}>
                Training Examples
              </h3>
              <span style={{
                fontSize: "12px",
                color: "var(--text-muted)",
              }}>
                {trainingExamples.length} example{trainingExamples.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {trainingExamples.map((example, index) => (
                <div
                  key={index}
                  style={{
                    padding: isMobile ? "12px" : "16px",
                    background: "var(--page-bg)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}>
                    <span style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text)",
                    }}>
                      Example {index + 1}
                    </span>
                    {trainingExamples.length > 1 && (
                      <button
                        onClick={() => removeExample(index)}
                        style={{
                          padding: "4px 8px",
                          background: "none",
                          border: "none",
                          color: "rgb(239, 68, 68)",
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
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 500,
                      marginBottom: "6px",
                      color: "var(--text-muted)",
                    }}>
                      Input (JSON)
                    </label>
                    <div className="aiTextField">
                      <textarea
                        value={formatInputForDisplay(example.input)}
                        onChange={(e) => updateExampleInput(index, e.target.value)}
                        placeholder='{"text": "example input"}'
                        rows={3}
                        style={{
                          fontFamily: "monospace",
                          fontSize: "13px",
                        }}
                      />
                    </div>
                  </div>

                  {/* Expected Output */}
                  <div>
                    <label style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 500,
                      marginBottom: "6px",
                      color: "var(--text-muted)",
                    }}>
                      Expected Output
                      <span style={{ marginLeft: "6px", fontWeight: 400 }}>
                        (0-1 for scalar, index for vector)
                      </span>
                    </label>
                    <div className="aiTextField">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={typeof example.expectedOutput === 'number' ? example.expectedOutput : ''}
                        onChange={(e) => updateExampleOutput(index, e.target.value)}
                        placeholder="0.5"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Example Button */}
              <button
                onClick={addExample}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Training Example
              </button>
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div style={{
          maxWidth: "1000px",
          marginTop: isMobile ? "24px" : "32px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: "16px",
          alignItems: isMobile ? "stretch" : "center",
        }}>
          {/* Start Training Button - Disabled */}
          <button
            disabled
            className="pillBtn"
            style={{
              padding: isMobile ? "14px 24px" : "14px 32px",
              opacity: 0.5,
              cursor: "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Start Training
          </button>

          <span style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            padding: "8px 16px",
            background: "rgba(107, 92, 255, 0.1)",
            borderRadius: "8px",
          }}>
            Coming Soon — Backend integration in progress
          </span>

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
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            {showJsonPreview ? "Hide" : "Show"} Request Preview
          </button>
        </div>

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
            <h4 style={{
              fontSize: "12px",
              fontWeight: 600,
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
            }}>
              Training Request Preview
            </h4>
            <pre style={{
              background: "var(--page-bg)",
              padding: "16px",
              borderRadius: "8px",
              overflow: "auto",
              fontSize: "12px",
              fontFamily: "monospace",
              color: "var(--text)",
              lineHeight: 1.5,
              maxHeight: "300px",
            }}>
              {JSON.stringify(buildTrainingRequest(), null, 2)}
            </pre>
            <p style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "12px",
            }}>
              This is the request that would be sent to{" "}
              <code style={{
                background: "var(--page-bg)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
                POST /api/profiles/train
              </code>
            </p>
          </div>
        )}

        {/* Placeholder Results Section */}
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
          <h3 style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-4" />
            </svg>
            Training Results
          </h3>
          <p style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            marginBottom: "16px",
          }}>
            When training completes, this section will show:
          </p>
          <ul style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            paddingLeft: "20px",
          }}>
            <li><strong>Learned Weights</strong> — Optimized weights for each LLM in the ensemble</li>
            <li><strong>Training Loss</strong> — How well the model fits your training data</li>
            <li><strong>Validation Metrics</strong> — Performance on held-out examples</li>
            <li><strong>Profile Export</strong> — Download as profile.json for GitHub hosting</li>
          </ul>
        </div>

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
          <h3 style={{
            fontSize: "15px",
            fontWeight: 600,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            How Profile Training Works
          </h3>
          <div style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}>
            <p style={{ marginBottom: "12px" }}>
              ObjectiveAI doesn&apos;t fine-tune LLMs—it learns optimal <strong style={{ color: "var(--text)" }}>weights</strong> over fixed models.
              This is faster, more interpretable, and doesn&apos;t require model access.
            </p>
            <p style={{ marginBottom: "12px" }}>
              <strong style={{ color: "var(--text)" }}>Training Process:</strong>
            </p>
            <ol style={{ paddingLeft: "20px", marginBottom: "12px" }}>
              <li style={{ marginBottom: "4px" }}>You provide training examples with expected outputs</li>
              <li style={{ marginBottom: "4px" }}>ObjectiveAI executes the function repeatedly with different weights</li>
              <li style={{ marginBottom: "4px" }}>A loss function measures how far outputs are from expected values</li>
              <li style={{ marginBottom: "4px" }}>Weights are adjusted to minimize loss using gradient descent</li>
              <li style={{ marginBottom: "4px" }}>The final weights are saved as a Profile</li>
            </ol>
            <p>
              The resulting Profile can be hosted on GitHub and used with{" "}
              <code style={{
                background: "var(--card-bg)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
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
