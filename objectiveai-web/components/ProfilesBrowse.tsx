"use client";

import { useState, useEffect, useRef } from "react";
import { useResponsive } from "../hooks/useResponsive";
import { NAV_HEIGHT_CALCULATION_DELAY_MS, STICKY_BAR_HEIGHT, STICKY_SEARCH_OVERLAP } from "../lib/constants";
import { EmptyState } from "./ui";

interface ProfileItem {
  owner: string;
  repository: string;
  commit: string;
}

interface ProfilesBrowseProps {
  initialProfiles: ProfileItem[];
}

const INITIAL_VISIBLE_COUNT = 12;
const LOAD_MORE_COUNT = 12;

export default function ProfilesBrowse({ initialProfiles }: ProfilesBrowseProps) {
  const [profiles] = useState<ProfileItem[]>(initialProfiles);
  const { isMobile, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [selectedOwner, setSelectedOwner] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [navOffset, setNavOffset] = useState(96);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dynamic sticky offset calculation based on nav height
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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [searchQuery, selectedOwner, sortBy]);

  // Get unique owners for filtering
  const owners = ["All", ...Array.from(new Set(profiles.map(p => p.owner))).sort()];

  const filteredProfiles = profiles
    .filter((p) => {
      const matchesSearch = `${p.owner}/${p.repository}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesOwner = selectedOwner === "All" || p.owner === selectedOwner;
      return matchesSearch && matchesOwner;
    })
    .sort((a, b) => {
      if (sortBy === "name") return `${a.owner}/${a.repository}`.localeCompare(`${b.owner}/${b.repository}`);
      if (sortBy === "owner") return a.owner.localeCompare(b.owner) || a.repository.localeCompare(b.repository);
      return 0;
    });

  // Visible profiles (paginated)
  const visibleProfiles = filteredProfiles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProfiles.length;

  const safeGap = 24;
  const searchBarTop = navOffset - STICKY_SEARCH_OVERLAP;
  const sidebarTop = searchBarTop + STICKY_BAR_HEIGHT + safeGap;

  return (
    <div className="page">
      <div className="containerWide">
        {/* Header */}
        <div className="pageHeader">
          <div>
            <h1 className="heading2" style={{ marginBottom: "8px" }}>Profiles</h1>
            <p style={{ color: "var(--text-muted)", fontSize: isMobile ? "15px" : "17px" }}>
              Learned weights for functions, trained to optimize ensemble voting
            </p>
          </div>
        </div>

        {/* Sticky Search Bar Row with Filter Button */}
        <div
          ref={searchRef}
          className="stickySearchBar"
          style={{
            top: `${searchBarTop}px`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: safeGap,
          }}
        >
          {/* Filter/Sort Button - Left of Search Bar */}
          <button
            className="iconBtn"
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-label={filtersOpen ? "Close filters" : "Open filters"}
            aria-expanded={filtersOpen}
            style={{ flexShrink: 0 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
          </button>

          {/* Search Bar - Full Pill Shape */}
          <div className="searchBarPill" style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="searchIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Layout - responsive, full width when filters collapsed */}
        <div style={{
          display: isMobile ? 'block' : (filtersOpen ? 'grid' : 'block'),
          gridTemplateColumns: filtersOpen ? (isTablet ? '220px 1fr' : '280px 1fr') : undefined,
          gap: isTablet ? '24px' : '32px',
          alignItems: 'start',
          width: '100%',
        }}>
          {/* Left Sidebar - Filters - Collapsible */}
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
                Owner
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                {owners.map(owner => (
                  <button
                    key={owner}
                    onClick={() => setSelectedOwner(owner)}
                    className={`filterChip ${selectedOwner === owner ? 'active' : ''}`}
                    style={{ textAlign: 'left', padding: '8px 14px' }}
                  >
                    {owner}
                  </button>
                ))}
              </div>

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
                <option value="name">Name</option>
                <option value="owner">Owner</option>
              </select>
            </aside>
          )}

          {/* Profile Cards List */}
          <div style={{
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}>
            {visibleProfiles.length > 0 && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {visibleProfiles.map((profile) => (
                    <a
                      key={`${profile.owner}/${profile.repository}/${profile.commit}`}
                      href={`https://github.com/${profile.owner}/${profile.repository}/tree/${profile.commit}`}
                      target="_blank"
                      rel="noopener noreferrer"
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
                        <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: "15px",
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {profile.owner}/{profile.repository}
                          </span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            {profile.commit.substring(0, 7)}
                          </span>
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--text-muted)"
                          strokeWidth="2"
                          style={{ flexShrink: 0 }}
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Load More */}
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
                    Load more ({filteredProfiles.length - visibleCount} remaining)
                  </button>
                )}
              </>
            )}

            {filteredProfiles.length === 0 && (
              <EmptyState
                message={searchQuery || selectedOwner !== "All"
                  ? "No profiles match your criteria"
                  : "No profiles found"}
              />
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
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              style={{
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
                  aria-label="Close filters"
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
                Owner
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {owners.map(owner => (
                  <button
                    key={owner}
                    onClick={() => {
                      setSelectedOwner(owner);
                      setFiltersOpen(false);
                    }}
                    className={`filterChip ${selectedOwner === owner ? 'active' : ''}`}
                  >
                    {owner}
                  </button>
                ))}
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
                <option value="name">Name</option>
                <option value="owner">Owner</option>
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
            What are Profiles?
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px" }}>
            Profiles contain learned weights for Functions. ObjectiveAI doesn&apos;t fine-tune LLMs—instead,
            it learns optimal weights over fixed models through training on example inputs and expected outputs.
          </p>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Profiles are hosted on GitHub as <code style={{ background: "var(--card-bg)", padding: "2px 6px", borderRadius: "4px" }}>profile.json</code> at
            the repository root. The same function can behave differently with different profiles.
          </p>
        </div>
      </div>
    </div>
  );
}
