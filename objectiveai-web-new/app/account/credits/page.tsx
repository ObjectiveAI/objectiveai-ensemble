"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function CreditsPage() {
  const { user, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth <= 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Placeholder data - will be connected to API
  const creditsData = {
    balance: 0,
    lifetimePurchased: 0,
    lifetimeUsed: 0,
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center', paddingTop: '80px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
          }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page">
        <div className="container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 32px',
        }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
            style={{ marginBottom: '16px', opacity: 0.5 }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h1 style={{
            fontSize: isMobile ? '24px' : '28px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>
            Sign in to view credits
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            maxWidth: '400px',
            marginBottom: '24px',
          }}>
            You need to be signed in to manage your credits and billing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ padding: isMobile ? '0 20px' : '0 32px' }}>
        {/* Page Header */}
        <div style={{
          marginBottom: isMobile ? '32px' : '40px',
        }}>
          <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
            Account
          </span>
          <h1 style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>
            Credits
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: isMobile ? '14px' : '15px',
          }}>
            Manage your ObjectiveAI credits and billing
          </p>
        </div>

        {/* Balance Card */}
        <div className="card" style={{
          padding: isMobile ? '24px 20px' : '32px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '13px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: '8px',
          }}>
            Current Balance
          </p>
          <div style={{
            fontSize: isMobile ? '48px' : '56px',
            fontWeight: 700,
            color: 'var(--accent)',
            marginBottom: '4px',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {creditsData.balance.toLocaleString()}
          </div>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}>
            credits available
          </p>
        </div>

        {/* Purchase Button */}
        <div style={{ marginBottom: '40px' }}>
          <button
            className="pillBtn"
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'var(--accent)',
              color: 'var(--color-light)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Purchase Credits
          </button>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '12px',
            opacity: 0.7,
          }}>
            Payments processed securely via Stripe
          </p>
        </div>

        {/* Usage Stats */}
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '16px',
          }}>
            Usage History
          </h2>
          <div className="gridTwo" style={{ gap: '16px' }}>
            <div className="card" style={{ padding: isMobile ? '20px' : '24px' }}>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Lifetime Purchased
              </p>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {creditsData.lifetimePurchased.toLocaleString()}
              </div>
            </div>
            <div className="card" style={{ padding: isMobile ? '20px' : '24px' }}>
              <p style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '8px',
              }}>
                Lifetime Used
              </p>
              <div style={{
                fontSize: '28px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {creditsData.lifetimeUsed.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="card" style={{
          padding: isMobile ? '20px' : '24px',
          background: 'var(--nav-surface)',
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About Credits
          </h3>
          <ul style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            paddingLeft: '20px',
            margin: 0,
          }}>
            <li>Credits are used for API requests and function executions</li>
            <li>Credits do not expire</li>
            <li>Refunds available within 24 hours of purchase if balance is unused</li>
          </ul>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '16px',
          }}>
            Questions? Contact{' '}
            <a
              href="mailto:admin@objective-ai.io"
              style={{ color: 'var(--accent)', textDecoration: 'none' }}
            >
              admin@objective-ai.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
