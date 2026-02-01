"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';

export default function ResourcesPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth <= 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const apiEndpoints = [
    {
      category: "Ensemble LLMs",
      endpoints: [
        { method: "GET", path: "/ensemble_llms", desc: "List all ObjectiveAI Ensemble LLMs" },
        { method: "GET", path: "/ensemble_llms/{id}", desc: "Retrieve an ObjectiveAI Ensemble LLM" },
        { method: "GET", path: "/ensemble_llms/{id}/usage", desc: "Retrieve historical usage for an ObjectiveAI Ensemble LLM" }
      ]
    },
    {
      category: "Ensembles",
      endpoints: [
        { method: "GET", path: "/ensembles", desc: "List all ObjectiveAI Ensembles" },
        { method: "GET", path: "/ensembles/{id}", desc: "Retrieve an ObjectiveAI Ensemble" },
        { method: "GET", path: "/ensembles/{id}/usage", desc: "Retrieve historical usage for an ObjectiveAI Ensemble" }
      ]
    },
    {
      category: "Functions",
      endpoints: [
        { method: "GET", path: "/functions", desc: "List all remote ObjectiveAI Functions" },
        { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/usage", desc: "Retrieve historical usage for a remote ObjectiveAI Function" },
        { method: "POST", path: "/functions", desc: "Execute an inline ObjectiveAI Function with an inline Profile" },
        { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}", desc: "Execute a remote ObjectiveAI Function with an inline Profile" },
        { method: "POST", path: "/functions/profiles/{powner}/{prepository}/{pcommit}", desc: "Execute an inline ObjectiveAI Function with a remote Profile" },
        { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}", desc: "Execute a remote ObjectiveAI Function with a remote Profile" }
      ]
    },
    {
      category: "Function Profiles",
      endpoints: [
        { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/compute", desc: "Compute an ObjectiveAI Function Profile from your own Data" },
        { method: "GET", path: "/functions/profiles", desc: "List all remote ObjectiveAI Function Profiles" },
        { method: "GET", path: "/functions/profiles/{powner}/{prepository}/{pcommit}/usage", desc: "Retrieve historical usage for a remote ObjectiveAI Function Profile" }
      ]
    },
    {
      category: "Vector",
      endpoints: [
        { method: "POST", path: "/vector/completions", desc: "Create a new Vector Completion" }
      ]
    },
    {
      category: "Chat",
      endpoints: [
        { method: "POST", path: "/chat/completions", desc: "Create a new Chat Completion" }
      ]
    },
    {
      category: "Auth",
      endpoints: [
        { method: "GET", path: "/auth/credits", desc: "Retrieve your available credits" },
        { method: "GET", path: "/auth/keys", desc: "List your API keys" },
        { method: "POST", path: "/auth/keys", desc: "Create a new API key" },
        { method: "DELETE", path: "/auth/keys", desc: "Disable an API key" },
        { method: "GET", path: "/auth/keys/openrouter", desc: "Retrieve your BYOK OpenRouter API key" },
        { method: "POST", path: "/auth/keys/openrouter", desc: "Set your BYOK OpenRouter API key" },
        { method: "DELETE", path: "/auth/keys/openrouter", desc: "Remove your BYOK OpenRouter API key" }
      ]
    }
  ];

  const sdks = [
    {
      lang: "JavaScript / TypeScript",
      links: [
        { label: "npm", url: "#", available: true },
        { label: "GitHub", url: "#", available: true }
      ]
    },
    {
      lang: "Python",
      links: [
        { label: "PyPI", url: "#", available: false },
        { label: "GitHub", url: "#", available: false }
      ]
    },
    {
      lang: "C# / .NET",
      links: [
        { label: "NuGet", url: "#", available: false },
        { label: "GitHub", url: "#", available: false }
      ]
    },
    {
      lang: "Go",
      links: [
        { label: "GitHub", url: "#", available: false }
      ]
    },
    {
      lang: "Rust",
      links: [
        { label: "crates.io", url: "#", available: false },
        { label: "GitHub", url: "#", available: false }
      ]
    },
    {
      lang: "Java",
      links: [
        { label: "Maven Central", url: "#", available: false },
        { label: "GitHub", url: "#", available: false }
      ]
    }
  ];

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '32px' : '40px',
        }}>
          <h1 style={{
            fontSize: isMobile ? '28px' : '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text)',
          }}>
            Resources
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Documentation, SDKs, and guides to help you build with ObjectiveAI.
          </p>
        </div>

        {/* Resource Cards */}
        <div className="gridThree" style={{
          marginBottom: isMobile ? '60px' : '100px',
        }}>
          <Link href="/faq" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: isMobile ? '16px' : '24px',
            }}>
              <h3 style={{
                fontSize: isMobile ? '16px' : '17px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text)',
              }}>
                FAQ
              </h3>
              <p style={{
                fontSize: isMobile ? '13px' : '14px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                flex: 1,
                marginBottom: '12px',
              }}>
                Frequently asked questions about ObjectiveAI
              </p>
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

          <Link href="/legal/terms" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: isMobile ? '16px' : '24px',
            }}>
              <h3 style={{
                fontSize: isMobile ? '16px' : '17px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text)',
              }}>
                Terms of Service
              </h3>
              <p style={{
                fontSize: isMobile ? '13px' : '14px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                flex: 1,
                marginBottom: '12px',
              }}>
                Terms and conditions for using ObjectiveAI
              </p>
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

          <Link href="/legal/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              padding: isMobile ? '16px' : '24px',
            }}>
              <h3 style={{
                fontSize: isMobile ? '16px' : '17px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text)',
              }}>
                Privacy Policy
              </h3>
              <p style={{
                fontSize: isMobile ? '13px' : '14px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                flex: 1,
                marginBottom: '12px',
              }}>
                How we handle and protect your data
              </p>
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
        </div>

        {/* API Docs Section */}
        <div style={{ marginBottom: isMobile ? '60px' : '100px' }}>
          <h2 className="heading2" style={{ marginBottom: isMobile ? '24px' : '32px' }}>API Documentation</h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '32px' : '48px',
          }}>
            {apiEndpoints.map((section, idx) => (
              <div key={idx}>
                <h3 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  marginBottom: isMobile ? '12px' : '16px',
                  color: 'var(--text)',
                }}>
                  {section.category}
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '16px' : '12px',
                }}>
                  {section.endpoints.map((endpoint, endIdx) => (
                    <div
                      key={endIdx}
                      style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: isMobile ? '4px' : '16px',
                        alignItems: isMobile ? 'flex-start' : 'flex-start',
                      }}
                    >
                      <span style={{
                        fontSize: isMobile ? '11px' : '13px',
                        fontWeight: 600,
                        padding: isMobile ? '2px 6px' : '4px 8px',
                        borderRadius: '4px',
                        flexShrink: 0,
                        lineHeight: 1,
                        color: endpoint.method === 'GET' ? '#10b981' :
                               endpoint.method === 'POST' ? 'var(--accent)' :
                               endpoint.method === 'DELETE' ? '#ef4444' : 'var(--text)',
                      }}>
                        {endpoint.method}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="endpointPath"
                          style={{
                            fontSize: isMobile ? '12px' : '14px',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: 'var(--text)',
                            marginBottom: '4px',
                            lineHeight: 1.4,
                            cursor: 'pointer',
                            wordBreak: 'break-all',
                          }}
                        >
                          {endpoint.path}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '13px' : '14px',
                          color: 'var(--text-muted)',
                          lineHeight: 1.4,
                        }}>
                          {endpoint.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SDKs Section */}
        <div style={{ marginBottom: isMobile ? '60px' : '100px' }}>
          <h2 className="heading2" style={{ marginBottom: '12px' }}>SDKs</h2>
          <p style={{
            fontSize: isMobile ? '14px' : '15px',
            color: 'var(--text-muted)',
            marginBottom: isMobile ? '24px' : '32px',
          }}>
            Set up your development environment to use the ObjectiveAI API with an Open-Source SDK in your preferred language.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '24px' : '32px',
          }}>
            {sdks.map((sdk, idx) => (
              <div key={idx}>
                <h3 style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text)',
                }}>
                  {sdk.lang}
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}>
                  {sdk.links.map((link, linkIdx) => (
                    <Link
                      key={linkIdx}
                      href={link.url}
                      className={link.available ? 'sdkLink' : ''}
                      style={{
                        fontSize: '14px',
                        color: link.available ? 'var(--text)' : 'var(--text-muted)',
                        textDecoration: 'underline',
                        cursor: link.available ? 'pointer' : 'default',
                        pointerEvents: link.available ? 'auto' : 'none',
                      }}
                    >
                      {link.label}
                      {!link.available && ' (Coming Soon)'}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
