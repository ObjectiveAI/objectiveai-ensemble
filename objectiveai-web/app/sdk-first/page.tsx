"use client";

import { useState } from "react";
import Link from "next/link";
import { useIsMobile } from "../../hooks/useIsMobile";
import { COPY_FEEDBACK_DURATION_MS } from "../../lib/constants";

export default function SdkFirstPage() {
  const isMobile = useIsMobile();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), COPY_FEEDBACK_DURATION_MS);
  };

  const installCode = "npm install objectiveai";

  const quickStartCode = `import { ObjectiveAI, Functions } from "objectiveai";

const client = new ObjectiveAI({
  apiKey: process.env.OBJECTIVEAI_API_KEY,
});

// Browse available functions
const functions = await Functions.list(client);
console.log(functions.data);

// Execute a function with a profile
// const result = await Functions.Executions.create(
//   client,
//   { owner: "fn-owner", repository: "fn-repo" },
//   { owner: "profile-owner", repository: "profile-repo" },
//   { input: { text: "Hello world" }, from_cache: true, from_rng: true }
// );
// console.log(result.output);`;

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
            SDK-First
          </h1>
          <p style={{
            fontSize: isMobile ? '14px' : '16px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            Integrate ObjectiveAI into your applications with the TypeScript SDK.
          </p>
        </div>

        {/* CTA Card */}
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
            Get Started with the SDK
          </h2>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            marginBottom: '20px',
            maxWidth: '400px',
            margin: '0 auto 20px',
          }}>
            Install the package and start making requests in minutes.
          </p>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <a
              href="https://www.npmjs.com/package/objectiveai"
              target="_blank"
              rel="noopener noreferrer"
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
              npm
            </a>
            <a
              href="https://github.com/ObjectiveAI/objectiveai"
              target="_blank"
              rel="noopener noreferrer"
              className="pillBtn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 28px',
                fontSize: '15px',
                fontWeight: 600,
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                textDecoration: 'none',
              }}
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Install */}
        <div style={{ marginBottom: '24px' }}>
          <h2 className="heading2" style={{ marginBottom: '12px' }}>
            Install
          </h2>
          <CodeBlock
            code={installCode}
            language="bash"
            index={0}
            copiedIndex={copiedIndex}
            onCopy={copyCode}
            isMobile={isMobile}
          />
        </div>

        {/* Quick Start */}
        <div style={{ marginBottom: '32px' }}>
          <h2 className="heading2" style={{ marginBottom: '12px' }}>
            Quick Start
          </h2>
          <CodeBlock
            code={quickStartCode}
            language="typescript"
            index={1}
            copiedIndex={copiedIndex}
            onCopy={copyCode}
            isMobile={isMobile}
          />
        </div>

        {/* Get API Key */}
        <div className="card" style={{
          padding: isMobile ? '20px' : '24px',
          background: 'var(--nav-surface)',
        }}>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            marginBottom: '16px',
          }}>
            You need an API key to make requests.
          </p>
          <Link
            href="/account/keys"
            className="pillBtn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 600,
              background: 'var(--accent)',
              color: 'var(--color-light)',
              textDecoration: 'none',
            }}
          >
            Get API Key
          </Link>
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  code,
  language,
  index,
  copiedIndex,
  onCopy,
  isMobile
}: {
  code: string;
  language: string;
  index: number;
  copiedIndex: number | null;
  onCopy: (code: string, index: number) => void;
  isMobile: boolean;
}) {
  return (
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
          {language}
        </span>
        <button
          onClick={() => onCopy(code, index)}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            cursor: 'pointer',
            color: copiedIndex === index ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {copiedIndex === index ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: isMobile ? '16px' : '20px',
        overflow: 'auto',
        fontSize: isMobile ? '12px' : '13px',
        lineHeight: 1.6,
        fontFamily: 'var(--font-mono)',
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
