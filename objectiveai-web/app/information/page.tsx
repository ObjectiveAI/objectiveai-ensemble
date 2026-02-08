"use client";

import { useState } from "react";
import Link from 'next/link';
import { useIsMobile } from "../../hooks/useIsMobile";

interface FAQItem {
  question: string;
  answer: string;
}

const faqSections: { title: string; items: FAQItem[] }[] = [
  {
    title: "General",
    items: [
      {
        question: "What is ObjectiveAI?",
        answer: "ObjectiveAI is a REST API platform for scoring, ranking, and simulating preferences using ensembles of LLMs. Instead of asking one model for an answer, it uses multiple LLMs with explicit weights to produce structured numeric outputs."
      },
      {
        question: "How is ObjectiveAI different from using a single LLM?",
        answer: "Rather than relying on one model's opinion, ObjectiveAI combines votes from multiple LLMs with configurable weights. This produces more reliable, reproducible scores and reduces single-model bias."
      },
      {
        question: "What can I build with ObjectiveAI?",
        answer: "Common use cases include content ranking, preference simulation, A/B testing alternatives, quality scoring, recommendation systems, and any application requiring structured numeric outputs from AI evaluation."
      }
    ]
  },
  {
    title: "Core Concepts",
    items: [
      {
        question: "What is an Ensemble LLM?",
        answer: "An Ensemble LLM is a fully-specified configuration of a single upstream LLM, including model identity (e.g., openai/gpt-4o), prompt structure, decoding parameters, and output mode. Each configuration has a content-addressed ID computed deterministically from its definition."
      },
      {
        question: "What is an Ensemble?",
        answer: "An Ensemble is a collection of Ensemble LLMs used together for voting. Ensembles are immutable—any change produces a new ID. Importantly, Ensembles do NOT contain weights; weights are execution-time parameters."
      },
      {
        question: "How do Weights work?",
        answer: "Weights are execution-time parameters controlling each LLM's influence in an Ensemble. They are external to Ensemble definitions, meaning the same Ensemble can behave differently with different weights. Weights can be learned via training (Profiles)."
      },
      {
        question: "What is a Vector Completion?",
        answer: "Vector Completions are the core primitive. They take a prompt and possible responses, run Chat Completions across all LLMs in an Ensemble, combine votes using weights, and return a vector of scores that sums to 1."
      },
      {
        question: "What are Functions?",
        answer: "Functions are composable scoring pipelines. They execute a list of tasks (Vector Completions or other Functions) and produce either a scalar (single score in [0,1]) or a vector (array of scores that sum to ~1)."
      },
      {
        question: "What are Profiles?",
        answer: "Profiles are learned weights for Functions. ObjectiveAI doesn't fine-tune LLMs—it learns optimal weights over fixed models by training on datasets with expected outputs."
      }
    ]
  },
  {
    title: "Technical",
    items: [
      {
        question: "How does probabilistic voting work?",
        answer: "LLMs are inherently probabilistic. ObjectiveAI bypasses the sampler using logprobs to capture the model's full preference distribution. Instead of getting one discrete answer, it extracts probabilities for each option simultaneously."
      },
      {
        question: "What are content-addressed IDs?",
        answer: "IDs are computed deterministically from definitions using XXHash3-128 and encoded in base62. Identical definitions always produce identical IDs, ensuring reproducibility."
      },
      {
        question: "How are Functions hosted?",
        answer: "Functions are hosted on GitHub as function.json at the repository root. Reference them by owner/repo, optionally with a commit SHA for immutability."
      },
      {
        question: "What SDKs are available?",
        answer: "ObjectiveAI offers a TypeScript SDK (npm: objectiveai) and a Rust SDK (objectiveai-rs). WASM bindings are available for browser and Node.js environments. Python, Go, and other SDKs are planned."
      }
    ]
  },
  {
    title: "Billing & Usage",
    items: [
      {
        question: "How is usage billed?",
        answer: "Usage is billed based on API calls. The 'cost' field shows what ObjectiveAI charged, while 'total_cost' includes upstream provider costs. With BYOK (Bring Your Own Key), you pay upstream providers directly."
      },
      {
        question: "What is BYOK?",
        answer: "BYOK (Bring Your Own Key) allows you to use your own API keys for upstream LLM providers like OpenRouter. This way, upstream costs are billed directly to your provider account."
      },
      {
        question: "Is there a free tier?",
        answer: "Contact us at admin@objective-ai.io for information about pricing tiers and free trial credits."
      }
    ]
  }
];

