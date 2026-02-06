"use client";

import { useState, useEffect, useRef } from "react";
import { useResponsive } from "../../hooks/useResponsive";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletion {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
      role?: string;
    };
    delta?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost?: number;
    total_cost?: number;
  };
}

export default function ChatPage() {
  const [model, setModel] = useState("openai/gpt-4o-mini");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatCompletion["usage"] | null>(null);
  const { isMobile } = useResponsive();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [inputValue]);

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    setUsage(null);

    // Add placeholder assistant message for streaming
    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch("/api/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: newMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Handle streaming
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let finalUsage: ChatCompletion["usage"] | null = null;

        if (!reader) {
          throw new Error("Response body is not readable");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              if (!data) continue;

              try {
                const chunk: ChatCompletion = JSON.parse(data);
                if ((chunk as { error?: string }).error) {
                  throw new Error((chunk as { error: string }).error);
                }

                // Accumulate content from delta
                const deltaContent = chunk.choices?.[0]?.delta?.content;
                if (deltaContent) {
                  accumulatedContent += deltaContent;
                  setMessages([...newMessages, { role: "assistant", content: accumulatedContent }]);
                }

                // Capture usage from final chunk
                if (chunk.usage) {
                  finalUsage = chunk.usage;
                }
              } catch {
                // Skip malformed chunks - stream continues
              }
            }
          }
        }

        if (finalUsage) {
          setUsage(finalUsage);
        }
      } else {
        // Non-streaming fallback
        const result: ChatCompletion = await response.json();
        const content = result.choices?.[0]?.message?.content || "";
        setMessages([...newMessages, { role: "assistant", content }]);
        if (result.usage) {
          setUsage(result.usage);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      // Remove the empty assistant message on error
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setUsage(null);
    setError(null);
  };

  const spinnerStyle = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: spinnerStyle }} />

      <div className="container" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 140px)" }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? "16px" : "24px" }}>
          <h1 className="heading2" style={{ marginBottom: "8px" }}>
            Chat Completions
          </h1>
          <p style={{
            fontSize: isMobile ? "14px" : "16px",
            color: "var(--text-muted)",
            maxWidth: "600px",
          }}>
            Direct chat with an Ensemble LLM. Enter a model ID or use a pre-configured model name.
          </p>
        </div>

        {/* Model Input */}
        <div style={{ marginBottom: isMobile ? "16px" : "20px" }}>
          <label style={{
            display: "block",
            fontSize: "14px",
            fontWeight: 600,
            marginBottom: "8px",
            color: "var(--text)",
          }}>
            Model
            <span style={{
              fontWeight: 400,
              color: "var(--text-muted)",
              marginLeft: "8px",
            }}>
              Ensemble LLM ID or model name (e.g., openai/gpt-4o)
            </span>
          </label>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <div className="aiTextField" style={{ flex: 1, minWidth: isMobile ? "100%" : "300px" }}>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="openai/gpt-4o-mini"
              />
            </div>
            {messages.length > 0 && (
              <button
                className="pillBtnGhost"
                onClick={clearChat}
                style={{ flexShrink: 0 }}
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Conversation Frame */}
        <div
          className="card"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 0,
            overflow: "hidden",
          }}
        >
          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            padding: isMobile ? "16px" : "24px",
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "40px 20px",
              }}>
                <div>
                  <p style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}>💬</p>
                  <p style={{ fontSize: "14px" }}>Start a conversation</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: isMobile ? "12px 16px" : "14px 20px",
                        borderRadius: "16px",
                        background: msg.role === "user"
                          ? "var(--accent-light)"
                          : "var(--page-bg)",
                        color: "var(--text)",
                        fontSize: isMobile ? "14px" : "15px",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.content || (isLoading && msg.role === "assistant" && (
                        <span style={{ opacity: 0.6 }}>Thinking...</span>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              padding: "12px 16px",
              margin: isMobile ? "0 16px 12px" : "0 24px 12px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "12px",
              color: "var(--color-error)",
              fontSize: "14px",
            }}>
              {error.includes("401")
                ? "Authentication error. API key may be missing or invalid."
                : error
              }
            </div>
          )}

          {/* Usage Display */}
          {usage && (
            <div style={{
              padding: isMobile ? "8px 12px" : "8px 16px",
              margin: isMobile ? "0 16px 8px" : "0 24px 8px",
              fontSize: isMobile ? "12px" : "13px",
              color: "var(--text-muted)",
              display: "flex",
              flexWrap: "wrap",
              gap: isMobile ? "12px" : "16px",
            }}>
              <span>{usage.total_tokens.toLocaleString()} tokens</span>
              {usage.cost !== undefined && (
                <span style={{ color: "var(--text)" }}>
                  ${usage.cost.toFixed(4)}
                </span>
              )}
              {usage.total_cost !== undefined && usage.total_cost !== usage.cost && (
                <span>(${usage.total_cost.toFixed(4)} total)</span>
              )}
            </div>
          )}

          {/* Input Area */}
          <div style={{
            borderTop: "1px solid var(--border)",
            padding: isMobile ? "12px 16px" : "16px 24px",
            display: "flex",
            alignItems: "flex-end",
            gap: "12px",
          }}>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              style={{
                flex: 1,
                minHeight: "24px",
                maxHeight: "200px",
                resize: "none",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "15px",
                fontFamily: "inherit",
                outline: "none",
                padding: 0,
                lineHeight: 1.5,
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !inputValue.trim()}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: isLoading || !inputValue.trim()
                  ? "var(--border)"
                  : "var(--accent)",
                cursor: isLoading || !inputValue.trim() ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              {isLoading ? (
                <div style={{
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={!inputValue.trim() ? "var(--text-muted)" : "#fff"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
