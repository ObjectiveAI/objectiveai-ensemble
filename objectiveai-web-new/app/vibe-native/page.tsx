"use client";

import { useState, useEffect } from "react";

export default function VibeNativePage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth <= 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: isMobile ? '40px 20px' : '60px 32px',
      textAlign: 'center',
    }}>
      <span className="tag" style={{ marginBottom: '16px' }}>
        Coming Soon
      </span>
      <h1 style={{
        fontSize: isMobile ? '28px' : '32px',
        fontWeight: 700,
        marginBottom: '12px',
      }}>
        Vibe-Native
      </h1>
      <p style={{
        color: 'var(--text-muted)',
        fontSize: isMobile ? '14px' : '16px',
        maxWidth: '400px',
      }}>
        Use ObjectiveAI functions through natural language—no code required.
      </p>
    </div>
  );
}