export default function InformationPage() {
  const isMobile = useIsMobile();
  const [sdksOpen, setSdksOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const apiEndpoints = [
    {
      category: "Ensemble LLMs",
      endpoints: [
        { method: "GET", path: "/ensemble_llms", href: "/docs/api/get/ensemble_llms", desc: "List all ObjectiveAI Ensemble LLMs" },
        { method: "GET", path: "/ensemble_llms/{id}", href: "/docs/api/get/ensemble_llms/id", desc: "Retrieve an ObjectiveAI Ensemble LLM" },
        { method: "GET", path: "/ensemble_llms/{id}/usage", href: "/docs/api/get/ensemble_llms/id/usage", desc: "Retrieve historical usage for an ObjectiveAI Ensemble LLM" }
      ]
    },
    {
      category: "Ensembles",
      endpoints: [
        { method: "GET", path: "/ensembles", href: "/docs/api/get/ensembles", desc: "List all ObjectiveAI Ensembles" },
        { method: "GET", path: "/ensembles/{id}", href: "/docs/api/get/ensembles/id", desc: "Retrieve an ObjectiveAI Ensemble" },
        { method: "GET", path: "/ensembles/{id}/usage", href: "/docs/api/get/ensembles/id/usage", desc: "Retrieve historical usage for an ObjectiveAI Ensemble" }
      ]
    },
    {
      category: "Functions",
      endpoints: [
        { method: "GET", path: "/functions", href: "/docs/api/get/functions", desc: "List all remote ObjectiveAI Functions" },
        { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}", href: "/docs/api/get/functions/fowner/frepository/fcommit", desc: "Retrieve a remote ObjectiveAI Function" },
        { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/usage", href: "/docs/api/get/functions/fowner/frepository/fcommit/usage", desc: "Retrieve historical usage for a remote ObjectiveAI Function" },
        { method: "POST", path: "/functions", href: "/docs/api/post/functions", desc: "Execute an inline ObjectiveAI Function with an inline Profile" },
        { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}", href: "/docs/api/post/functions/fowner/frepository/fcommit", desc: "Execute a remote ObjectiveAI Function with an inline Profile" },
        { method: "POST", path: "/functions/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/post/functions/profiles/powner/prepository/pcommit", desc: "Execute an inline ObjectiveAI Function with a remote Profile" },
        { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/post/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit", desc: "Execute a remote ObjectiveAI Function with a remote Profile" }
      ]
    },
    {
      category: "Function Profiles",
      endpoints: [
        { method: "POST", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/compute", href: "/docs/api/post/functions/fowner/frepository/fcommit/profiles/compute", desc: "Compute an ObjectiveAI Function Profile from your own Data (remote Function)" },
        { method: "POST", path: "/functions/profiles/compute", href: "/docs/api/post/functions/profiles/compute", desc: "Compute an ObjectiveAI Function Profile from your own Data (inline Function)" },
        { method: "GET", path: "/functions/profiles", href: "/docs/api/get/functions/profiles", desc: "List all remote ObjectiveAI Function Profiles" },
        { method: "GET", path: "/functions/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/get/functions/profiles/powner/prepository/pcommit", desc: "Retrieve a remote ObjectiveAI Function Profile" },
        { method: "GET", path: "/functions/profiles/{powner}/{prepository}/{pcommit}/usage", href: "/docs/api/get/functions/profiles/powner/prepository/pcommit/usage", desc: "Retrieve historical usage for a remote ObjectiveAI Function Profile" }
      ]
    },
    {
      category: "Function-Profile Pairs",
      endpoints: [
        { method: "GET", path: "/functions/profiles/pairs", href: "/docs/api/get/functions/profiles/pairs", desc: "List all remote ObjectiveAI Function-Profile pairs" },
        { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}", href: "/docs/api/get/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit", desc: "Retrieve a remote ObjectiveAI Function-Profile pair" },
        { method: "GET", path: "/functions/{fowner}/{frepository}/{fcommit}/profiles/{powner}/{prepository}/{pcommit}/usage", href: "/docs/api/get/functions/fowner/frepository/fcommit/profiles/powner/prepository/pcommit/usage", desc: "Retrieve historical usage for a remote ObjectiveAI Function-Profile pair" }
      ]
    },
    {
      category: "Vector",
      endpoints: [
        { method: "POST", path: "/vector/completions", href: "/docs/api/post/vector/completions", desc: "Create a new Vector Completion" },
        { method: "GET", path: "/vector/completions/{id}", href: "/docs/api/get/vector/completions/id", desc: "Retrieve votes from a historical Vector Completion" },
        { method: "GET", path: "/vector/completions/cache", href: "/docs/api/get/vector/completions/cache", desc: "Request a cached vote from the global ObjectiveAI vote cache" }
      ]
    },
    {
      category: "Chat",
      endpoints: [
        { method: "POST", path: "/chat/completions", href: "/docs/api/post/chat/completions", desc: "Create a new Chat Completion" }
      ]
    },
    {
      category: "Auth",
      endpoints: [
        { method: "GET", path: "/auth/credits", href: "/docs/api/get/auth/credits", desc: "Retrieve your available credits" },
        { method: "GET", path: "/auth/keys", href: "/docs/api/get/auth/keys", desc: "List your API keys" },
        { method: "POST", path: "/auth/keys", href: "/docs/api/post/auth/keys", desc: "Create a new API key" },
        { method: "DELETE", path: "/auth/keys", href: "/docs/api/delete/auth/keys", desc: "Disable an API key" },
        { method: "GET", path: "/auth/keys/openrouter", href: "/docs/api/get/auth/keys/openrouter", desc: "Retrieve your BYOK OpenRouter API key" },
        { method: "POST", path: "/auth/keys/openrouter", href: "/docs/api/post/auth/keys/openrouter", desc: "Set your BYOK OpenRouter API key" },
        { method: "DELETE", path: "/auth/keys/openrouter", href: "/docs/api/delete/auth/keys/openrouter", desc: "Remove your BYOK OpenRouter API key" }
      ]
    }
  ];

  const sdks = [
    {
      lang: "JavaScript / TypeScript",
      links: [
        { label: "Getting Started", url: "/sdk-first", available: true },
        { label: "npm", url: "https://www.npmjs.com/package/objectiveai", available: true },
        { label: "GitHub", url: "https://github.com/ObjectiveAI/objectiveai", available: true }
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
        { label: "crates.io", url: "https://crates.io/crates/objectiveai", available: true },
        { label: "GitHub", url: "https://github.com/ObjectiveAI/objectiveai", available: true }
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
            Information
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Documentation, SDKs, and guides to help you build with ObjectiveAI.
          </p>
        </div>

        {/* FAQ Card - Collapsible */}
        <div
          className="card"
          role="button"
          tabIndex={0}
          aria-expanded={faqOpen}
          style={{
            marginBottom: '24px',
            padding: 0,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => setFaqOpen(!faqOpen)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFaqOpen(!faqOpen); } }}
        >
          <div
            style={{
              padding: isMobile ? '16px' : '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text)',
              }}>
                FAQ
              </h3>
              <p style={{
                fontSize: isMobile ? '14px' : '15px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                Frequently asked questions about ObjectiveAI
              </p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: faqOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {faqOpen && (
            <div style={{
              padding: isMobile ? '0 16px 16px' : '0 24px 24px',
              borderTop: '1px solid var(--border)',
              marginTop: '8px',
              paddingTop: isMobile ? '16px' : '20px',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}>
                {faqSections.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    <h4 style={{
                      fontSize: isMobile ? '14px' : '15px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      color: 'var(--text)',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border)',
                    }}>
                      {section.title}
                    </h4>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}>
                      {section.items.map((item, itemIdx) => {
                        const key = `${sectionIdx}-${itemIdx}`;
                        const isOpen = openItems.has(key);
                        return (
                          <div
                            key={key}
                            style={{
                              background: 'var(--page-bg)',
                              borderRadius: '8px',
                              overflow: 'hidden',
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleItem(key);
                              }}
                              aria-expanded={isOpen}
                              style={{
                                width: '100%',
                                padding: isMobile ? '12px 14px' : '14px 16px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '12px',
                                textAlign: 'left',
                              }}
                            >
                              <span style={{
                                fontSize: isMobile ? '13px' : '14px',
                                fontWeight: 500,
                                color: 'var(--text)',
                                lineHeight: 1.4,
                              }}>
                                {item.question}
                              </span>
                              <span style={{
                                fontSize: '16px',
                                color: 'var(--text-muted)',
                                flexShrink: 0,
                                transition: 'transform 0.2s',
                                transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                              }}>
                                +
                              </span>
                            </button>
                            {isOpen && (
                              <div style={{
                                padding: isMobile ? '0 14px 12px' : '0 16px 14px',
                              }}>
                                <p style={{
                                  fontSize: '13px',
                                  color: 'var(--text-muted)',
                                  lineHeight: 1.7,
                                  margin: 0,
                                }}>
                                  {item.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SDKs Card - Collapsible */}
        <div
          className="card"
          role="button"
          tabIndex={0}
          aria-expanded={sdksOpen}
          style={{
            marginBottom: '24px',
            padding: 0,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => setSdksOpen(!sdksOpen)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSdksOpen(!sdksOpen); } }}
        >
          <div
            style={{
              padding: isMobile ? '16px' : '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text)',
              }}>
                SDKs
              </h3>
              <p style={{
                fontSize: isMobile ? '14px' : '15px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                Set up your development environment with an Open-Source SDK
              </p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: sdksOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {sdksOpen && (
            <div
              style={{
                padding: isMobile ? '0 16px 16px' : '0 24px 24px',
                borderTop: '1px solid var(--border)',
                marginTop: '8px',
                paddingTop: isMobile ? '16px' : '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '24px' : '32px',
              }}>
                {sdks.map((sdk, idx) => (
                  <div key={idx}>
                    <h4 style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: 600,
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}>
                      {sdk.lang}
                    </h4>
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
          )}
        </div>

        {/* API Documentation Card - Collapsible */}
        <div
          className="card"
          role="button"
          tabIndex={0}
          aria-expanded={docsOpen}
          style={{
            marginBottom: '24px',
            padding: 0,
            overflow: 'hidden',
            cursor: 'pointer',
          }}
          onClick={() => setDocsOpen(!docsOpen)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDocsOpen(!docsOpen); } }}
        >
          <div
            style={{
              padding: isMobile ? '16px' : '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div>
              <h3 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: 600,
                marginBottom: '8px',
                color: 'var(--text)',
              }}>
                API Documentation
              </h3>
              <p style={{
                fontSize: isMobile ? '14px' : '15px',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
                margin: 0,
              }}>
                REST API endpoints and reference documentation
              </p>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                flexShrink: 0,
                transition: 'transform 0.2s',
                transform: docsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {docsOpen && (
            <div
              style={{
                padding: isMobile ? '0 16px 16px' : '0 24px 24px',
                borderTop: '1px solid var(--border)',
                marginTop: '8px',
                paddingTop: isMobile ? '16px' : '20px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '32px' : '48px',
              }}>
                {apiEndpoints.map((section, idx) => (
                  <div key={idx}>
                    <h4 style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: 600,
                      marginBottom: isMobile ? '12px' : '16px',
                      color: 'var(--text)',
                    }}>
                      {section.category}
                    </h4>
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
                            color: endpoint.method === 'GET' ? 'var(--method-get)' :
                                   endpoint.method === 'POST' ? 'var(--accent)' :
                                   endpoint.method === 'DELETE' ? 'var(--color-error)' : 'var(--text)',
                          }}>
                            {endpoint.method}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link
                              href={endpoint.href}
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
                                display: 'block',
                                textDecoration: 'none',
                              }}
                            >
                              {endpoint.path}
                            </Link>
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
          )}
        </div>
      </div>
    </div>
  );
}
