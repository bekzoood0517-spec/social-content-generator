import React, { useEffect } from 'react';
import { useGenerateStore } from '../features/generate/useGenerateStore';
import { useSuggestStore } from '../features/suggest/useSuggestStore';
import { NetworkPicker } from './NetworkPicker';
import { Tone } from '../types';

const TONES: Array<{ id: Tone; label: string }> = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'expert', label: 'Expert' },
  { id: 'bold', label: 'Bold' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский (Russian)' },
  { code: 'uz', label: 'Oʻzbekcha (Uzbek)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'fr', label: 'Français (French)' },
];

export const InputPanel: React.FC = () => {
  const {
    input,
    network,
    tone,
    language,
    variantsCount,
    selectedAngles,
    status,
    globalError,
    setInput,
    setNetwork,
    setTone,
    setLanguage,
    setVariantsCount,
    toggleAngle,
    startGeneration,
    stopGeneration,
  } = useGenerateStore();

  const { angles, isLoading: isSuggesting, fetchSuggestions } = useSuggestStore();

  // Pre-generation angle suggestions debounced on typing
  useEffect(() => {
    fetchSuggestions(input, network, language);
  }, [input, network, language, fetchSuggestions]);

  const isGenerating = status === 'generating';
  const charCount = input.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) {
      stopGeneration();
    } else {
      startGeneration();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      <div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 3.5vw, 3.25rem)',
          fontWeight: 500,
          letterSpacing: '-0.02em',
          lineHeight: 1.15,
          color: 'var(--ink)',
          marginBottom: '8px',
        }}>
          What are we posting about?
        </h2>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          color: 'var(--ink-soft)',
        }}>
          Describe the craft, drop, or insight. We'll set the proofs in type.
        </p>
      </div>

      {/* Main Textarea */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label
          htmlFor="topic-input"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--ink)',
          }}
        >
          Brief description
        </label>

        <div style={{
          position: 'relative',
          backgroundColor: 'var(--paper-raised)',
          border: '1px solid var(--rule)',
          borderRadius: '2px',
        }}>
          <textarea
            id="topic-input"
            rows={5}
            maxLength={1000}
            disabled={isGenerating}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="A small bakery in Tashkent launching a Friday sourdough drop."
            className="ruled-paper"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              fontFamily: 'var(--font-display)',
              fontSize: '1.125rem',
              color: 'var(--ink)',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '6px 12px',
            borderTop: '1px solid var(--rule)',
            backgroundColor: 'var(--paper)',
          }}>
            <span className="mono tabular" style={{
              fontSize: '0.75rem',
              color: charCount > 950 ? 'var(--error)' : 'var(--ink-soft)',
            }}>
              {charCount} / 1000
            </span>
          </div>
        </div>

        {globalError && (
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--error)',
            marginTop: '2px',
          }}>
            {globalError}
          </p>
        )}
      </div>

      {/* Pre-generation Angle Chips */}
      {(angles.length > 0 || isSuggesting) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              fontWeight: 600,
              color: 'var(--ink-soft)',
              textTransform: 'uppercase',
            }}>
              Angles worth trying
            </span>
            {isSuggesting && (
              <span className="ink-caret" />
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {angles.map((angle) => {
              const isSelected = selectedAngles.includes(angle);
              return (
                <button
                  key={angle}
                  type="button"
                  onClick={() => toggleAngle(angle)}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    padding: '6px 10px',
                    border: '1px solid var(--rule)',
                    borderRadius: '2px',
                    backgroundColor: isSelected ? 'var(--rule)' : 'var(--paper-raised)',
                    borderBottom: isSelected ? '2px solid var(--ink)' : '1px solid var(--rule)',
                    color: 'var(--ink)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}
                >
                  {angle}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Social Network Picker */}
      <NetworkPicker
        value={network}
        onChange={setNetwork}
        disabled={isGenerating}
      />

      {/* Tone & Language & Variants in Row/Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        {/* Tone Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--ink)',
          }}>
            Tone
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            border: '1px solid var(--rule)',
            borderRadius: '2px',
            backgroundColor: 'var(--paper-raised)',
            padding: '2px',
          }}>
            {TONES.map(t => {
              const isSelected = tone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setTone(t.id)}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.8125rem',
                    padding: '6px 4px',
                    border: 'none',
                    borderRadius: '2px',
                    backgroundColor: isSelected ? 'var(--ink)' : 'transparent',
                    color: isSelected ? 'var(--paper)' : 'var(--ink)',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="language-select" style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--ink)',
          }}>
            Output language
          </label>
          <select
            id="language-select"
            value={language}
            disabled={isGenerating}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid var(--rule)',
              borderRadius: '2px',
              backgroundColor: 'var(--paper-raised)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              outline: 'none',
              cursor: 'pointer',
              height: '38px',
            }}
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Variants count selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.875rem',
          color: 'var(--ink)',
          fontWeight: 500,
        }}>
          Number of proof variants
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {([1, 2, 3, 4] as const).map(count => (
            <button
              key={count}
              type="button"
              disabled={isGenerating}
              onClick={() => setVariantsCount(count)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                width: '32px',
                height: '32px',
                border: variantsCount === count ? '1px solid var(--ink)' : '1px solid var(--rule)',
                backgroundColor: variantsCount === count ? 'var(--ink)' : 'var(--paper-raised)',
                color: variantsCount === count ? 'var(--paper)' : 'var(--ink)',
                borderRadius: '2px',
                cursor: 'pointer',
              }}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Generate / Stop Button */}
      <button
        type="submit"
        disabled={!isGenerating && charCount < 5}
        style={{
          height: '48px',
          borderRadius: '2px',
          border: isGenerating ? '1px solid var(--ink)' : 'none',
          backgroundColor: isGenerating ? 'transparent' : 'var(--accent)',
          color: isGenerating ? 'var(--ink)' : 'var(--accent-ink)',
          fontFamily: 'var(--font-ui)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: (!isGenerating && charCount < 5) ? 'not-allowed' : 'pointer',
          opacity: (!isGenerating && charCount < 5) ? 0.6 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginTop: '8px',
          transition: 'transform var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out)',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(1px)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>{isGenerating ? 'Stop drafting' : 'Write the posts'}</span>
        {isGenerating && <span className="ink-caret" />}
      </button>
    </form>
  );
};
