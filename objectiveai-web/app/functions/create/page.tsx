"use client";

import { useState } from "react";
import Link from "next/link";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { COPY_FEEDBACK_DURATION_MS } from "../../../lib/constants";

type ExpressionType = "jmespath" | "starlark" | "static";

interface Expression {
  type: ExpressionType;
  value: string;
}

interface VectorTask {
  type: "vector";
  prompt: string;
  responses: string[];
  ensemble?: string;
  skip?: Expression;
  map?: number;
  input?: Expression;
}

interface FunctionTask {
  type: "function";
  owner: string;
  repository: string;
  commit?: string;
  skip?: Expression;
  map?: number;
  input?: Expression;
}

type Task = VectorTask | FunctionTask;

interface FunctionDefinition {
  type: "scalar" | "vector";
  output_length?: number;
  input_maps: Expression[];
  tasks: Task[];
  output: Expression;
}

const DEFAULT_FUNCTION: FunctionDefinition = {
  type: "scalar",
  input_maps: [],
  tasks: [],
  output: { type: "jmespath", value: "tasks[0].output" },
};

// Expression editor component (moved outside to avoid recreating on each render)
function ExpressionEditor({
  label,
  expression,
  onChange,
  placeholder,
}: {
  label: string;
  expression: Expression;
  onChange: (expr: Expression) => void;
  placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)" }}>
          {label}
        </label>
        <select
          value={expression.type}
          onChange={(e) => onChange({ ...expression, type: e.target.value as ExpressionType })}
          style={{
            padding: "4px 8px",
            fontSize: "12px",
            borderRadius: "4px",
            border: "1px solid var(--border)",
            background: "var(--card-bg)",
            color: "var(--text)",
          }}
        >
          <option value="jmespath">JMESPath</option>
          <option value="starlark">Starlark</option>
          <option value="static">Static</option>
        </select>
      </div>
      <div className="aiTextField">
        <input
          type="text"
          value={expression.value}
          onChange={(e) => onChange({ ...expression, value: e.target.value })}
          placeholder={placeholder || `Enter ${expression.type} expression...`}
          style={{ fontFamily: "monospace" }}
        />
      </div>
    </div>
  );
}

