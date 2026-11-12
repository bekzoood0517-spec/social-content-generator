import React, { useState } from 'react';
import { copyToClipboard } from '../lib/clipboard';

interface CopyButtonProps {
  textToCopy: () => string;
  label?: string;
  copiedLabel?: string;
  onCopied?: () => void;
  style?: React.CSSProperties;
  className?: string;
  variant?: 'primary' | 'subtle';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = 'Copy',
  copiedLabel = 'Copied',
  onCopied,
  style,
  className,
  variant = 'subtle',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = textToCopy();
    if (!text) return;

    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const isPrimary = variant === 'primary';

  return (
    <>
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : label}
        className={className}
        style={{
          fontFamily: isPrimary ? 'var(--font-ui)' : 'var(--font-mono)',
          fontSize: isPrimary ? '0.875rem' : '0.75rem',
          fontWeight: isPrimary ? 600 : 500,
          padding: isPrimary ? '8px 16px' : '4px 8px',
          borderRadius: '2px',
          border: isPrimary ? 'none' : '1px solid var(--rule)',
          backgroundColor: isPrimary ? 'var(--ink)' : 'transparent',
          color: isPrimary ? 'var(--paper)' : (copied ? 'var(--accent)' : 'var(--ink-soft)'),
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all var(--dur-fast) var(--ease-out)',
          ...style,
        }}
      >
        <span>{copied ? copiedLabel : label}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Content copied to clipboard' : ''}
      </span>
    </>
  );
};
