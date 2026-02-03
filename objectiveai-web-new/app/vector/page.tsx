"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ArrayInput from "../../components/ArrayInput";
import { useIsMobile } from "../../hooks/useIsMobile";

// Content item types matching ArrayInput component
type TextItem = string;
type ImagePart = { type: "image_url"; image_url: { url: string } };
type AudioPart = { type: "input_audio"; input_audio: { data: string; format: "wav" | "mp3" } };
type VideoPart = { type: "video_url"; video_url: { url: string } };
type FilePart = { type: "file"; file: { file_data: string; filename: string } };
type RichContentPart = ImagePart | AudioPart | VideoPart | FilePart;
type ContentItem = TextItem | RichContentPart[];

interface VectorResult {
  id?: string;
  scores?: number[];
  weights?: number[];
  votes?: Array<{
    model: string;
    vote: number[];
    weight: number;
    from_cache?: boolean;
    from_rng?: boolean;
  }>;
  completions?: Array<{
    model: string;
    choices?: Array<{
      message?: { content?: string };
      delta?: { content?: string };
    }>;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
    total_cost?: number;
  };
  error?: string;
}

export default function VectorCompletionsPage() {
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ContentItem[]>(["", ""]);
  const [ensembleId, setEnsembleId] = useState("");
  const [profileWeights, setProfileWeights] = useState("1");
  const [isRunning, setIsRunning] = useState(false);
  const isMobile = useIsMobile();
  const [results, setResults] = useState<VectorResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [showAllModels, setShowAllModels] = useState(false);

  // Fetch model names when results contain votes
  useEffect(() => {
    if (!results?.votes || results.votes.length === 0) return;

    const uniqueIds = [...new Set(results.votes.filter(v => v?.model).map(v => v.model))];
    const idsToFetch = uniqueIds.filter(id => id && !modelNames[id]);

    if (idsToFetch.length === 0) return;

    Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const res = await fetch(`/api/ensemble-llms/${id}`);
          if (res.ok) {
            const data = await res.json();
            return { id, model: data.model as string };
          }
        } catch {
          // Ignore errors, fall back to cryptic ID
        }
        return null;
      })
    ).then((fetchResults) => {
      const newNames: Record<string, string> = {};
      for (const r of fetchResults) {
        if (r) newNames[r.id] = r.model;
      }
      if (Object.keys(newNames).length > 0) {
        setModelNames(prev => ({ ...prev, ...newNames }));
      }
    });
  }, [results?.votes, modelNames]);

  // Execute vector completion
  const handleRun = async () => {
    const textResponses = responses.filter((r): r is string => typeof r === "string" && r.trim() !== "");
    if (!prompt.trim() || textResponses.length < 2) {
      setRunError("Please enter a prompt and at least 2 responses");
      return;
    }

    if (!ensembleId.trim()) {
      setRunError("Please enter an Ensemble ID");
      return;
    }

    // Parse profile weights
    const weights = profileWeights.split(",").map(w => parseFloat(w.trim())).filter(w => !isNaN(w));
    if (weights.length === 0) {
      setRunError("Please enter valid profile weights (comma-separated numbers)");
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setResults(null);
    setShowAllModels(false);

    try {
      const validResponses = textResponses;

      const response = await fetch("/api/vector/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          responses: validResponses,
          ensemble: ensembleId.trim(),
          profile: weights,
          from_cache: true,
          from_rng: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setResults({
        ...result,
        // Store responses for display
        _responses: validResponses,
      });
    } catch (err) {
      console.error("Vector completion failed:", err);
      setRunError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  // Score color gradient
  const getScoreColor = (percentage: number): string => {
    if (percentage >= 66) return "var(--color-success)"; // green
    if (percentage >= 33) return "var(--color-warning)"; // yellow
    if (percentage >= 15) return "var(--color-danger)";  // orange
    return "var(--color-error)";                          // red
  };

  // Helper to get label from ContentItem
  const getResponseLabel = (item: ContentItem | string | undefined, maxLen: number): string => {
    if (typeof item === "string") {
      return item.length > maxLen ? item.slice(0, maxLen) + "..." : item;
    }
    return `Option`;
  };

  // Render results
  const renderResults = () => {
    if (!results?.scores) return null;

    const scores = results.scores;
    const storedResponses = (results as { _responses?: string[] })._responses || responses;

    const sorted = scores
      .map((score, i) => ({
        index: i,
        score,
        label: getResponseLabel(storedResponses[i], 50) || `Option ${i + 1}`,
      }))
      .sort((a, b) => b.score - a.score);

    return (
      <div>
        <p style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          marginBottom: "12px",
        }}>
          Rankings
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "6px" : "8px" }}>
          {sorted.map((item, rank) => {
            const pct = item.score * 100;
            const isTop = rank === 0;

            return (
              <div key={item.index} style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? "10px" : "14px",
                padding: isMobile ? "10px 12px" : "14px 18px",
                background: isTop ? "rgba(34, 197, 94, 0.08)" : "var(--page-bg)",
                borderRadius: isMobile ? "10px" : "14px",
                border: isTop ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid transparent",
              }}>
                <span style={{
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: 700,
                  color: getScoreColor(pct),
                  width: isMobile ? "42px" : "50px",
                  flexShrink: 0,
                }}>
                  {pct.toFixed(0)}%
                </span>
                <span style={{
                  flex: 1,
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: isTop ? 600 : 400,
                  color: isTop ? "var(--text)" : "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {item.label}
                </span>
                {isTop && !isMobile && (
                  <span style={{
                    fontSize: "11px",
                    padding: "3px 8px",
                    background: "rgba(34, 197, 94, 0.15)",
                    color: "var(--color-success)",
                    borderRadius: "6px",
                    fontWeight: 600,
                  }}>
                    Best Match
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render model breakdown
  const renderModelBreakdown = () => {
    if (!results?.votes || results.votes.length === 0) return null;

    const votes = results.votes;
    const allSimulated = votes.every(v => v.from_rng);
    const storedResponses = (results as { _responses?: string[] })._responses || responses;

    const getOptionLabel = (idx: number) => {
      if (storedResponses[idx]) {
        const item = storedResponses[idx];
        if (typeof item === "string") {
          return item.length > 18 ? item.slice(0, 18) + "..." : item;
        }
      }
      return `Option ${idx + 1}`;
    };

    const displayedVotes = showAllModels ? votes : votes.slice(0, 5);

    return (
      <div>
        <p style={{
          fontSize: isMobile ? "12px" : "13px",
          color: "var(--text-muted)",
          marginBottom: isMobile ? "12px" : "16px",
        }}>
          Model Breakdown
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "16px" }}>
          {displayedVotes.map((vote, modelIdx) => {
            const maxVoteIdx = vote.vote.indexOf(Math.max(...vote.vote));
            const confidence = Math.max(...vote.vote) * 100;
            const displayName = modelNames[vote.model] || vote.model.slice(0, 8);
            const isResolved = !!modelNames[vote.model];

            return (
              <div key={modelIdx}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: isMobile ? "flex-start" : "baseline",
                  flexDirection: isMobile ? "column" : "row",
                  gap: isMobile ? "4px" : "0",
                  marginBottom: "8px",
                }}>
                  <span style={{ fontSize: isMobile ? "12px" : "13px", color: "var(--text)" }}>
                    <span style={{
                      fontFamily: isResolved ? "inherit" : "monospace",
                      fontSize: isResolved ? (isMobile ? "12px" : "13px") : (isMobile ? "11px" : "12px"),
                      color: isResolved ? "var(--text)" : "var(--text-muted)",
                    }}>
                      {displayName}
                    </span>
                    <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>-&gt;</span>
                    {isMobile ? getOptionLabel(maxVoteIdx).slice(0, 15) + (getOptionLabel(maxVoteIdx).length > 15 ? "..." : "") : getOptionLabel(maxVoteIdx)}
                  </span>
                  <span style={{ fontSize: isMobile ? "12px" : "13px" }}>
                    <span style={{ color: getScoreColor(confidence), fontWeight: 500 }}>
                      {confidence.toFixed(0)}%
                    </span>
                    {!isMobile && (
                      <span style={{ color: "var(--text-muted)", marginLeft: "8px", fontSize: "11px" }}>
                        w:{vote.weight}
                      </span>
                    )}
                  </span>
                </div>
                <div style={{
                  height: "6px",
                  background: "var(--border)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${confidence}%`,
                    background: "var(--text-muted)",
                    borderRadius: "3px",
                    opacity: 0.4,
                  }} />
                </div>
              </div>
            );
          })}
          {votes.length > 5 && (
            <button
              onClick={() => setShowAllModels(!showAllModels)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "12px",
                color: "var(--accent)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {showAllModels
                ? "Show less"
                : `+${votes.length - 5} more model${votes.length - 5 !== 1 ? "s" : ""}`
              }
            </button>
          )}
        </div>

        {allSimulated && (
          <p style={{
            marginTop: "16px",
            fontSize: "11px",
            color: "var(--text-muted)",
            opacity: 0.7,
          }}>
            Demo mode - results simulated
          </p>
        )}
      </div>
    );
  };

  const spinnerStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />

      <div className="container">
        {/* Breadcrumb */}
        <nav style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          color: "var(--text-muted)",
        }}>
          <Link href="/" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Home
          </Link>
          <span>/</span>
          <span>Vector Completions</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? "20px" : "28px" }}>
          <h1 className="heading2" style={{ marginBottom: "4px" }}>
            Vector Completions
          </h1>
          <p style={{
            fontSize: isMobile ? "15px" : "17px",
            color: "var(--text-muted)",
            maxWidth: "700px",
            lineHeight: 1.6,
          }}>
            The core ObjectiveAI primitive. Takes a prompt and multiple responses, then uses an ensemble of LLMs to vote and rank them.
          </p>
        </div>

        {/* Main Layout */}
        <div style={{
          display: isMobile ? "flex" : "grid",
          flexDirection: "column",
          gridTemplateColumns: "1fr 1fr",
          gap: isMobile ? "16px" : "32px",
          alignItems: isMobile ? "stretch" : "start",
          maxWidth: "900px",
        }}>
          {/* Left - Input */}
          <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
            <h3 style={{
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: 600,
              marginBottom: isMobile ? "16px" : "24px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
            }}>
              Input
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
              {/* Prompt */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}>
                  Prompt
                  <span style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}>
                    The question or criteria for ranking
                  </span>
                </label>
                <div className="aiTextField">
                  <textarea
                    placeholder="Which response is most helpful?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Responses */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}>
                  Responses
                  <span style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}>
                    Options to rank (minimum 2)
                  </span>
                </label>
                <ArrayInput
                  value={responses}
                  onChange={setResponses}
                  isMobile={isMobile}
                />
              </div>

              {/* Ensemble ID */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}>
                  Ensemble ID
                  <span style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}>
                    22-character content-addressed ID
                  </span>
                </label>
                <div className="aiTextField">
                  <input
                    type="text"
                    placeholder="e.g., 0QMZqudstCDbls4uoQOhEC"
                    value={ensembleId}
                    onChange={(e) => setEnsembleId(e.target.value)}
                  />
                </div>
              </div>

              {/* Profile Weights */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}>
                  Profile Weights
                  <span style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}>
                    Comma-separated weights for each LLM
                  </span>
                </label>
                <div className="aiTextField">
                  <input
                    type="text"
                    placeholder="1, 1, 1"
                    value={profileWeights}
                    onChange={(e) => setProfileWeights(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              className="pillBtn"
              onClick={handleRun}
              disabled={isRunning}
              style={{
                width: "100%",
                marginTop: isMobile ? "20px" : "32px",
                padding: isMobile ? "12px 20px" : undefined,
                opacity: isRunning ? 0.7 : 1,
              }}
            >
              {isRunning ? "Running..." : "Execute"}
            </button>
          </div>

          {/* Right - Results */}
          <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
            <h3 style={{
              fontSize: isMobile ? "11px" : "12px",
              fontWeight: 600,
              marginBottom: isMobile ? "16px" : "24px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--text-muted)",
            }}>
              Output
            </h3>

            {!results && !isRunning && !runError && (
              <div style={{
                textAlign: "center",
                padding: isMobile ? "40px 20px" : "60px 20px",
                color: "var(--text-muted)",
              }}>
                <p style={{ marginBottom: "8px", fontSize: "32px", opacity: 0.5 }}>📊</p>
                <p style={{ fontSize: "14px" }}>Execute to see ranked results</p>
              </div>
            )}

            {isRunning && (
              <div style={{
                textAlign: "center",
                padding: isMobile ? "40px 20px" : "60px 20px",
                color: "var(--text-muted)",
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  border: "3px solid var(--border)",
                  borderTopColor: "var(--accent)",
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  animation: "spin 1s linear infinite",
                }} />
                <p style={{ fontSize: "14px" }}>Processing...</p>
              </div>
            )}

            {runError && !isRunning && !results && (
              <div style={{
                textAlign: "center",
                padding: isMobile ? "40px 20px" : "60px 20px",
              }}>
                <p style={{ color: "var(--color-error)", marginBottom: "8px" }}>
                  {runError.includes("401") ? "Not authenticated" : "Execution failed"}
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  {runError.includes("401")
                    ? "API key missing or invalid. Contact admin to set up access."
                    : runError}
                </p>
              </div>
            )}

            {results && !isRunning && (
              <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
                {renderResults()}
                {renderModelBreakdown()}

                {/* Usage & Cost */}
                {results.usage && (
                  <div style={{
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    background: "var(--page-bg)",
                    borderRadius: isMobile ? "10px" : "12px",
                    fontSize: isMobile ? "12px" : "13px",
                    color: "var(--text-muted)",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: isMobile ? "12px" : "16px",
                  }}>
                    <span>
                      {results.usage.total_tokens.toLocaleString()} tokens
                    </span>
                    {results.usage.cost !== undefined && (
                      <span style={{ color: "var(--text)" }}>
                        ${results.usage.cost.toFixed(4)}
                      </span>
                    )}
                    {!isMobile && results.usage.total_cost !== undefined && results.usage.total_cost !== results.usage.cost && (
                      <span>
                        (${results.usage.total_cost.toFixed(4)} total)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div style={{
          marginTop: isMobile ? "32px" : "48px",
          padding: isMobile ? "16px" : "24px",
          background: "var(--card-bg)",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          maxWidth: "900px",
        }}>
          <h3 style={{
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "12px",
            color: "var(--text)",
          }}>
            How it works
          </h3>
          <ul style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.7,
            paddingLeft: "20px",
            margin: 0,
          }}>
            <li>Each LLM in the ensemble votes on which response best answers the prompt</li>
            <li>Votes are weighted by the profile to compute final scores</li>
            <li>Scores sum to 1 - higher score means stronger preference</li>
            <li>You need an Ensemble ID - browse ensembles at <Link href="/ensembles" style={{ color: "var(--accent)" }}>/ensembles</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
