"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { deriveDisplayName, DEV_EXECUTION_OPTIONS } from "../../../lib/objectiveai";
import ArrayInput from "../../../components/ArrayInput";

interface FunctionDetails {
  owner: string;
  repository: string;
  commit: string;
  name: string;
  description: string;
  category: string;
  type: "scalar.function" | "vector.function";
  inputSchema: Record<string, unknown> | null;
}

export default function FunctionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // Parse slug (format: owner--repository)
  const [owner, repository] = slug.includes("--")
    ? slug.split("--")
    : ["unknown", slug];

  const [functionDetails, setFunctionDetails] = useState<FunctionDetails | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<{ owner: string; repository: string; commit: string }[]>([]);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [rawInput, setRawInput] = useState("{}");
  const [isRunning, setIsRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showPinnedColor, setShowPinnedColor] = useState(false);
  const [results, setResults] = useState<{
    output?: number | number[];
    inputSnapshot?: Record<string, unknown>; // Store input for display
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      cost?: number;
      total_cost?: number;
    };
    tasks?: Array<{
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
          message?: {
            content?: string;
          };
          delta?: {
            content?: string;
          };
        }>;
      }>;
      scores?: number[];
    }>;
    reasoning?: {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    } | null;
    error?: string;
  } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [showAllModels, setShowAllModels] = useState(false);
  const [expandedVotes, setExpandedVotes] = useState<Set<number>>(new Set());

  // Reasoning options
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [reasoningModel, setReasoningModel] = useState("openai/gpt-4o-mini");

  const REASONING_MODEL_OPTIONS = [
    { value: "openai/gpt-4o-mini", label: "GPT-4o Mini (cheapest)" },
    { value: "openai/gpt-4o", label: "GPT-4o" },
    { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
    { value: "anthropic/claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
  ];

  // Fetch function details
  useEffect(() => {
    async function fetchDetails() {
      try {
        setIsLoadingDetails(true);
        setLoadError(null);

        // First get the function-profile pairs via API route
        const pairsRes = await fetch('/api/functions/pairs');
        if (!pairsRes.ok) throw new Error('Failed to fetch function pairs');
        const pairs = await pairsRes.json();

        // Find ALL pairs for this function (may have multiple profiles)
        const matchingPairs = pairs.data.filter(
          (p: { function: { owner: string; repository: string } }) =>
            p.function.owner === owner && p.function.repository === repository
        );

        if (matchingPairs.length === 0) {
          throw new Error(`Function ${owner}/${repository} not found`);
        }

        // Store all available profiles
        const profiles = matchingPairs.map((p: { profile: { owner: string; repository: string; commit: string } }) => p.profile);
        setAvailableProfiles(profiles);
        setSelectedProfileIndex(0);

        // Use the first pair for function details
        const pair = matchingPairs[0];

        // Fetch full function details via API route
        const slug = `${pair.function.owner}--${pair.function.repository}`;
        const detailsRes = await fetch(`/api/functions/${slug}?commit=${pair.function.commit}`);
        if (!detailsRes.ok) throw new Error(`Failed to fetch function details`);
        const details = await detailsRes.json();

        const category = details.type === "vector.function" ? "Ranking" : "Scoring";

        setFunctionDetails({
          owner: pair.function.owner,
          repository: pair.function.repository,
          commit: pair.function.commit,
          name: deriveDisplayName(pair.function.repository),
          description: details.description || `${deriveDisplayName(pair.function.repository)} function`,
          category,
          type: details.type as "scalar.function" | "vector.function",
          inputSchema: (details as { input_schema?: Record<string, unknown> }).input_schema || null,
        });
      } catch (err) {
        console.error("Failed to fetch function details:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load function");
      } finally {
        setIsLoadingDetails(false);
      }
    }

    fetchDetails();
  }, [owner, repository]);

  // Load saved state from localStorage
  useEffect(() => {
    const savedLibrary = localStorage.getItem("pinned-functions");
    if (savedLibrary) {
      const library = JSON.parse(savedLibrary);
      setIsSaved(library.includes(slug));
    }
  }, [slug]);

  // Toggle save state
  const toggleSave = () => {
    const savedLibrary = localStorage.getItem("pinned-functions");
    const library = savedLibrary ? JSON.parse(savedLibrary) : [];

    if (isSaved) {
      const updated = library.filter((s: string) => s !== slug);
      localStorage.setItem("pinned-functions", JSON.stringify(updated));
      setIsSaved(false);
    } else {
      library.push(slug);
      localStorage.setItem("pinned-functions", JSON.stringify(library));
      setIsSaved(true);
      setShowPinnedColor(true);
      setTimeout(() => setShowPinnedColor(false), 1000);
    }
  };

  // Track viewport size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch model names when results contain votes
  useEffect(() => {
    if (!results?.tasks || !Array.isArray(results.tasks) || results.tasks.length === 0) return;

    const allVotes = results.tasks.flatMap(t => (t && t.votes) ? t.votes : []);
    if (allVotes.length === 0) return;

    const uniqueIds = [...new Set(allVotes.filter(v => v?.model).map(v => v.model))];
    const idsToFetch = uniqueIds.filter(id => id && !modelNames[id]);

    if (idsToFetch.length === 0) return;

    // Fetch in parallel
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
    ).then((results) => {
      const newNames: Record<string, string> = {};
      for (const r of results) {
        if (r) newNames[r.id] = r.model;
      }
      if (Object.keys(newNames).length > 0) {
        setModelNames(prev => ({ ...prev, ...newNames }));
      }
    });
  }, [results?.tasks, modelNames]);

  // Execute function via server API route with streaming
  const handleRun = async () => {
    const selectedProfile = availableProfiles[selectedProfileIndex];
    if (!functionDetails || !selectedProfile) return;

    setIsRunning(true);
    setRunError(null);
    setResults(null);
    setShowAllModels(false);
    setExpandedVotes(new Set());

    try {
      // Build execution options with optional reasoning
      const executionOptions = {
        ...DEV_EXECUTION_OPTIONS,
        reasoning: reasoningEnabled ? {
          model: {
            model: reasoningModel,
            output_mode: "instruction" as const,
          },
        } : undefined,
      };

      const response = await fetch("/api/functions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          functionRef: {
            owner: functionDetails.owner,
            repository: functionDetails.repository,
            commit: functionDetails.commit,
          },
          profileRef: {
            owner: selectedProfile.owner,
            repository: selectedProfile.repository,
            commit: selectedProfile.commit,
          },
          input: formData,
          options: executionOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Check if streaming response
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("text/event-stream")) {
        // Handle SSE streaming with proper chunk merging
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Accumulated state - properly merged across chunks
        type AccumulatedTask = NonNullable<typeof results>["tasks"] extends (infer T)[] | undefined ? T : never;
        let accumulatedOutput: number | number[] | undefined;
        let accumulatedTasks: AccumulatedTask[] = [];
        let accumulatedUsage: NonNullable<typeof results>["usage"] | undefined;
        let accumulatedReasoningContent = "";

        // Helper: Merge completions by model, accumulating delta content
        type CompletionType = NonNullable<AccumulatedTask["completions"]>[number];
        const mergeCompletions = (existing: CompletionType[] | undefined, incoming: CompletionType[] | undefined): CompletionType[] | undefined => {
          if (!Array.isArray(incoming) || incoming.length === 0) return existing;
          if (!Array.isArray(existing) || existing.length === 0) return incoming;

          const result = [...existing];
          for (const comp of incoming) {
            if (!comp) continue;
            const existingIdx = result.findIndex(c => c.model === comp.model);
            if (existingIdx === -1) {
              result.push(comp);
            } else {
              // Merge: accumulate delta content
              const existingComp = result[existingIdx];
              const existingContent = existingComp.choices?.[0]?.delta?.content || existingComp.choices?.[0]?.message?.content || "";
              const incomingContent = comp.choices?.[0]?.delta?.content || "";
              const mergedContent = existingContent + incomingContent;

              result[existingIdx] = {
                ...existingComp,
                choices: [{
                  ...existingComp.choices?.[0],
                  delta: { content: mergedContent },
                  message: comp.choices?.[0]?.message || existingComp.choices?.[0]?.message,
                }],
              };
            }
          }
          return result;
        };

        // Helper: Merge tasks by index (like SDK's TaskChunk.mergedList)
        const mergeTasks = (existing: AccumulatedTask[], incoming: AccumulatedTask[]): AccumulatedTask[] => {
          const result = [...existing];
          for (const task of incoming) {
            if (!task) continue;
            const taskIndex = (task as { index?: number }).index;
            const existingIdx = result.findIndex(t => t && (t as { index?: number }).index === taskIndex);
            if (existingIdx === -1) {
              // New task, add it
              result.push(task);
            } else {
              // Merge existing task - combine votes, completions (with delta accumulation), scores
              const existingTask = result[existingIdx];
              result[existingIdx] = {
                ...existingTask,
                votes: Array.isArray(task.votes) && task.votes.length > 0 ? task.votes : existingTask?.votes,
                completions: mergeCompletions(existingTask?.completions, task.completions),
                scores: Array.isArray(task.scores) && task.scores.length > 0 ? task.scores : existingTask?.scores,
              };
            }
          }
          return result;
        };

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        try {
          while (true) {
            const readResult = await reader.read();
            if (readResult.done) break;
            if (!readResult.value) continue;

            buffer += decoder.decode(readResult.value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              if (!data) continue;

              try {
                const chunk = JSON.parse(data);
                if (chunk.error) {
                  throw new Error(chunk.error);
                }

                // Merge output (take latest)
                if (chunk.output !== undefined) accumulatedOutput = chunk.output;

                // Merge tasks by index
                if (chunk.tasks && Array.isArray(chunk.tasks)) {
                  accumulatedTasks = mergeTasks(accumulatedTasks, chunk.tasks);
                }

                // Merge usage (take latest)
                if (chunk.usage) accumulatedUsage = chunk.usage;

                // Merge reasoning delta content (concatenate like SDK's mergedString)
                if (chunk.reasoning?.choices?.[0]?.delta?.content) {
                  accumulatedReasoningContent += chunk.reasoning.choices[0].delta.content;
                } else if (chunk.reasoning?.choices?.[0]?.message?.content) {
                  // Full message (non-streaming fallback)
                  accumulatedReasoningContent = chunk.reasoning.choices[0].message.content;
                }

                // Update UI progressively
                setResults({
                  output: accumulatedOutput,
                  inputSnapshot: { ...formData },
                  usage: accumulatedUsage,
                  tasks: accumulatedTasks.length > 0 ? accumulatedTasks : undefined,
                  reasoning: accumulatedReasoningContent ? {
                    choices: [{ message: { content: accumulatedReasoningContent } }]
                  } : undefined,
                });
              } catch (parseErr) {
                console.error("Failed to parse chunk:", parseErr);
              }
            }
          }
        }
        } catch (streamErr) {
          console.error("Stream reading error:", streamErr);
          throw streamErr;
        }
      } else {
        // Non-streaming fallback
        const result = await response.json();
        if ("output" in result) {
          setResults({
            output: result.output as number | number[],
            inputSnapshot: { ...formData },
            usage: result.usage,
            tasks: result.tasks,
            reasoning: result.reasoning,
          });
        }
      }
    } catch (err) {
      console.error("Function execution failed:", err);
      setRunError(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  // Build input fields from schema
  const renderInputFields = () => {
    if (!functionDetails?.inputSchema) {
      // Fallback: single text input
      return (
        <div>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text)",
          }}>
            Input
            <span style={{
              fontWeight: 400,
              color: "var(--text-muted)",
              marginLeft: "8px",
            }}>
              Your input data (JSON)
            </span>
          </label>
          <div className="aiTextField">
            <textarea
              placeholder="Enter input as JSON..."
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                try {
                  setFormData(JSON.parse(e.target.value));
                } catch {
                  // Keep typing, will parse on submit
                }
              }}
              rows={6}
            />
          </div>
        </div>
      );
    }

    // Parse input_schema to generate fields
    const schema = functionDetails.inputSchema as {
      type?: string;
      properties?: Record<string, { type?: string; description?: string; items?: { type?: string } }>;
    };

    if (schema.type === "object" && schema.properties) {
      return Object.entries(schema.properties).map(([key, prop]) => (
        <div key={key}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text)",
          }}>
            {key.charAt(0).toUpperCase() + key.slice(1)}
            {prop.description && (
              <span style={{
                fontWeight: 400,
                color: "var(--text-muted)",
                marginLeft: "8px",
                display: isMobile ? "block" : "inline",
                marginTop: isMobile ? "4px" : "0",
              }}>
                {prop.description}
              </span>
            )}
          </label>

          {prop.type === "string" && (
            <div className="aiTextField">
              <textarea
                placeholder={`Enter ${key}...`}
                value={(formData[key] as string) || ""}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                rows={3}
              />
            </div>
          )}

          {(prop.type === "number" || prop.type === "integer") && (
            <div className="aiTextField">
              <input
                type="number"
                placeholder={`Enter ${key}...`}
                value={(formData[key] as number) || ""}
                onChange={(e) => setFormData({ ...formData, [key]: parseFloat(e.target.value) })}
              />
            </div>
          )}

          {prop.type === "array" && (
            <ArrayInput
              value={Array.isArray(formData[key]) ? formData[key] : []}
              onChange={(items) => setFormData(prev => ({ ...prev, [key]: items }))}
              isMobile={isMobile}
            />
          )}

          {/* Fallback for unknown types */}
          {prop.type !== "string" && prop.type !== "number" && prop.type !== "integer" && prop.type !== "array" && (
            <div className="aiTextField">
              <textarea
                placeholder={`Enter ${key}...`}
                value={(formData[key] as string) || ""}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                rows={3}
              />
            </div>
          )}
        </div>
      ));
    }

    // Fallback for other schema types
    return (
      <div>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          marginBottom: "8px",
          color: "var(--text)",
        }}>
          Input
        </label>
        <div className="aiTextField">
          <textarea
            placeholder="Enter input as JSON..."
            value={rawInput}
            onChange={(e) => {
              setRawInput(e.target.value);
              try {
                setFormData(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, keep typing
              }
            }}
            rows={6}
          />
        </div>
      </div>
    );
  };

  // Score color gradient: green (100%) → yellow (66%) → orange (33%) → red (0%)
  const getScoreColor = (percentage: number): string => {
    if (percentage >= 66) return "rgb(34, 197, 94)";   // green
    if (percentage >= 33) return "rgb(234, 179, 8)";   // yellow
    if (percentage >= 15) return "rgb(249, 115, 22)";  // orange
    return "rgb(239, 68, 68)";                          // red
  };

  // Helper to get content item label
  const getContentLabel = (index: number): string => {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const input = results?.inputSnapshot;

    // Try to get actual content from input
    const contentItems = input?.contentItems as unknown[] | undefined;
    if (contentItems && contentItems[index] !== undefined) {
      const item = contentItems[index];
      if (typeof item === "string") {
        // RichContent::Text - plain string
        return item.length > 40 ? item.slice(0, 40) + "..." : item;
      }
      // RichContent::Parts - array of RichContentPart
      // See: objectiveai-rs/src/chat/completions/request/message.rs
      if (Array.isArray(item) && item.length > 0) {
        const part = item[0] as { type?: string; file?: { filename?: string } };
        if (part?.type === "file" && part?.file?.filename) {
          return part.file.filename;
        }
        if (part?.type === "image_url") return "[Image]";
        if (part?.type === "input_audio") return "[Audio]";
        if (part?.type === "video_url") return "[Video]";
        return "[Media content]";
      }
    }

    return `Option ${letters[index] || index + 1}`;
  };

  // Render results based on output type
  const renderResults = () => {
    if (!results?.output) return null;

    const output = results.output;

    // Scalar output (single number)
    if (typeof output === "number") {
      const pct = output * 100;
      const keywords = results.inputSnapshot?.keywords as string[] | undefined;
      const scoreColor = getScoreColor(pct);

      return (
        <div>
          <p style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            marginBottom: "6px",
          }}>
            Overall Score
          </p>
          <p style={{
            fontSize: isMobile ? "42px" : "56px",
            fontWeight: 700,
            color: scoreColor,
            lineHeight: 1,
            marginBottom: "12px",
          }}>
            {pct.toFixed(1)}%
          </p>
          {/* Score bar */}
          <div style={{
            height: "10px",
            background: "var(--border)",
            borderRadius: "5px",
            overflow: "hidden",
            marginBottom: "16px",
          }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: scoreColor,
              borderRadius: "5px",
              transition: "width 0.5s ease",
            }} />
          </div>
          {keywords && keywords.length > 0 && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Relevance to: <span style={{ color: "var(--text)" }}>{keywords.join(", ")}</span>
            </p>
          )}
        </div>
      );
    }

    // Vector output (array of numbers) - Rankings
    if (Array.isArray(output)) {
      const sorted = output
        .map((score, i) => ({ index: i, score, label: getContentLabel(i) }))
        .sort((a, b) => b.score - a.score);

      const keywords = results.inputSnapshot?.keywords as string[] | undefined;

      return (
        <div>
          {/* Show keywords context */}
          {keywords && keywords.length > 0 && (
            <p style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "16px",
            }}>
              Ranked by relevance to: <span style={{ color: "var(--text)" }}>{keywords.join(", ")}</span>
            </p>
          )}

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
                      color: "rgb(34, 197, 94)",
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
    }

    return null;
  };

  const spinnerStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  // Loading state
  if (isLoadingDetails) {
    return (
      <div className="page">
        <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 32px",
          textAlign: "center",
          paddingTop: "100px",
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
          <p style={{ color: "var(--text-muted)" }}>Loading function...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !functionDetails) {
    return (
      <div className="page">
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 32px",
          textAlign: "center",
          paddingTop: "100px",
        }}>
          <p style={{ color: "#ef4444", marginBottom: "8px" }}>Failed to load function</p>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>{loadError}</p>
          <Link href="/functions" style={{ color: "var(--accent)" }}>
            Back to Functions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />

      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: isMobile ? "0 16px" : "0 32px",
      }}>
        {/* Breadcrumb Row with Pin */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "20px",
          fontSize: "14px",
        }}>
          <nav style={{
            display: "flex",
            gap: "8px",
            color: "var(--text-muted)",
            flexWrap: "wrap",
          }}>
            <Link href="/functions" style={{ color: "var(--accent)", textDecoration: "none" }}>
              Functions
            </Link>
            <span>/</span>
            <span>{functionDetails.name}</span>
          </nav>
          <button
            onClick={toggleSave}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontSize: "inherit",
              color: showPinnedColor ? "var(--accent)" : "var(--text-muted)",
              opacity: 0.7,
              transition: showPinnedColor ? "color 0.15s ease-in" : "color 0.5s ease-out",
            }}
          >
            {isSaved ? "Pinned Function" : "Pin Function"}
          </button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: isMobile ? "20px" : "28px" }}>
          <h1 className="heading2" style={{ marginBottom: "4px" }}>
            {functionDetails.name}
          </h1>
          <p style={{
            fontSize: isMobile ? "15px" : "17px",
            color: "var(--text-muted)",
            maxWidth: "700px",
            lineHeight: 1.6,
            marginBottom: "8px",
          }}>
            {functionDetails.description}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span className="tag" style={{ display: "inline-block" }}>{functionDetails.category}</span>
            <span style={{
              fontSize: "12px",
              padding: "4px 12px",
              background: "var(--border)",
              borderRadius: "12px",
              color: "var(--text-muted)",
            }}>
              {functionDetails.owner}/{functionDetails.repository}
            </span>
          </div>
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
              {renderInputFields()}
            </div>

            {availableProfiles.length > 1 && (
              <div style={{ marginTop: isMobile ? "16px" : "24px" }}>
                <label style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--text)",
                }}>
                  Profile
                  <span style={{
                    fontWeight: 400,
                    color: "var(--text-muted)",
                    marginLeft: "8px",
                  }}>
                    Learned weights for this function
                  </span>
                </label>
                <select
                  className="select"
                  value={selectedProfileIndex}
                  onChange={(e) => setSelectedProfileIndex(parseInt(e.target.value, 10))}
                  style={{
                    width: "100%",
                    padding: isMobile ? "10px 12px" : "12px 16px",
                    fontSize: isMobile ? "14px" : "15px",
                    background: "var(--page-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  {availableProfiles.map((profile, idx) => (
                    <option key={`${profile.owner}/${profile.repository}@${profile.commit}`} value={idx}>
                      {profile.owner}/{profile.repository}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reasoning Options */}
            <div style={{
              marginTop: isMobile ? "16px" : "24px",
              padding: isMobile ? "12px" : "16px",
              background: "var(--page-bg)",
              borderRadius: isMobile ? "10px" : "12px",
              border: "1px solid var(--border)",
            }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={reasoningEnabled}
                  onChange={(e) => setReasoningEnabled(e.target.checked)}
                  style={{
                    width: "18px",
                    height: "18px",
                    accentColor: "var(--accent)",
                    cursor: "pointer",
                  }}
                />
                <span style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text)",
                }}>
                  Enable Reasoning
                </span>
              </label>

              {reasoningEnabled && (
                <div style={{ marginTop: "12px" }}>
                  <select
                    className="select"
                    value={reasoningModel}
                    onChange={(e) => setReasoningModel(e.target.value)}
                    style={{
                      width: "100%",
                      padding: isMobile ? "10px 12px" : "12px 16px",
                      fontSize: isMobile ? "14px" : "15px",
                    }}
                  >
                    {REASONING_MODEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "10px",
                lineHeight: 1.4,
              }}>
                {reasoningEnabled
                  ? "AI will explain the result. Cost: ~$0.0001-0.001 per execution."
                  : "Generate an AI explanation of the result."}
              </p>
            </div>

            <button
              className="pillBtn"
              onClick={handleRun}
              disabled={isRunning || availableProfiles.length === 0}
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
                <p style={{ marginBottom: "8px", fontSize: "24px" }}>—</p>
                <p style={{ fontSize: "14px" }}>Run the function to see results</p>
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
                <p style={{ color: "#ef4444", marginBottom: "8px" }}>
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

                {/* Model Breakdown - minimal style matching mockup */}
                {results.tasks && Array.isArray(results.tasks) && results.tasks.length > 0 && results.tasks[0]?.votes && results.tasks[0].votes.length > 0 && (
                  <div>
                    {(() => {
                      const votes = results.tasks![0].votes!;
                      const allSimulated = votes.every(v => v.from_rng);
                      const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];

                      // Get content labels from input
                      const contentItems = results.inputSnapshot?.contentItems as string[] | undefined;
                      const getOptionLabel = (idx: number) => {
                        if (contentItems && contentItems[idx]) {
                          const item = contentItems[idx];
                          if (typeof item === "string") {
                            return item.length > 18 ? item.slice(0, 18) + "…" : item;
                          }
                        }
                        return `Option ${letters[idx] || idx + 1}`;
                      };

                      return (
                        <>
                          <p style={{
                            fontSize: isMobile ? "12px" : "13px",
                            color: "var(--text-muted)",
                            marginBottom: isMobile ? "12px" : "16px",
                          }}>
                            Model Breakdown
                          </p>

                          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "16px" }}>
                            {(() => {
                              const displayedVotes = showAllModels ? votes : votes.slice(0, 5);
                              const completions = results.tasks?.[0]?.completions || [];

                              return displayedVotes.map((vote, modelIdx) => {
                                const maxVoteIdx = vote.vote.indexOf(Math.max(...vote.vote));
                                const confidence = Math.max(...vote.vote) * 100;
                                // Use readable model name if available, else shortened cryptic ID
                                const displayName = modelNames[vote.model] || vote.model.slice(0, 8);
                                const isResolved = !!modelNames[vote.model];
                                const isExpanded = expandedVotes.has(modelIdx);
                                // Find matching completion by model ID
                                const completion = completions.find(c => c.model === vote.model);
                                // Handle both streaming (delta) and non-streaming (message) structures
                                const choice = completion?.choices?.[0];
                                const reasoningText = choice?.message?.content || choice?.delta?.content;

                                return (
                                  <div key={modelIdx}>
                                    <div
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: isMobile ? "flex-start" : "baseline",
                                        flexDirection: isMobile ? "column" : "row",
                                        gap: isMobile ? "4px" : "0",
                                        marginBottom: "8px",
                                        cursor: reasoningText ? "pointer" : "default",
                                      }}
                                      onClick={() => {
                                        if (!reasoningText) return;
                                        setExpandedVotes(prev => {
                                          const next = new Set(prev);
                                          if (next.has(modelIdx)) {
                                            next.delete(modelIdx);
                                          } else {
                                            next.add(modelIdx);
                                          }
                                          return next;
                                        });
                                      }}
                                    >
                                      <span style={{ fontSize: isMobile ? "12px" : "13px", color: "var(--text)" }}>
                                        {reasoningText && (
                                          <span style={{
                                            display: "inline-block",
                                            width: "16px",
                                            color: "var(--text-muted)",
                                            fontSize: "10px",
                                          }}>
                                            {isExpanded ? "▼" : "▶"}
                                          </span>
                                        )}
                                        <span style={{
                                          fontFamily: isResolved ? "inherit" : "monospace",
                                          fontSize: isResolved ? (isMobile ? "12px" : "13px") : (isMobile ? "11px" : "12px"),
                                          color: isResolved ? "var(--text)" : "var(--text-muted)",
                                        }}>
                                          {displayName}
                                        </span>
                                        <span style={{ margin: "0 6px", color: "var(--text-muted)" }}>→</span>
                                        {isMobile ? getOptionLabel(maxVoteIdx).slice(0, 15) + (getOptionLabel(maxVoteIdx).length > 15 ? "…" : "") : getOptionLabel(maxVoteIdx)}
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
                                    {/* Progress bar - muted fill, no color */}
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
                                    {/* Expanded reasoning */}
                                    {isExpanded && reasoningText && (
                                      <div style={{
                                        marginTop: "8px",
                                        padding: "12px",
                                        background: "var(--page-bg)",
                                        borderRadius: "8px",
                                        fontSize: "12px",
                                        color: "var(--text-muted)",
                                        lineHeight: 1.5,
                                        whiteSpace: "pre-wrap",
                                      }}>
                                        {reasoningText}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
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
                              Demo mode — results simulated
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Reasoning Summary */}
                {results.reasoning?.choices?.[0]?.message?.content && (
                  <div style={{
                    padding: isMobile ? "12px" : "16px",
                    background: "var(--page-bg)",
                    borderRadius: isMobile ? "10px" : "12px",
                    border: "1px solid var(--border)",
                  }}>
                    <p style={{
                      fontSize: isMobile ? "12px" : "13px",
                      color: "var(--text-muted)",
                      marginBottom: isMobile ? "8px" : "12px",
                    }}>
                      Reasoning Summary
                    </p>
                    <p style={{
                      fontSize: isMobile ? "13px" : "14px",
                      color: "var(--text)",
                      lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                    }}>
                      {results.reasoning.choices[0].message.content}
                    </p>
                  </div>
                )}

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
      </div>
    </div>
  );
}
