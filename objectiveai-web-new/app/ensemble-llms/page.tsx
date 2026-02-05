"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useResponsive } from "../../hooks/useResponsive";
import { NAV_HEIGHT_CALCULATION_DELAY_MS } from "../../lib/constants";

interface EnsembleLlmItem {
  id: string;
}

const STICKY_BAR_HEIGHT = 72;
const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function EnsembleLlmsPage() {
  const [llms, setLlms] = useState<EnsembleLlmItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isMobile, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [navOffset, setNavOffset] = useState(96);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLlms() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/ensemble-llms");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch ensemble LLMs");
        setLlms(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ensemble LLMs");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLlms();
  }, []);

  useEffect(() => {
    const updateOffset = () => {
      const navHeightStr = getComputedStyle(document.documentElement).getPropertyValue('--nav-height-actual');
      const navHeight = navHeightStr ? parseInt(navHeightStr) : (isMobile ? 84 : 96);
      setNavOffset(navHeight);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    const timer = setTimeout(updateOffset, NAV_HEIGHT_CALCULATION_DELAY_MS);
    return () => {
      window.removeEventListener('resize', updateOffset);
      clearTimeout(timer);
    };
  }, [isMobile]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchQuery, sortBy]);

  const filteredLlms = llms
    .filter((l) => l.id.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "id") return a.id.localeCompare(b.id);
      return 0;
    });

  const visibleLlms = filteredLlms.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLlms.length;

  const safeGap = 24;
  const searchBarTop = navOffset;
  const sidebarTop = navOffset + STICKY_BAR_HEIGHT + safeGap;

  return (
    <div className="page">
      <div className="containerWide">
        {/* Header */}
        <div style={{
          marginBottom: isMobile ? "24px" : "32px",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "flex-end",
          gap: isMobile ? "16px" : "24px",
        }}>
          <div>
            <h1 className="heading2" style={{ marginBottom: "8px" }}>Ensemble LLMs</h1>
            <p style={{ color: "var(--text-muted)", fontSize: isMobile ? "15px" : "17px" }}>
              Individual LLM configurations with models, prompts, and parameters
            </p>
          </div>
          <Link
            href="/ensemble-llms/create"
            className="pillBtn"
            style={{
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New
          </Link>
        </div>

        {/* Sticky Search Bar Row with Filter Button */}
        <div
          ref={searchRef}
          style={{
            position: 'sticky',
            top: `${searchBarTop}px`,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: safeGap,
            background: 'var(--page-bg)',
            padding: '8px 0',
          }}
        >
          <button
            className="iconBtn"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-label={filtersOpen ? "Close filters" : "Open filters"}
            style={{ flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
          </button>

          <div className="searchBarPill" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search ensemble LLMs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Layout */}
        <div style={{
          display: isMobile ? 'block' : (filtersOpen ? 'grid' : 'block'),
          gridTemplateColumns: filtersOpen ? (isTablet ? '220px 1fr' : '280px 1fr') : undefined,
          gap: isTablet ? '24px' : '32px',
          alignItems: 'start',
          width: '100%',
        }}>
          {/* Left Sidebar - Filters */}
          {!isMobile && filtersOpen && (
            <aside
              className="stickySidebar"
              style={{
                position: 'sticky',
                top: `${sidebarTop}px`,
                padding: '20px',
              }}
            >
              <h3 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
              }}>
                Sort By
              </h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="select"
              >
                <option value="id">ID</option>
              </select>
            </aside>
          )}

          {/* Ensemble LLM Cards List */}
          <div style={{
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}>
            {!isLoading && !error && visibleLlms.length > 0 && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {visibleLlms.map((llm) => (
                    <Link
                      key={llm.id}
                      href={`/ensemble-llms/${llm.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        className="card"
                        style={{
                          padding: isMobile ? "14px 16px" : "16px 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "12px",
                          cursor: "pointer",
                          transition: "border-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                      >
                        <span style={{
                          fontWeight: 600,
                          fontSize: "15px",
                          color: "var(--text)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "monospace",
                        }}>
                          {llm.id}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-muted)"
                          strokeWidth="2"
                          style={{ flexShrink: 0 }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>

                {hasMore && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + LOAD_MORE_COUNT)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '16px',
                      marginTop: '24px',
                      background: 'none',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Load more ({filteredLlms.length - visibleCount} remaining)
                  </button>
                )}
              </>
            )}

            {isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p>Loading ensemble LLMs...</p>
              </div>
            )}

            {error && !isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <p style={{ color: 'var(--color-error)', marginBottom: '8px' }}>Failed to load ensemble LLMs</p>
                <p style={{ fontSize: '14px' }}>{error}</p>
              </div>
            )}

            {!isLoading && !error && filteredLlms.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--text-muted)',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {searchQuery ? "No ensemble LLMs match your search" : "No ensemble LLMs found"}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        {filtersOpen && isMobile && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(27, 27, 27, 0.7)',
                zIndex: 200,
              }}
              onClick={() => setFiltersOpen(false)}
            />
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--card-bg)',
              zIndex: 201,
              padding: '24px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              boxShadow: '0 -4px 20px var(--shadow)',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Filters</h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                >
                  ✕
                </button>
              </div>

              <h4 style={{
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
              }}>
                Sort By
              </h4>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setFiltersOpen(false);
                }}
                className="select"
              >
                <option value="id">ID</option>
              </select>
            </div>
          </>
        )}

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
            What are Ensemble LLMs?
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            An Ensemble LLM is a fully-specified configuration of a single upstream LLM, including
            model identity (e.g., openai/gpt-4o), prompt structure, decoding parameters, and output
            mode. IDs are computed deterministically from the definition using XXHash3-128.
          </p>
        </div>
      </div>
    </div>
  );
}
