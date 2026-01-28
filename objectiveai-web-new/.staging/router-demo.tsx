/**
 * STAGING: Functions Router Demo
 *
 * This file contains the interactive chat demo that was on the landing page.
 * Saved here for future use when backend is ready.
 *
 * To restore:
 * 1. Import RouterDemo component into page.tsx
 * 2. Add <RouterDemo /> after Hero section
 */

"use client";

import { useState, useEffect, useRef } from "react";

// Chat message types
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  functionCall?: {
    name: string;
    status: 'thinking' | 'calling' | 'complete';
    result?: Record<string, unknown>;
  };
};

// Initial example conversation
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content: 'Can you analyze this restaurant review? "The pasta was incredible, perfectly al dente with a rich sauce. Service was attentive but not intrusive. Will definitely come back!"',
  },
  {
    role: 'assistant',
    content: 'I\'ll analyze that review for you using the Sentiment Analyzer function.',
    functionCall: {
      name: 'Sentiment Analyzer',
      status: 'complete',
      result: {
        sentiment: 'positive',
        confidence: 0.94,
        themes: ['food quality', 'service', 'intent to return'],
        scores: { food: 0.96, service: 0.89, overall: 0.94 }
      }
    }
  },
  {
    role: 'assistant',
    content: 'The review is strongly positive (94% confidence). Key themes detected: excellent food quality, good service, and clear intent to return. The food received the highest score at 96%.',
  }
];

// Mock responses based on input keywords
const getMockResponse = (input: string): ChatMessage[] => {
  const lower = input.toLowerCase();

  if (lower.includes('review') || lower.includes('sentiment') || lower.includes('feedback')) {
    return [
      {
        role: 'assistant',
        content: 'I\'ll analyze that for sentiment and key themes.',
        functionCall: {
          name: 'Sentiment Analyzer',
          status: 'complete',
          result: {
            sentiment: lower.includes('bad') || lower.includes('terrible') ? 'negative' : 'positive',
            confidence: 0.87,
            themes: ['general feedback'],
          }
        }
      },
      {
        role: 'assistant',
        content: `Based on my analysis, the sentiment appears to be ${lower.includes('bad') || lower.includes('terrible') ? 'negative' : 'positive'} with 87% confidence.`,
      }
    ];
  }

  if (lower.includes('rank') || lower.includes('compare') || lower.includes('best')) {
    return [
      {
        role: 'assistant',
        content: 'I\'ll rank those options for you.',
        functionCall: {
          name: 'Content Ranker',
          status: 'complete',
          result: {
            ranked: true,
            criteria: ['relevance', 'quality'],
          }
        }
      },
      {
        role: 'assistant',
        content: 'I\'ve ranked the options based on relevance and quality metrics.',
      }
    ];
  }

  // Default response
  return [
    {
      role: 'assistant',
      content: 'I can help analyze, rank, or score content for you. Try asking me to analyze a review, rank some options, or evaluate text!',
    }
  ];
};

export default function RouterDemo() {
  const [isMobile, setIsMobile] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingText, setThinkingText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Auto-scroll within chat container only
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, thinkingText]);

  // Simulate thinking text streaming
  const simulateThinking = async () => {
    const thinkingPhrases = [
      'Analyzing request...',
      'Determining best function...',
      'Routing to handler...',
    ];

    for (const phrase of thinkingPhrases) {
      setThinkingText(phrase);
      await new Promise(r => setTimeout(r, 600));
    }
    setThinkingText('');
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isProcessing) return;

    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 2000);

    setMessages(prev => [...prev, { role: 'user', content: inputValue }]);
    setInputValue('');
    setIsProcessing(true);

    await simulateThinking();

    const responses = getMockResponse(inputValue);

    for (const response of responses) {
      await new Promise(r => setTimeout(r, 500));
      setMessages(prev => [...prev, response]);
    }

    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages(INITIAL_MESSAGES);
    setInputValue('');
  };

  return (
    <section style={{ padding: '0 32px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '32px' : '48px' }}>
          <span className="tag" style={{ marginBottom: '16px', display: 'inline-block' }}>
            Try It
          </span>
          <h2 className="heading2" style={{ marginBottom: '12px' }}>
            Functions Router
          </h2>
          <p style={{ fontSize: '17px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Chat with AI that intelligently routes to the right function
          </p>
        </div>

        {/* Chat Container */}
        <div className="card" style={{
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          height: isMobile ? '500px' : '560px',
        }}>
          {/* Chat Header */}
          <div style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Functions Router</span>
            <button
              onClick={resetChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                transition: 'color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              aria-label="Reset chat"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: '8px',
                }}
              >
                {/* Message Bubble */}
                <div style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--nav-surface)',
                  color: msg.role === 'user' ? 'var(--color-light)' : 'var(--text)',
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}>
                  {msg.content}
                </div>

                {/* Function Call Card */}
                {msg.functionCall && (
                  <div style={{
                    maxWidth: '85%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    background: 'var(--page-bg)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                      </svg>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        {msg.functionCall.name}
                      </span>
                      {msg.functionCall.status === 'complete' && (
                        <span style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          background: 'rgba(107, 92, 255, 0.15)',
                          color: 'var(--accent)',
                          borderRadius: '10px',
                          marginLeft: 'auto',
                        }}>
                          Complete
                        </span>
                      )}
                    </div>
                    {msg.functionCall.result && (
                      <pre style={{
                        margin: 0,
                        padding: '10px 12px',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: 'var(--text)',
                        overflow: 'auto',
                        lineHeight: 1.5,
                      }}>
                        {JSON.stringify(msg.functionCall.result, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            {thinkingText && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '16px 16px 16px 4px',
                  background: 'var(--nav-surface)',
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    display: 'inline-flex',
                    gap: '3px',
                  }}>
                    <span className="thinkingDot" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="thinkingDot" style={{ animationDelay: '150ms' }}>•</span>
                    <span className="thinkingDot" style={{ animationDelay: '300ms' }}>•</span>
                  </span>
                  {thinkingText}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            padding: '16px 20px',
          }}>
            <div className="aiTextField">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to analyze, rank, or score something..."
                disabled={isProcessing}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: inputValue.trim() && !isProcessing ? 'pointer' : 'default',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Send message"
              >
                <svg
                  className={`arrowIcon ${messageSent ? 'sent' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thinking dots animation */}
      <style jsx global>{`
        @keyframes thinkingPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .thinkingDot {
          animation: thinkingPulse 1s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

/**
 * Featured Functions Data
 * Used with the Featured Functions section
 */
export const FEATURED_FUNCTIONS = [
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