// Vector task editor component (moved outside to avoid recreating on each render)
function VectorTaskEditor({ task, onChange }: { task: VectorTask; onChange: (t: VectorTask) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Prompt */}
      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
          Prompt
        </label>
        <div className="aiTextField">
          <textarea
            value={task.prompt}
            onChange={(e) => onChange({ ...task, prompt: e.target.value })}
            placeholder="Enter prompt..."
            rows={3}
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Responses */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-muted)" }}>
            Responses ({task.responses.length})
          </label>
          <button
            onClick={() => onChange({ ...task, responses: [...task.responses, ""] })}
            style={{
              padding: "4px 8px",
              fontSize: "12px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            + Add
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {task.responses.map((resp, idx) => (
            <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div className="aiTextField" style={{ flex: 1 }}>
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => {
                    const updated = [...task.responses];
                    updated[idx] = e.target.value;
                    onChange({ ...task, responses: updated });
                  }}
                  placeholder={`Response ${idx + 1}`}
                />
              </div>
              {task.responses.length > 2 && (
                <button
                  onClick={() => {
                    onChange({ ...task, responses: task.responses.filter((_, i) => i !== idx) });
                  }}
                  style={{
                    padding: "6px 10px",
                    fontSize: "12px",
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: "var(--color-error)",
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ensemble ID (optional) */}
      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
          Ensemble ID <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
        </label>
        <div className="aiTextField">
          <input
            type="text"
            value={task.ensemble || ""}
            onChange={(e) => onChange({ ...task, ensemble: e.target.value || undefined })}
            placeholder="Ensemble ID or leave blank for default"
            style={{ fontFamily: "monospace" }}
          />
        </div>
      </div>

      {/* Optional expressions */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          Advanced: Skip, Map, and Input expressions
        </p>

        {/* Skip */}
        <ExpressionEditor
          label="Skip Expression"
          expression={task.skip || { type: "jmespath", value: "" }}
          onChange={(expr) => onChange({ ...task, skip: expr.value ? expr : undefined })}
          placeholder="e.g., input.count < `10`"
        />

        {/* Map */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
            Map Index <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
          </label>
          <div className="aiTextField" style={{ maxWidth: "120px" }}>
            <input
              type="number"
              value={task.map ?? ""}
              onChange={(e) => onChange({ ...task, map: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="0"
              min="0"
            />
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
            Index into input_maps for mapped execution
          </p>
        </div>

        {/* Input */}
        <ExpressionEditor
          label="Input Expression"
          expression={task.input || { type: "jmespath", value: "" }}
          onChange={(expr) => onChange({ ...task, input: expr.value ? expr : undefined })}
          placeholder="e.g., { text: map.content }"
        />
      </div>
    </div>
  );
}

// Function task editor component (moved outside to avoid recreating on each render)
function FunctionTaskEditor({ task, onChange }: { task: FunctionTask; onChange: (t: FunctionTask) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Function Reference */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
            Owner
          </label>
          <div className="aiTextField">
            <input
              type="text"
              value={task.owner}
              onChange={(e) => onChange({ ...task, owner: e.target.value })}
              placeholder="objective-ai"
            />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
            Repository
          </label>
          <div className="aiTextField">
            <input
              type="text"
              value={task.repository}
              onChange={(e) => onChange({ ...task, repository: e.target.value })}
              placeholder="is-spam"
            />
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
          Commit SHA <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional, recommended)</span>
        </label>
        <div className="aiTextField">
          <input
            type="text"
            value={task.commit || ""}
            onChange={(e) => onChange({ ...task, commit: e.target.value || undefined })}
            placeholder="abc123... (for immutability)"
            style={{ fontFamily: "monospace" }}
          />
        </div>
      </div>

      {/* Optional expressions */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
          Advanced: Skip, Map, and Input expressions
        </p>

        <ExpressionEditor
          label="Skip Expression"
          expression={task.skip || { type: "jmespath", value: "" }}
          onChange={(expr) => onChange({ ...task, skip: expr.value ? expr : undefined })}
          placeholder="e.g., input.count < `10`"
        />

        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
            Map Index <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
          </label>
          <div className="aiTextField" style={{ maxWidth: "120px" }}>
            <input
              type="number"
              value={task.map ?? ""}
              onChange={(e) => onChange({ ...task, map: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <ExpressionEditor
          label="Input Expression"
          expression={task.input || { type: "jmespath", value: "" }}
          onChange={(expr) => onChange({ ...task, input: expr.value ? expr : undefined })}
          placeholder="e.g., { text: map.content }"
        />
      </div>
    </div>
  );
}

export default function FunctionCreatePage() {
  const isMobile = useIsMobile();
  const [func, setFunc] = useState<FunctionDefinition>(DEFAULT_FUNCTION);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number | null>(null);

  // Build the function JSON for the API
  const buildFunctionJson = () => {
    const result: Record<string, unknown> = {
      type: func.type,
    };

    if (func.type === "vector" && func.output_length) {
      result.output_length = func.output_length;
    }

    if (func.input_maps.length > 0) {
      result.input_maps = func.input_maps.map(formatExpression);
    }

    if (func.tasks.length > 0) {
      result.tasks = func.tasks.map((task) => {
        if (task.type === "vector") {
          const t: Record<string, unknown> = {
            prompt: task.prompt,
            responses: task.responses,
          };
          if (task.ensemble) t.ensemble = task.ensemble;
          if (task.skip) t.skip = formatExpression(task.skip);
          if (task.map !== undefined) t.map = task.map;
          if (task.input) t.input = formatExpression(task.input);
          return t;
        } else {
          const t: Record<string, unknown> = {
            function: {
              owner: task.owner,
              repository: task.repository,
            },
          };
          if (task.commit) (t.function as Record<string, unknown>).commit = task.commit;
          if (task.skip) t.skip = formatExpression(task.skip);
          if (task.map !== undefined) t.map = task.map;
          if (task.input) t.input = formatExpression(task.input);
          return t;
        }
      });
    }

    result.output = formatExpression(func.output);

    return result;
  };

  const formatExpression = (expr: Expression): unknown => {
    if (expr.type === "static") {
      try {
        return JSON.parse(expr.value);
      } catch {
        return expr.value;
      }
    }
    return { [`$${expr.type}`]: expr.value };
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(buildFunctionJson(), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  const addInputMap = () => {
    setFunc({
      ...func,
      input_maps: [...func.input_maps, { type: "jmespath", value: "" }],
    });
  };

  const updateInputMap = (index: number, expr: Expression) => {
    const updated = [...func.input_maps];
    updated[index] = expr;
    setFunc({ ...func, input_maps: updated });
  };

  const removeInputMap = (index: number) => {
    setFunc({
      ...func,
      input_maps: func.input_maps.filter((_, i) => i !== index),
    });
  };

  const addVectorTask = () => {
    const newTask: VectorTask = {
      type: "vector",
      prompt: "",
      responses: ["", ""],
    };
    setFunc({ ...func, tasks: [...func.tasks, newTask] });
    setActiveTaskIndex(func.tasks.length);
  };

  const addFunctionTask = () => {
    const newTask: FunctionTask = {
      type: "function",
      owner: "",
      repository: "",
    };
    setFunc({ ...func, tasks: [...func.tasks, newTask] });
    setActiveTaskIndex(func.tasks.length);
  };

  const updateTask = (index: number, task: Task) => {
    const updated = [...func.tasks];
    updated[index] = task;
    setFunc({ ...func, tasks: updated });
  };

  const removeTask = (index: number) => {
    setFunc({
      ...func,
      tasks: func.tasks.filter((_, i) => i !== index),
    });
    setActiveTaskIndex(null);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Back link */}
        <Link
          href="/functions"
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
          Back to Functions
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <span className="tag" style={{ marginBottom: "12px", display: "inline-block" }}>
            Create
          </span>
          <h1 style={{ fontSize: isMobile ? "24px" : "32px", fontWeight: 700, marginBottom: "8px" }}>
            Function Definition Editor
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", maxWidth: "600px" }}>
            Build composable scoring pipelines. Functions execute tasks (Vector Completions or nested Functions) and
            combine results using expressions.
          </p>
        </div>

        {/* Info Banner */}
        <div
          className="card"
          style={{
            padding: "16px 20px",
            marginBottom: "24px",
            background: "rgba(107, 92, 255, 0.05)",
            borderColor: "rgba(107, 92, 255, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ flexShrink: 0, marginTop: "2px" }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                Functions are GitHub-hosted
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Save the generated JSON as <code style={{ background: "var(--border)", padding: "2px 4px", borderRadius: "3px" }}>function.json</code> at your repository root.
                Reference it as <code style={{ background: "var(--border)", padding: "2px 4px", borderRadius: "3px" }}>owner/repo</code> in API calls.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 400px", gap: "24px" }}>
          {/* Left: Editor */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Function Type */}
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Function Type</h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setFunc({ ...func, type: "scalar", output_length: undefined })}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: func.type === "scalar" ? "rgba(107, 92, 255, 0.1)" : "var(--card-bg)",
                    border: `1px solid ${func.type === "scalar" ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "4px", color: func.type === "scalar" ? "var(--accent)" : "var(--text)" }}>
                    Scalar
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Single score [0, 1]
                  </div>
                </button>
                <button
                  onClick={() => setFunc({ ...func, type: "vector" })}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: func.type === "vector" ? "rgba(107, 92, 255, 0.1)" : "var(--card-bg)",
                    border: `1px solid ${func.type === "vector" ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "4px", color: func.type === "vector" ? "var(--accent)" : "var(--text)" }}>
                    Vector
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Array of scores (sum = 1)
                  </div>
                </button>
              </div>

              {func.type === "vector" && (
                <div style={{ marginTop: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "8px" }}>
                    Output Length <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
                  </label>
                  <div className="aiTextField" style={{ maxWidth: "120px" }}>
                    <input
                      type="number"
                      value={func.output_length || ""}
                      onChange={(e) => setFunc({ ...func, output_length: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="Auto"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Input Maps */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Input Maps</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Transform input into 2D arrays for mapped task execution
                  </p>
                </div>
                <button
                  onClick={addInputMap}
                  style={{
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 500,
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  + Add Map
                </button>
              </div>

              {func.input_maps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No input maps defined. Add one to enable mapped task execution.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {func.input_maps.map((expr, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        background: "rgba(107, 92, 255, 0.1)",
                        color: "var(--accent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: "8px",
                      }}>
                        {idx}
                      </span>
                      <div style={{ flex: 1 }}>
                        <ExpressionEditor
                          label=""
                          expression={expr}
                          onChange={(e) => updateInputMap(idx, e)}
                          placeholder="e.g., input.items"
                        />
                      </div>
                      <button
                        onClick={() => removeInputMap(idx)}
                        style={{
                          padding: "8px",
                          background: "none",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          cursor: "pointer",
                          color: "var(--color-error)",
                          marginTop: "8px",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: 600 }}>Tasks</h2>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Add Vector Completions or nested Function calls
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={addVectorTask}
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      background: "var(--accent)",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    + Vector
                  </button>
                  <button
                    onClick={addFunctionTask}
                    style={{
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: 500,
                      background: "none",
                      color: "var(--accent)",
                      border: "1px solid var(--accent)",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    + Function
                  </button>
                </div>
              </div>

              {func.tasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No tasks defined. Add a Vector Completion or Function task.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {func.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="card"
                      style={{
                        padding: "16px",
                        cursor: "pointer",
                        borderColor: activeTaskIndex === idx ? "var(--accent)" : "var(--border)",
                        background: activeTaskIndex === idx ? "rgba(107, 92, 255, 0.02)" : "var(--card-bg)",
                      }}
                      onClick={() => setActiveTaskIndex(activeTaskIndex === idx ? null : idx)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            background: task.type === "vector" ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 92, 255, 0.1)",
                            color: task.type === "vector" ? "var(--color-success)" : "var(--accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}>
                            {idx}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "14px" }}>
                              {task.type === "vector" ? "Vector Completion" : `${task.owner}/${task.repository}`}
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              {task.type === "vector"
                                ? `${task.responses.length} responses`
                                : "Function call"}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{
                              transform: activeTaskIndex === idx ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                            }}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTask(idx);
                            }}
                            style={{
                              padding: "4px",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--color-error)",
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {activeTaskIndex === idx && (
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
                          {task.type === "vector" ? (
                            <VectorTaskEditor task={task} onChange={(t) => updateTask(idx, t)} />
                          ) : (
                            <FunctionTaskEditor task={task} onChange={(t) => updateTask(idx, t)} />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Output Expression */}
            <div className="card" style={{ padding: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Output Expression</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
                Compute final result from input and task outputs. Available: <code>input</code>, <code>tasks</code>
              </p>
              <ExpressionEditor
                label=""
                expression={func.output}
                onChange={(e) => setFunc({ ...func, output: e })}
                placeholder="e.g., tasks[0].output"
              />
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
                {func.type === "scalar" ? "Output must be a number in [0, 1]" : "Output must be an array that sums to ~1"}
              </div>
            </div>
          </div>

          {/* Right: JSON Preview */}
          <div style={{ position: isMobile ? "static" : "sticky", top: "120px", height: "fit-content" }}>
            <div className="card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: 600 }}>JSON Preview</h2>
                <button
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  style={{
                    padding: "4px 8px",
                    fontSize: "12px",
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                >
                  {showJsonPreview ? "Hide" : "Show"}
                </button>
              </div>

              {showJsonPreview && (
                <pre
                  style={{
                    background: "var(--nav-surface)",
                    padding: "16px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    overflow: "auto",
                    maxHeight: "400px",
                    marginBottom: "16px",
                  }}
                >
                  {JSON.stringify(buildFunctionJson(), null, 2)}
                </pre>
              )}

              <button
                onClick={copyToClipboard}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  background: copied ? "var(--color-success)" : "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "Copied!" : "Copy JSON"}
              </button>

              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", textAlign: "center" }}>
                Save as <code style={{ background: "var(--border)", padding: "2px 4px", borderRadius: "3px" }}>function.json</code> in your repo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
