import React, { useRef } from 'react';
import { Network } from '../types';

interface NetworkPickerProps {
  value: Network;
  onChange: (network: Network) => void;
  disabled?: boolean;
}

const NETWORKS: Array<{
  id: Network;
  tag: string;
  name: string;
  desc: string;
}> = [
  {
    id: 'telegram',
    tag: 'TG',
    name: 'Telegram',
    desc: 'Short, direct, link-friendly',
  },
  {
    id: 'instagram',
    tag: 'IG',
    name: 'Instagram',
    desc: 'Visual hook, rhythmic captions',
  },
  {
    id: 'youtube',
    tag: 'YT',
    name: 'YouTube',
    desc: 'Keyword title & timestamps',
  },
];

export const NetworkPicker: React.FC<NetworkPickerProps> = ({ value, onChange, disabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % NETWORKS.length;
      onChange(NETWORKS[nextIndex].id);
      focusIndex(nextIndex);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + NETWORKS.length) % NETWORKS.length;
      onChange(NETWORKS[prevIndex].id);
      focusIndex(prevIndex);
    }
  };

  const focusIndex = (index: number) => {
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('button[role="radio"]');
    if (buttons && buttons[index]) {
      buttons[index].focus();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--ink)',
      }}>
        Social network
      </label>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="Choose social network"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        {NETWORKS.map((net, idx) => {
          const isSelected = value === net.id;
          return (
            <button
              key={net.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(net.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '12px 14px',
                border: isSelected ? '1px solid var(--ink)' : '1px solid var(--rule)',
                borderRadius: '2px',
                backgroundColor: isSelected ? 'var(--ink)' : 'var(--paper-raised)',
                color: isSelected ? 'var(--paper)' : 'var(--ink)',
                textAlign: 'left',
                transition: 'background-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    padding: '2px 5px',
                    border: isSelected ? '1px solid var(--paper)' : '1px solid var(--rule)',
                    borderRadius: '2px',
                    backgroundColor: isSelected ? 'transparent' : 'var(--paper)',
                    color: isSelected ? 'var(--paper)' : 'var(--ink)',
                  }}
                >
                  {net.tag}
                </span>
                <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                }}>
                  {net.name}
                </span>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  color: isSelected ? 'var(--paper)' : 'var(--ink-soft)',
                  lineHeight: 1.3,
                  marginTop: '2px',
                }}
              >
                {net.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
