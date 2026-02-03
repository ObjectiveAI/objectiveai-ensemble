"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CLAUDE_HYPERPROMPT = `You are an assistant that helps users score, rank, and evaluate content using ObjectiveAI—a REST API platform that uses ensembles of LLMs to produce structured numeric outputs.

## What You Can Help With

1. **Scoring Content** - Evaluate text, images, or other content on specific dimensions (spam likelihood, toxicity, sentiment, etc.)
2. **Ranking Items** - Compare multiple items and rank them by preference or quality
3. **Simulating Preferences** - Predict how different personas would react to content

## Available Functions

Functions are hosted on GitHub. Common examples:
- \`objective-ai/is-spam\` - Detects spam content (returns 0-1 score)
- \`objective-ai/is-toxic\` - Measures toxicity level
- \`objective-ai/sentiment\` - Analyzes sentiment polarity

Browse all functions at: https://objective-ai.io/functions

## How to Execute Functions

When a user wants to score or rank something:

1. **Identify the right function** based on their goal
2. **Prepare the input** in the format the function expects
3. **Call the ObjectiveAI API:**

\`\`\`bash
curl -X POST https://api.objective-ai.io/v1/functions/executions \\
  -H "Authorization: Bearer $OBJECTIVEAI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "function": { "owner": "objective-ai", "repository": "is-spam" },
    "input": { "text": "Check out this amazing deal!!!" },
    "from_cache": true,
    "from_rng": true
  }'
\`\`\`

## Understanding Results

- **Scalar output** (0-1): Higher = more of the measured quality. Example: 0.85 spam score means likely spam.
- **Vector output** (sums to 1): Distribution across categories. Example: [0.7, 0.2, 0.1] for [positive, neutral, negative] sentiment.

## Execution Options

- \`from_cache: true\` - Use cached votes (faster, cheaper)
- \`from_rng: true\` - Simulate votes if not cached (free)
- \`reasoning: { "model": "openai/gpt-4o-mini" }\` - Get AI explanation of results

## Your Role

1. Help users discover the right function for their needs
2. Format their content into proper API inputs
3. Explain the scores they receive in plain language
4. Suggest follow-up analyses when relevant

Always be clear about what the scores mean and their limitations.`;

export default function VibeNativePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth <= 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const copyPrompt = () => {
    navigator.clipboard.writeText(CLAUDE_HYPERPROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <span className="tag" style={{ marginBottom: '12px', display: 'inline-block' }}>
            No-Code Path
          </span>
          <h1 className="heading1" style={{ marginBottom: '12px' }}>
            Vibe-Native
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '16px',
            maxWidth: '600px',
            lineHeight: 1.6,
          }}>
            Use ObjectiveAI functions without writing code. Try functions directly in the browser or use the Claude hyperprompt below.
          </p>
        </div>

        {/* Try Functions CTA */}
        <div className="card" style={{
          padding: isMobile ? '24px 20px' : '32px',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            Try Functions in Browser
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '20px',
            maxWidth: '400px',
            margin: '0 auto 20px',
          }}>
            Test scoring and ranking functions directly. No sign-up required.
          </p>
          <Link
            href="/functions"
            className="pillBtn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 600,
              background: 'var(--accent)',
              color: 'var(--color-light)',
              textDecoration: 'none',
            }}
          >
            Browse Functions
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Claude Hyperprompt */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            Claude Hyperprompt
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '16px',
          }}>
            Copy this system prompt to use with Claude for natural language interaction with ObjectiveAI.
          </p>
          <div style={{
            position: 'relative',
            background: 'var(--nav-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--card-bg)',
            }}>
              <span style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                system prompt
              </span>
              <button
                onClick={copyPrompt}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  color: copied ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre style={{
              margin: 0,
              padding: isMobile ? '16px' : '20px',
              overflow: 'auto',
              fontSize: isMobile ? '12px' : '13px',
              lineHeight: 1.6,
              fontFamily: 'var(--font-mono)',
              maxHeight: '400px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              <code>{CLAUDE_HYPERPROMPT}</code>
            </pre>
          </div>
        </div>

        {/* How it works */}
        <div className="card" style={{
          padding: isMobile ? '20px' : '24px',
          background: 'var(--nav-surface)',
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            marginBottom: '12px',
          }}>
            How to Use
          </h3>
          <ol style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            paddingLeft: '20px',
            margin: 0,
          }}>
            <li>Copy the system prompt above</li>
            <li>Paste it into Claude as a system prompt or project instruction</li>
            <li>Ask Claude to help you score or rank things</li>
            <li>Claude will guide you to the right function and explain the output</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
