import React, { useState } from 'react';
import { Variant, Network } from '../types';
import { PostBlock } from './PostBlock';
import { formatWholePost, copyToClipboard } from '../lib/clipboard';

interface VariantCardProps {
  variant: Variant;
  network: Network;
  onRewrite: (index: number) => void;
  onUpdatePost: (index: number, updated: Partial<Variant['post']>) => void;
  onToggleExcludeHashtag: (variantIndex: number, tag: string) => void;
}

export const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  network,
  onRewrite,
  onUpdatePost,
  onToggleExcludeHashtag,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showStamp, setShowStamp] = useState(false);
  const [copiedButtonState, setCopiedButtonState] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const { post, status, angle, error, excludedHashtags = [] } = variant;

  const handleCopyWholePost = async () => {
    const text = formatWholePost(post, network, excludedHashtags);
    if (!text) return;

    const ok = await copyToClipboard(text);
    if (ok) {
      setShowStamp(true);
      setCopiedButtonState(true);
      setTimeout(() => {
        setShowStamp(false);
      }, 1500);
      setTimeout(() => {
        setCopiedButtonState(false);
      }, 1500);
    }
  };

  const isStreaming = status === 'streaming';
  const isPending = status === 'pending';
  const isError = status === 'error';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: 'var(--paper-raised)',
        border: isError ? '1px solid var(--rule)' : '1px solid var(--rule)',
        borderLeft: isError ? '3px solid var(--error)' : '1px solid var(--rule)',
        borderRadius: '0px', // Paper has sharp corners
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: isHovered ? 'var(--shadow-lift)' : 'none',
        transition: 'box-shadow var(--dur-fast) var(--ease-out)',
      }}
    >
      {/* Stamp animation on copy */}
      {showStamp && (
        <div className="approval-stamp" aria-hidden="true">
          COPIED
        </div>
      )}

      {/* Proof Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        borderBottom: '1px solid var(--rule)',
        paddingBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '0.05em',
          }}>
            Proof {variant.index + 1}
          </span>
          {angle && (
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--ink-soft)',
              fontStyle: 'italic',
            }}>
              — {angle}
            </span>
          )}
        </div>

        {isStreaming && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem',
            color: 'var(--accent)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}>
            Writing...
          </span>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div style={{ padding: '16px 0' }}>
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.9375rem',
            color: 'var(--error)',
            marginBottom: '12px',
          }}>
            {error || "That didn't go through. Try again, or shorten the brief."}
          </p>
          <button
            onClick={() => onRewrite(variant.index)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8125rem',
              color: 'var(--ink)',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Waiting / Pending skeleton state */}
      {isPending && !isError && (
        <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ height: '14px', width: '60%', backgroundColor: 'var(--rule)', opacity: 0.5 }} />
          <div style={{ height: '12px', width: '90%', backgroundColor: 'var(--rule)', opacity: 0.3 }} />
          <div style={{ height: '12px', width: '80%', backgroundColor: 'var(--rule)', opacity: 0.3 }} />
          <div style={{ height: '12px', width: '70%', backgroundColor: 'var(--rule)', opacity: 0.3 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.875rem', color: 'var(--ink-soft)' }}>
              Drafting variant...
            </span>
            <span className="ink-caret" />
          </div>
        </div>
      )}

      {/* Content blocks */}
      {(!isPending || isStreaming) && !isError && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* TITLE Block */}
          <PostBlock
            label="TITLE"
            isEditable={isEditing}
            onEditChange={(val) => onUpdatePost(variant.index, { title: val })}
            rawTextToCopy={() => post.title}
            content={
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.375rem',
                fontWeight: 600,
                lineHeight: 1.3,
                color: 'var(--ink)',
              }}>
                {post.title}
                {isStreaming && !post.text && <span className="ink-caret" />}
              </h2>
            }
          />

          <div style={{ borderTop: '1px dotted var(--rule)' }} />

          {/* TEXT Block */}
          <PostBlock
            label="TEXT"
            isEditable={isEditing}
            onEditChange={(val) => onUpdatePost(variant.index, { text: val })}
            rawTextToCopy={() => post.text}
            content={
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                color: 'var(--ink)',
                whiteSpace: 'pre-line',
                maxWidth: '60ch',
              }}>
                {post.text}
                {isStreaming && post.text && !post.cta && <span className="ink-caret" />}
              </div>
            }
          />

          <div style={{ borderTop: '1px dotted var(--rule)' }} />

          {/* CTA Block */}
          <PostBlock
            label="CTA"
            isEditable={isEditing}
            onEditChange={(val) => onUpdatePost(variant.index, { cta: val })}
            rawTextToCopy={() => post.cta}
            content={
              <p style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.9375rem',
                fontWeight: 500,
                fontStyle: 'italic',
                color: 'var(--ink)',
              }}>
                {post.cta}
                {isStreaming && post.cta && post.hashtags.length === 0 && <span className="ink-caret" />}
              </p>
            }
          />

          <div style={{ borderTop: '1px dotted var(--rule)' }} />

          {/* TAGS Block */}
          <PostBlock
            label="TAGS"
            rawTextToCopy={() =>
              post.hashtags
                .filter(t => !excludedHashtags.includes(t))
                .map(t => `#${t}`)
                .join(' ')
            }
            content={
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {post.hashtags.length === 0 && isStreaming && (
                  <span className="ink-caret" />
                )}
                {post.hashtags.map((tag) => {
                  const isExcluded = excludedHashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleExcludeHashtag(variant.index, tag)}
                      title={isExcluded ? 'Click to re-include tag' : 'Click to exclude tag'}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8125rem',
                        color: isExcluded ? 'var(--ink-soft)' : 'var(--ink)',
                        textDecoration: isExcluded ? 'line-through' : 'none',
                        opacity: isExcluded ? 0.5 : 1,
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '2px',
                        transition: 'opacity var(--dur-fast) var(--ease-out)',
                      }}
                    >
                      <span style={{ color: 'var(--accent)' }}>#</span>
                      {tag}
                    </button>
                  );
                })}
              </div>
            }
          />
        </div>
      )}

      {/* Footer Actions */}
      {!isPending && !isError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--rule)',
          paddingTop: '16px',
          marginTop: 'auto',
        }}>
          <button
            onClick={handleCopyWholePost}
            style={{
              backgroundColor: 'var(--ink)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: '2px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color var(--dur-fast) var(--ease-out)',
            }}
          >
            <span>{copiedButtonState ? 'Copied' : 'Copy post'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--ink-soft)',
                borderBottom: isEditing ? '1px solid var(--ink)' : 'none',
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Done editing' : 'Edit'}
            </button>

            <button
              onClick={() => onRewrite(variant.index)}
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.8125rem',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
              }}
            >
              Rewrite this one
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
