"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { EnsembleLlm } from "objectiveai";
import { createPublicClient } from "../../../lib/client";
import { useIsMobile } from "../../../hooks/useIsMobile";

interface EnsembleLlmDetails {
  id: string;
  model: string;
  created: number;
  temperature?: number;
  top_p?: number;
  output_mode?: string;
  reasoning?: {
    effort?: string;
  };
  provider?: {
    order?: string[];
  };
}

export default function EnsembleLlmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [llm, setLlm] = useState<EnsembleLlmDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchLlm() {
      try {
        setIsLoading(true);
        const client = createPublicClient();
        const data = await EnsembleLlm.retrieve(client, id);
        setLlm(data as unknown as EnsembleLlmDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ensemble LLM");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLlm();
  }, [id]);

  if (isLoading) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: "center", padding: "80px 0" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "var(--text-muted)" }}>Loading ensemble LLM...</p>
        </div>
      </div>
    );
  }

  if (error || !llm) {
    return (
      <div className="page">
        <div className="container" >
          <Link href="/ensemble-llms" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
            ← Back to Ensemble LLMs
          </Link>
          <div className="card" style={{ padding: "40px", textAlign: "center", marginTop: "24px" }}>
            <p style={{ color: "var(--color-error)" }}>{error || "Ensemble LLM not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" >
        {/* Back link */}
        <Link
          href="/ensemble-llms"
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
          Back to Ensemble LLMs
        </Link>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <span className="tag" style={{ marginBottom: "12px", display: "inline-block" }}>
            Ensemble LLM
          </span>
          <h1
            style={{
              fontSize: isMobile ? "20px" : "24px",
              fontWeight: 700,
              marginBottom: "8px",
              fontFamily: "monospace",
              wordBreak: "break-all",
            }}
          >
            {llm.id}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Created {new Date(llm.created * 1000).toLocaleDateString()}
          </p>
        </div>

        {/* Model info */}
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Model Configuration</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Model</span>
              <span style={{ fontWeight: 600, fontSize: "15px" }}>{llm.model}</span>
            </div>
            {llm.temperature !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Temperature</span>
                <span style={{ fontWeight: 500, fontSize: "14px", fontFamily: "monospace" }}>{llm.temperature}</span>
              </div>
            )}
            {llm.top_p !== undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Top P</span>
                <span style={{ fontWeight: 500, fontSize: "14px", fontFamily: "monospace" }}>{llm.top_p}</span>
              </div>
            )}
            {llm.output_mode && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Output Mode</span>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: "13px",
                    padding: "4px 10px",
                    background: "rgba(107, 92, 255, 0.1)",
                    borderRadius: "6px",
                    color: "var(--accent)",
                  }}
                >
                  {llm.output_mode}
                </span>
              </div>
            )}
            {llm.reasoning?.effort && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Reasoning Effort</span>
                <span style={{ fontWeight: 500, fontSize: "14px" }}>{llm.reasoning.effort}</span>
              </div>
            )}
          </div>
        </div>

        {/* Provider preferences */}
        {llm.provider?.order && llm.provider.order.length > 0 && (
          <div className="card" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Provider Preferences</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {llm.provider.order.map((provider, idx) => (
                <span
                  key={provider}
                  style={{
                    padding: "6px 12px",
                    fontSize: "13px",
                    background: idx === 0 ? "rgba(107, 92, 255, 0.1)" : "var(--nav-surface)",
                    borderRadius: "6px",
                    color: idx === 0 ? "var(--accent)" : "var(--text)",
                    fontWeight: idx === 0 ? 600 : 400,
                  }}
                >
                  {idx + 1}. {provider}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
