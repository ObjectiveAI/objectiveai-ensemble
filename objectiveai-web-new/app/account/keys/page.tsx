"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function ApiKeysPage() {
  const { user, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth <= 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) return;

    // Placeholder - will connect to API
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: newKeyName,
      prefix: 'sk-obj-...xxxx',
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };

    setKeys([...keys, newKey]);
    setNewlyCreatedKey('sk-obj-example-key-value-here');
    setNewKeyName("");
  };

  const handleDeleteKey = (keyId: string) => {
    setKeys(keys.filter(k => k.id !== keyId));
  };

  const handleCopyKey = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
        {keys.length === 0 ? (
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
                key={key.id}
                className="card"
                style={{
                  padding: isMobile ? '16px' : '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
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
                  }}>
                    {key.prefix}
                  </div>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  textAlign: isMobile ? 'left' : 'right',
                }}>
                  <div>Created {formatDate(key.createdAt)}</div>
                  <div>
                    {key.lastUsed ? `Last used ${formatDate(key.lastUsed)}` : 'Never used'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'rgb(239, 68, 68)',
                    background: 'transparent',
                    border: '1px solid rgb(239, 68, 68)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Delete
                </button>
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
            <li>Keys are only shown once at creation time</li>
            <li>Store your keys securely and never share them publicly</li>
            <li>Delete keys immediately if they are compromised</li>
            <li>Use environment variables to store keys in your applications</li>
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
                }}>
                  Key Created
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}>
                  Copy your key now. You won't be able to see it again.
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
                  marginBottom: '8px',
                }}>
                  Create API Key
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginBottom: '20px',
                }}>
                  Give your key a name to help you identify it later.
                </p>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production, Development, Testing"
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
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleCreateKey}
                    disabled={!newKeyName.trim()}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      background: newKeyName.trim() ? 'var(--accent)' : 'var(--border)',
                      color: newKeyName.trim() ? 'var(--color-light)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: newKeyName.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Create Key
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKeyName("");
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
                    Cancel
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
