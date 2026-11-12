import React, { useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { InputPanel } from './components/InputPanel';
import { VariantCard } from './components/VariantCard';
import { HistoryList } from './components/HistoryList';
import { useGenerateStore } from './features/generate/useGenerateStore';
import { useHistoryStore } from './features/history/useHistoryStore';

export const App: React.FC = () => {
  const {
    variants,
    network,
    status,
    regenerateSingleVariant,
    updateVariantPost,
    toggleExcludeHashtag,
  } = useGenerateStore();

  const { loadHistory } = useHistoryStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const hasVariants = variants.length > 0;
  const isGenerating = status === 'generating';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--paper)',
    }}>
      <TopBar />

      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px 64px 24px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '48px',
          alignItems: 'start',
        }}>
          {/* Left Column: Brief Card (Sticky on desktop) */}
          <section
            aria-label="Brief input"
            style={{
              position: 'sticky',
              top: '80px',
              backgroundColor: 'transparent',
            }}
          >
            <InputPanel />
          </section>

          {/* Right Column: Proofs (Generated Variants) */}
          <section
            aria-label="Generated proof sheets"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--rule)',
              paddingBottom: '8px',
            }}>
              <h2 style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                letterSpacing: '0.08em',
                fontWeight: 600,
                color: 'var(--ink-soft)',
                textTransform: 'uppercase',
              }}>
                Proof Sheets {hasVariants && `(${variants.length})`}
              </h2>

              {isGenerating && (
                <span style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8125rem',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  Drafting {variants.length} angles...
                </span>
              )}
            </div>

            {!hasVariants ? (
              <div style={{
                padding: '64px 24px',
                border: '1px dashed var(--rule)',
                borderRadius: '2px',
                textAlign: 'center',
                backgroundColor: 'var(--paper-raised)',
              }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontStyle: 'italic',
                  color: 'var(--ink-soft)',
                  maxWidth: '38ch',
                  margin: '0 auto',
                  lineHeight: 1.5,
                }}>
                  Nothing on the desk yet. Describe your idea and pick a network.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}>
                {variants.map((v) => (
                  <VariantCard
                    key={v.id}
                    variant={v}
                    network={network}
                    onRewrite={regenerateSingleVariant}
                    onUpdatePost={updateVariantPost}
                    onToggleExcludeHashtag={toggleExcludeHashtag}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Slide-over Ledger */}
      <HistoryList />
    </div>
  );
};

export default App;
