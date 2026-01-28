"use client";

import { useEffect, useState } from "react";

export default function HeroText() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return <div style={{ height: '200px' }} />;
  }

  return (
    <svg
      viewBox="0 0 800 300"
      style={{
        width: '100%',
        maxWidth: '700px',
        height: 'auto',
      }}
      role="img"
      aria-label="Score Rank Simulate"
    >
      {/* SCORE RANK - base line */}
      <text
        x="0"
        y="105"
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
          fontSize: '120px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fill: 'var(--text)',
        }}
      >
        SCORE RANK
      </text>

      {/* SIMULATE - larger to match width, aligned edges */}
      <text
        x="0"
        y="265"
        style={{
          fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
          fontSize: '156px',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          fill: 'var(--text)',
        }}
      >
        SIMULATE
      </text>
    </svg>
  );
}
