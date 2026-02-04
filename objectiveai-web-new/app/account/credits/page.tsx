"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useObjectiveAI } from "../../../hooks/useObjectiveAI";
import { Auth } from "objectiveai";
import { ObjectiveAIFetchError } from "objectiveai";

interface CreditsData {
  credits: number;
  total_credits_purchased: number;
  total_credits_used: number;
}

// TODO: Remove this bypass when auth is working
const BYPASS_AUTH = true;

export default function CreditsPage() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const { getClient } = useObjectiveAI();
  const [creditsData, setCreditsData] = useState<CreditsData | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [creditsError, setCreditsError] = useState<string | null>(null);

  // Fetch credits using SDK
  const fetchCredits = useCallback(async () => {
    try {
      setCreditsLoading(true);
      setCreditsError(null);
      const client = await getClient();
      const result = await Auth.Credits.retrieve(client);
      setCreditsData(result as CreditsData);
    } catch (error) {
      if (error instanceof ObjectiveAIFetchError) {
        if (error.code === 401 || error.code === 403) {
          setCreditsError('Please sign in to view credits');
        } else {
          setCreditsError(error.message || `API error (${error.code})`);
        }
      } else {
        setCreditsError(error instanceof Error ? error.message : 'Failed to fetch credits');
      }
    } finally {
      setCreditsLoading(false);
    }
  }, [getClient]);

  // Fetch credits when user is authenticated (or bypass enabled)
  useEffect(() => {
    if ((user || BYPASS_AUTH) && !isLoading) {
      fetchCredits();
    }
  }, [user, isLoading, fetchCredits]);

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

  if (!user && !BYPASS_AUTH) {
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
      <div className="container" style={{ padding: isMobile ? '0 16px' : '0 32px' }}>
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
          {creditsLoading ? (
            <>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Loading credits...
              </p>
            </>
          ) : creditsError ? (
            <>
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-error)"
                strokeWidth="1.5"
                style={{ marginBottom: '12px', opacity: 0.6 }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '14px',
                marginBottom: '12px',
              }}>
                {creditsError}
              </p>
              <button
                onClick={fetchCredits}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--accent)',
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            </>
          ) : (
            <>
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
                {(creditsData?.credits ?? 0).toLocaleString()}
              </div>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
              }}>
                credits available
              </p>
            </>
          )}
        </div>

        {/* Purchase Button - Coming Soon */}
        <div style={{ marginBottom: '40px' }}>
          <button
            className="pillBtn"
            disabled
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: 600,
              background: 'var(--border)',
              color: 'var(--text-muted)',
              border: 'none',
              cursor: 'not-allowed',
              opacity: 0.6,
            }}
          >
            Purchase Credits — Coming Soon
          </button>
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '12px',
            opacity: 0.7,
          }}>
            Credit purchases will be available soon
          </p>
        </div>

        {/* Usage Stats */}
        {!creditsLoading && !creditsError && creditsData && (
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
                  {creditsData.total_credits_purchased.toLocaleString()}
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
                  {creditsData.total_credits_used.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

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
