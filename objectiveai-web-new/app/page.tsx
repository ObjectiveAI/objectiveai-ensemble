"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeroText from "@/components/HeroText";

// Featured functions data
const FEATURED_FUNCTIONS = [
  {
    slug: "trip-must-see",
    name: "Trip Must-See",
    description: "Ranks tourist attractions by local authenticity and visitor satisfaction",
    category: "Ranking",
    tags: ["travel", "scoring", "ranking"],
  },
  {
    slug: "email-classifier",
    name: "Email Classifier",
    description: "Categorizes emails by intent, urgency, and required action type",
    category: "Scoring",
    tags: ["text", "classification", "scoring"],
  },
  {
    slug: "code-quality",
    name: "Code Quality",
    description: "Evaluates pull requests across maintainability and security metrics",
    category: "Composite",
    tags: ["code", "evaluation", "scoring"],
  },
];

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 640);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '80px' : '120px',
      paddingBottom: '60px',
    }}>
      {/* Hero Section */}
      <section style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(45vh - 100px)',
        paddingTop: isMobile ? '32px' : '48px',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: isMobile ? '0 20px' : '0 32px', maxWidth: '800px' }}>
          <div style={{ marginBottom: '12px', width: '100%' }}>
            <HeroText />
          </div>
          <p style={{
            fontSize: isMobile ? '15px' : '17px',
            color: 'var(--text-muted)',
            marginBottom: '24px',
          }}>
            AI Scoring Primitives for Developers
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/vibe-native" className="pillBtn">
              Vibe-Native
            </Link>
            <Link href="/sdk-first" className="pillBtn">
              SDK-First
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Functions Section */}
      <section style={{ padding: isMobile ? '0 20px' : '0 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: isMobile ? '24px' : '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
                Explore
              </span>
              <h2 className="heading2">Featured Functions</h2>
            </div>
            <Link
              href="/functions"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--accent)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              View all <span>→</span>
            </Link>
          </div>

          {/* Function Cards Grid */}
          <div className="gridThree">
            {FEATURED_FUNCTIONS.map(fn => (
              <Link
                key={fn.slug}
                href={`/functions/${fn.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  padding: '16px',
                }}>
                  <span className="tag" style={{
                    alignSelf: 'flex-start',
                    marginBottom: '8px',
                    fontSize: '11px',
                    padding: '4px 10px'
                  }}>
                    {fn.category}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
                    {fn.name}
                  </h3>
                  <p style={{
                    fontSize: '13px',
                    lineHeight: 1.5,
                    color: 'var(--text-muted)',
                    flex: 1,
                    marginBottom: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {fn.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginBottom: '10px',
                  }}>
                    {fn.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        background: 'var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-muted)',
                      }}>
                        {tag}
                      </span>
                    ))}
                    {fn.tags.length > 2 && (
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        color: 'var(--text-muted)',
                      }}>
                        +{fn.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    Open <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
