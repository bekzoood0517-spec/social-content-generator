import React, { useState } from 'react';
import { useHistoryStore } from '../features/history/useHistoryStore';
import { useGenerateStore } from '../features/generate/useGenerateStore';
import { formatWholePost, copyToClipboard } from '../lib/clipboard';
import { HistoryEntry } from '../types';

export const HistoryList: React.FC = () => {
  const {
    isOpen,
    entries,
    searchQuery,
    expandedId,
    copiedId,
    closeLedger,
    setSearchQuery,
    toggleExpand,
    setCopiedId,
    removeEntry,
    clearAll,
    exportJSON,
    exportCSV,
  } = useHistoryStore();

  const { loadFromHistory } = useGenerateStore();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  // Filter entries based on search
  const filtered = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesInput = entry.input.toLowerCase().includes(q);
    const matchesPosts = entry.variants.some(
      (v) => v.title.toLowerCase().includes(q) || v.text.toLowerCase().includes(q)
    );
    return matchesInput || matchesPosts;
  });

  // Group entries by day
  const grouped: Record<string, HistoryEntry[]> = {};
  for (const entry of filtered) {
    const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(entry);
  }

  const handleCopyEntry = async (e: React.MouseEvent, entry: HistoryEntry) => {
    e.stopPropagation();
    const post = entry.variants[entry.selectedIndex || 0] || entry.variants[0];
    if (!post) return;
    const text = formatWholePost(post, entry.network);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const handleOpenInDesk = (entry: HistoryEntry) => {
    loadFromHistory(entry);
    closeLedger();
  };

  const networkTag = (net: string) => {
    if (net === 'telegram') return 'TG';
    if (net === 'instagram') return 'IG';
    return 'YT';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="History Ledger"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(540px, 100vw)',
        backgroundColor: 'var(--paper)',
        borderLeft: '1px solid var(--rule)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Ledger Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--rule)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--ink)',
          }}>
            The Ledger
          </h2>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--ink-soft)',
          }}>
            ({filtered.length} entries)
          </span>
        </div>

        <button
          onClick={closeLedger}
          aria-label="Close ledger"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1rem',
            color: 'var(--ink)',
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <input
          type="search"
          placeholder="Search by keyword or topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 0',
            border: 'none',
            borderBottom: '1px solid var(--rule)',
            backgroundColor: 'transparent',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={exportJSON}
              disabled={entries.length === 0}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                color: 'var(--ink-soft)',
                cursor: entries.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Export JSON
            </button>
            <button
              onClick={exportCSV}
              disabled={entries.length === 0}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                color: 'var(--ink-soft)',
                cursor: entries.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              Export CSV
            </button>
          </div>

          {entries.length > 0 && (
            showClearConfirm ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>Clear all?</span>
                <button
                  onClick={() => {
                    clearAll();
                    setShowClearConfirm(false);
                  }}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--error)',
                    fontWeight: 600,
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6875rem',
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                }}
              >
                Clear ledger
              </button>
            )
          )}
        </div>
      </div>

      {/* Entries List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{
            padding: '48px 0',
            textAlign: 'center',
            color: 'var(--ink-soft)',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
          }}>
            No posts yet. Anything you write lands here.
          </div>
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '8px',
                borderBottom: '1px solid var(--rule)',
                paddingBottom: '4px',
              }}>
                {date}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {items.map((entry) => {
                  const post = entry.variants[entry.selectedIndex || 0] || entry.variants[0];
                  const isExpanded = expandedId === entry.id;
                  const isCopied = copiedId === entry.id;
                  const time = new Date(entry.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={entry.id}
                      onClick={() => toggleExpand(entry.id)}
                      style={{
                        padding: '12px 8px',
                        borderBottom: '1px solid var(--rule)',
                        backgroundColor: isCopied ? 'var(--highlight)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color var(--dur-fast) var(--ease-out)',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px',
                          overflow: 'hidden',
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.6875rem',
                            color: 'var(--ink-soft)',
                            whiteSpace: 'nowrap',
                          }}>
                            {time}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            border: '1px solid var(--rule)',
                            padding: '1px 4px',
                            borderRadius: '2px',
                          }}>
                            {networkTag(entry.network)}
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            color: 'var(--ink)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {post?.title || entry.input}
                          </span>
                        </div>

                        <button
                          onClick={(e) => handleCopyEntry(e, entry)}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            border: '1px solid var(--rule)',
                            borderRadius: '2px',
                            backgroundColor: 'transparent',
                            color: isCopied ? 'var(--accent)' : 'var(--ink)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {/* Expanded View */}
                      {isExpanded && post && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            marginTop: '12px',
                            padding: '16px',
                            backgroundColor: 'var(--paper-raised)',
                            border: '1px solid var(--rule)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.6875rem',
                              color: 'var(--ink-soft)',
                            }}>
                              BRIEF:
                            </span>
                            <p style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.875rem',
                              color: 'var(--ink-soft)',
                            }}>
                              {entry.input}
                            </p>
                          </div>

                          <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-line',
                            color: 'var(--ink)',
                          }}>
                            {post.text}
                          </div>

                          {post.cta && (
                            <p style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.875rem',
                              fontStyle: 'italic',
                              color: 'var(--ink)',
                            }}>
                              {post.cta}
                            </p>
                          )}

                          {post.hashtags.length > 0 && (
                            <div style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.75rem',
                              color: 'var(--ink)',
                            }}>
                              {post.hashtags.map(t => `#${t}`).join(' ')}
                            </div>
                          )}

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderTop: '1px solid var(--rule)',
                            paddingTop: '12px',
                            marginTop: '4px',
                          }}>
                            <button
                              onClick={() => handleOpenInDesk(entry)}
                              style={{
                                fontFamily: 'var(--font-ui)',
                                fontSize: '0.8125rem',
                                color: 'var(--accent)',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Open in Desk
                            </button>

                            {deleteConfirmId === entry.id ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>Delete entry?</span>
                                <button
                                  onClick={() => removeEntry(entry.id)}
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.75rem',
                                    color: 'var(--error)',
                                    fontWeight: 600,
                                  }}
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-soft)' }}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(entry.id)}
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.75rem',
                                  color: 'var(--ink-soft)',
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
