import React, { useState } from 'react';
import { CopyButton } from './CopyButton';

interface PostBlockProps {
  label: 'TITLE' | 'TEXT' | 'CTA' | 'TAGS';
  content: string | React.ReactNode;
  rawTextToCopy?: () => string;
  isEditable?: boolean;
  onEditChange?: (val: string) => void;
  style?: React.CSSProperties;
}

export const PostBlock: React.FC<PostBlockProps> = ({
  label,
  content,
  rawTextToCopy,
  isEditable = false,
  onEditChange,
  style,
}) => {
  const [flash, setFlash] = useState(false);

  const handleCopied = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
  };

  return (
    <div
      style={{
        position: 'relative',
        padding: '12px 0',
        backgroundColor: flash ? 'var(--highlight)' : 'transparent',
        transition: 'background-color 400ms var(--ease-out)',
        ...style,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          fontWeight: 600,
          color: 'var(--ink-soft)',
        }}>
          {label}
        </span>

        {rawTextToCopy && !isEditable && (
          <CopyButton
            textToCopy={rawTextToCopy}
            label="Copy"
            copiedLabel="Copied"
            onCopied={handleCopied}
          />
        )}
      </div>

      <div>
        {isEditable ? (
          typeof content === 'string' && label === 'TEXT' ? (
            <textarea
              value={content}
              onChange={(e) => onEditChange?.(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                padding: '8px',
                border: 'none',
                borderBottom: '2px solid var(--ink)',
                backgroundColor: 'transparent',
                fontFamily: 'var(--font-display)',
                fontSize: '1.0625rem',
                lineHeight: 1.6,
                color: 'var(--ink)',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          ) : (
            <input
              type="text"
              value={typeof content === 'string' ? content : ''}
              onChange={(e) => onEditChange?.(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                borderBottom: '2px solid var(--ink)',
                backgroundColor: 'transparent',
                fontFamily: label === 'TITLE' ? 'var(--font-display)' : 'var(--font-ui)',
                fontSize: label === 'TITLE' ? '1.25rem' : '1rem',
                fontWeight: label === 'TITLE' ? 600 : 400,
                color: 'var(--ink)',
                outline: 'none',
              }}
            />
          )
        ) : (
          content
        )}
      </div>
    </div>
  );
};
