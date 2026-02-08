"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Ensemble } from "objectiveai";
import { createPublicClient } from "../../../lib/client";
import { useIsMobile } from "../../../hooks/useIsMobile";

interface EnsembleDetails {
  id: string;
  created: number;
  ensemble_llms: string[];
}

interface EnsembleUsage {
  requests: number;
  completion_tokens: number;
  prompt_tokens: number;
  total_cost: number;
}

export default function EnsembleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ensemble, setEnsemble] = useState<EnsembleDetails | null>(null);
  const [usage, setUsage] = useState<EnsembleUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    async function fetchEnsemble() {
      try {
        setIsLoading(true);
        const client = createPublicClient();
        const [details, usageData] = await Promise.all([
          Ensemble.retrieve(client, id),
          Ensemble.retrieveUsage(client, id).catch(() => null),
        ]);

        setEnsemble(details as unknown as EnsembleDetails);
        if (usageData) {
          setUsage(usageData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ensemble");
      } finally {
        setIsLoading(false);
      }
    }
    fetchEnsemble();
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
          <p style={{ color: "var(--text-muted)" }}>Loading ensemble...</p>
        </div>
      </div>
    );
  }

  if (error || !ensemble) {
    return (
      <div className="page">
        <div className="container" >
          <Link href="/ensembles" style={{ color: "var(--accent)", textDecoration: "none", fontSize: "14px" }}>
            ← Back to Ensembles
          </Link>
          <div className="card" style={{ padding: "40px", textAlign: "center", marginTop: "24px" }}>
            <p style={{ color: "var(--color-error)" }}>{error || "Ensemble not found"}</p>
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
        <div style={{ marginBottom: "32px" }}>
          <span className="tag" style={{ marginBottom: "12px", display: "inline-block" }}>
            Ensemble
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
            {ensemble.id}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Created {new Date(ensemble.created * 1000).toLocaleDateString()}
          </p>
        </div>

        {/* Usage stats */}
        {usage && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Usage Statistics</h2>
            <div className="gridTwo" style={{ gap: "16px" }}>
              <div className="card" style={{ padding: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Requests
                </p>
                <div style={{ fontSize: "28px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {usage.requests.toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Total Cost
                </p>
                <div style={{ fontSize: "28px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  ${usage.total_cost.toFixed(4)}
                </div>
              </div>
              <div className="card" style={{ padding: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Prompt Tokens
                </p>
                <div style={{ fontSize: "28px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {usage.prompt_tokens.toLocaleString()}
                </div>
              </div>
              <div className="card" style={{ padding: "20px" }}>
                <p style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Completion Tokens
                </p>
                <div style={{ fontSize: "28px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                  {usage.completion_tokens.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ensemble LLMs */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>
            Ensemble LLMs ({ensemble.ensemble_llms?.length || 0})
          </h2>
          {ensemble.ensemble_llms && ensemble.ensemble_llms.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {ensemble.ensemble_llms.map((llmId, idx) => (
                <Link key={llmId} href={`/ensemble-llms/${llmId}`} style={{ textDecoration: "none" }}>
                  <div
                    className="card"
                    style={{
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      transition: "border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          background: "rgba(107, 92, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--accent)",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ fontFamily: "monospace", fontSize: "14px" }}>{llmId}</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: "40px", textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)" }}>No ensemble LLMs in this ensemble</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
