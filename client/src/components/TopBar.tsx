import React, { useEffect, useState } from 'react';
import { useHistoryStore } from '../features/history/useHistoryStore';

type Theme = 'light' | 'dark' | 'system';

export const TopBar: React.FC = () => {
  const { toggleLedger, entries } = useHistoryStore();
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme_preference') as Theme) || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('theme_preference', theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const themeLabel = theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark';

  return (
    <header style={{
      height: '56px',
      borderBottom: '1px solid var(--rule)',
      backgroundColor: 'var(--paper)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.25rem',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
        }}>
          The Editor's Desk
        </h1>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--ink-soft)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Social Generator
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleLedger}
          aria-label="Open history ledger"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--ink)',
            padding: '6px 12px',
            border: '1px solid var(--rule)',
            borderRadius: '2px',
            backgroundColor: 'var(--paper-raised)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color var(--dur-fast) var(--ease-out)',
          }}
        >
          <span>Ledger</span>
          {entries.length > 0 && (
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              backgroundColor: 'var(--rule)',
              color: 'var(--ink)',
              padding: '1px 6px',
              borderRadius: '999px',
            }}>
              {entries.length}
            </span>
          )}
        </button>

        <button
          onClick={cycleTheme}
          aria-label={`Current theme: ${themeLabel}. Click to change.`}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--ink-soft)',
            padding: '6px 10px',
            border: '1px solid var(--rule)',
            borderRadius: '2px',
            backgroundColor: 'transparent',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {themeLabel}
        </button>
      </div>
    </header>
  );
};
