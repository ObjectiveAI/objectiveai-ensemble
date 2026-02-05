"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useObjectiveAI } from "../../../hooks/useObjectiveAI";
import { COPY_FEEDBACK_DURATION_MS } from "../../../lib/constants";
import { Auth } from "objectiveai";
import { ObjectiveAIFetchError } from "objectiveai";

interface ApiKey {
  api_key: string;
  name: string;
  created: string;
  expires: string | null;
  disabled: string | null;
  description: string | null;
  cost: number;
}

export default function ApiKeysPage() {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const { getClient } = useObjectiveAI();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpires, setNewKeyExpires] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDisabling, setIsDisabling] = useState<string | null>(null);

  // Fetch keys using SDK
  const fetchKeys = useCallback(async () => {
    try {
      setKeysLoading(true);
      setKeysError(null);
      const client = await getClient();
      const result = await Auth.ApiKey.list(client);
      setKeys((result.data || []) as ApiKey[]);
    } catch (error) {
      if (error instanceof ObjectiveAIFetchError) {
        if (error.code === 401 || error.code === 403) {
          setKeysError('Please sign in to view API keys');
        } else {
          setKeysError(error.message || `API error (${error.code})`);
        }
      } else {
        setKeysError(error instanceof Error ? error.message : 'Failed to fetch keys');
      }
    } finally {
      setKeysLoading(false);
    }
  }, [getClient]);

  // Fetch keys when user is authenticated
  useEffect(() => {
    if (user && !isLoading) {
      fetchKeys();
    }
  }, [user, isLoading, fetchKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || isCreating) return;

    try {
      setIsCreating(true);
      const client = await getClient();
      const result = await Auth.ApiKey.create(
        client,
        newKeyName,
        newKeyExpires ? new Date(newKeyExpires) : undefined,
        newKeyDescription || undefined
      );
      // Show the full key to user (only time it's visible)
      setNewlyCreatedKey(result.api_key);
      setNewKeyName("");
      setNewKeyExpires("");
      setNewKeyDescription("");
      // Refresh the keys list
      fetchKeys();
    } catch (error) {
      if (error instanceof ObjectiveAIFetchError) {
        alert(error.message || `API error (${error.code})`);
      } else {
        alert(error instanceof Error ? error.message : 'Failed to create key');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDisableKey = async (apiKey: string) => {
    if (isDisabling) return;

    try {
      setIsDisabling(apiKey);
      const client = await getClient();
      await Auth.ApiKey.disable(client, apiKey);
      // Refresh the keys list
      fetchKeys();
    } catch (error) {
      if (error instanceof ObjectiveAIFetchError) {
        alert(error.message || `API error (${error.code})`);
      } else {
        alert(error instanceof Error ? error.message : 'Failed to disable key');
      }
    } finally {
      setIsDisabling(null);
    }
  };

  const handleCopyKey = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
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
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          <h1 style={{
            fontSize: isMobile ? '24px' : '28px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>
            Sign in to manage API keys
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '15px',
            maxWidth: '400px',
            marginBottom: '24px',
          }}>
            You need to be signed in to create and manage your API keys.
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
            API Keys
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: isMobile ? '14px' : '15px',
          }}>
            Create and manage API keys for programmatic access
          </p>
        </div>

        {/* Create Key Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="pillBtn"
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            background: 'var(--accent)',
            color: 'var(--color-light)',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create new key
        </button>

        {/* Keys List */}
        {keysLoading ? (
          <div className="card" style={{
            padding: isMobile ? '40px 20px' : '60px 32px',
            textAlign: 'center',
          }}>
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
              Loading API keys...
            </p>
          </div>
        ) : keysError ? (
          <div className="card" style={{
            padding: isMobile ? '40px 20px' : '60px 32px',
            textAlign: 'center',
          }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-error)"
              strokeWidth="1.5"
              style={{ marginBottom: '16px', opacity: 0.6 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '8px',
            }}>
              Failed to load keys
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              maxWidth: '300px',
              margin: '0 auto 16px',
            }}>
              {keysError}
            </p>
            <button
              onClick={fetchKeys}
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
          </div>
        ) : keys.length === 0 ? (
          <div className="card" style={{
            padding: isMobile ? '40px 20px' : '60px 32px',
            textAlign: 'center',
          }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="1.5"
              style={{ marginBottom: '16px', opacity: 0.4 }}
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '8px',
            }}>
              No API keys yet
            </h3>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '14px',
              maxWidth: '300px',
              margin: '0 auto',
            }}>
              Create your first API key to start making requests to the ObjectiveAI API.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {keys.map((key) => (
              <div
                key={key.api_key}
                className="card"
                style={{
                  padding: isMobile ? '16px' : '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  opacity: key.disabled ? 0.5 : 1,
                }}
              >
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    marginBottom: '4px',
                  }}>
                    {key.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    {key.api_key}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(key.api_key);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Copy to clipboard"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  </div>
                  {key.description && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}>
                      {key.description}
                    </div>
                  )}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  textAlign: isMobile ? 'left' : 'right',
                }}>
                  <div>created {formatDate(key.created)}</div>
                  <div>expires {key.expires ? formatDate(key.expires) : 'never'}</div>
                </div>
                {key.disabled ? (
                  <span style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                  }}>
                    disabled
                  </span>
                ) : (
                  <button
                    onClick={() => handleDisableKey(key.api_key)}
                    disabled={isDisabling === key.api_key}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isDisabling === key.api_key ? 'var(--text-muted)' : 'var(--color-error)',
                      background: 'transparent',
                      border: `1px solid ${isDisabling === key.api_key ? 'var(--border)' : 'var(--color-error)'}`,
                      borderRadius: '8px',
                      cursor: isDisabling === key.api_key ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (isDisabling !== key.api_key) {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {isDisabling === key.api_key ? 'Disabling...' : 'disable'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="card" style={{
          padding: isMobile ? '20px' : '24px',
          background: 'var(--nav-surface)',
          marginTop: '40px',
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
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            API Key Security
          </h3>
          <ul style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: 1.7,
            paddingLeft: '20px',
            margin: 0,
          }}>
            <li>Store your keys securely and never share them publicly</li>
            <li>Disable keys immediately if they are compromised</li>
            <li>Use environment variables to store keys in your applications</li>
            <li>You can copy your keys from the list at any time</li>
          </ul>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <>
          <div
            onClick={() => {
              setShowCreateModal(false);
              setNewlyCreatedKey(null);
              setNewKeyName("");
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
            }}
          />
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: isMobile ? '24px 20px' : '32px',
            width: isMobile ? 'calc(100% - 40px)' : '440px',
            maxWidth: '440px',
            zIndex: 1001,
          }}>
            {newlyCreatedKey ? (
              <>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  color: 'var(--accent)',
                }}>
                  Key Created
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}>
                  Your new API key is ready. You can also copy it from the list anytime.
                </p>
                <div style={{
                  background: 'var(--nav-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  wordBreak: 'break-all',
                  marginBottom: '20px',
                }}>
                  {newlyCreatedKey}
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleCopyKey}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: 'var(--accent)',
                      color: 'var(--color-light)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? 'Copied!' : 'Copy Key'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewlyCreatedKey(null);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: 'transparent',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginBottom: '20px',
                  color: 'var(--accent)',
                }}>
                  Create API Key
                </h2>
                {/* Name field */}
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="name"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    background: 'var(--nav-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    color: 'var(--text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  autoFocus
                />
                {/* Expires field */}
                <input
                  type="text"
                  value={newKeyExpires}
                  onChange={(e) => setNewKeyExpires(e.target.value)}
                  placeholder="expires (optional)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    background: 'var(--nav-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    color: 'var(--text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
                {/* Description field */}
                <textarea
                  value={newKeyDescription}
                  onChange={(e) => setNewKeyDescription(e.target.value)}
                  placeholder="description (optional)"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    background: 'var(--nav-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    color: 'var(--text)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName("");
                      setNewKeyExpires("");
                      setNewKeyDescription("");
                    }}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: 'transparent',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim() || isCreating}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: newKeyName.trim() && !isCreating ? 'var(--accent)' : 'var(--accent-muted)',
                      color: 'var(--color-light)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: newKeyName.trim() && !isCreating ? 'pointer' : 'not-allowed',
                      opacity: newKeyName.trim() && !isCreating ? 1 : 0.6,
                    }}
                  >
                    {isCreating ? 'Creating...' : 'Confirm'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
