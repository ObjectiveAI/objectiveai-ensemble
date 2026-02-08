"use client";

import { useState } from "react";
import Link from "next/link";
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

export default function FAQPage() {
  const isMobile = useIsMobile();
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

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text)',
          }}>
            Frequently Asked Questions
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Common questions about ObjectiveAI
          </p>
        </div>

        {/* FAQ Sections */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '48px',
        }}>
          {faqSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 600,
                marginBottom: '20px',
                color: 'var(--text)',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border)',
              }}>
                {section.title}
              </h2>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {section.items.map((item, itemIdx) => {
                  const key = `${sectionIdx}-${itemIdx}`;
                  const isOpen = openItems.has(key);
                  return (
                    <div
                      key={key}
                      className="card"
                      style={{
                        padding: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        style={{
                          width: '100%',
                          padding: isMobile ? '16px' : '20px 24px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '16px',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{
                          fontSize: '15px',
                          fontWeight: 500,
                          color: 'var(--text)',
                          lineHeight: 1.4,
                        }}>
                          {item.question}
                        </span>
                        <span style={{
                          fontSize: '18px',
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
                          padding: isMobile ? '0 16px 16px' : '0 24px 20px',
                        }}>
                          <p style={{
                            fontSize: '14px',
                            color: 'var(--text-muted)',
                            lineHeight: 1.7,
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

        {/* Contact Section */}
        <div style={{
          textAlign: 'center',
          marginTop: '80px',
          padding: isMobile ? '32px 24px' : '48px',
          background: 'var(--card-bg)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 600,
            marginBottom: '12px',
            color: 'var(--text)',
          }}>
            Still have questions?
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginBottom: '20px',
            lineHeight: 1.6,
          }}>
            Check out our resources or get in touch with our team.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link href="/information" className="pillBtn">
              Information
            </Link>
            <a
              href="mailto:admin@objective-ai.io"
              className="pillBtnGhost"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
