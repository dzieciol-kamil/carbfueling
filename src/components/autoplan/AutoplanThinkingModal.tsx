import { useEffect, useState, type CSSProperties } from 'react';
import type { Sport } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { nextTextDelayMs, textPool, textQueue } from './thinkingTexts';

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  boxSizing: 'border-box',
};
const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(18,20,18,0.55)',
};
const cardStyle: CSSProperties = {
  position: 'relative',
  background: 'var(--surface)',
  color: 'var(--ink)',
  width: 360,
  maxWidth: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--chip-border)',
  borderRadius: 14,
  padding: '22px 20px 18px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  textAlign: 'center',
};
const spinnerStyle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: '3px solid var(--chip-border)',
  borderTopColor: 'var(--selected-bg)',
  boxSizing: 'border-box',
};

/**
 * The window shown while the worker keeps improving the plan. It only shows and rotates texts; the
 * worker, the plans it posts and when the window closes all belong to AutoplanFlow.
 */
export function AutoplanThinkingModal({
  lang,
  sport,
  onCancel,
}: {
  lang: Lang;
  sport: Sport;
  onCancel: () => void;
}) {
  const strings = t(lang);
  const [queue, setQueue] = useState(() => textQueue(textPool(strings, sport), Math.random));
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index + 1 < queue.length) {
        setIndex(index + 1);
      } else {
        // Pool exhausted: reshuffle, never opening the new round on the text just shown.
        setQueue(textQueue(textPool(t(lang), sport), Math.random, queue[index]));
        setIndex(0);
      }
    }, nextTextDelayMs(Math.random));
    return () => clearTimeout(timer);
    // Keyed on `lang`, not `strings`: t() builds a new object every render, and the parent
    // re-renders on every plan the worker posts — that would restart this timer each time.
  }, [index, queue, lang, sport]);

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="autoplan-thinking-title"
        style={cardStyle}
      >
        <div className="autoplan-thinking-spinner" style={spinnerStyle} aria-hidden="true" />
        <span id="autoplan-thinking-title" style={{ fontSize: 14, fontWeight: 700 }}>
          {strings.autoplanThinkingTitle}
        </span>
        <p
          aria-live="polite"
          style={{ margin: 0, fontSize: 13, lineHeight: 1.45, minHeight: '2.9em' }}
        >
          {queue[index]}
        </p>
        <button
          type="button"
          autoFocus
          onClick={onCancel}
          style={{
            border: '1px solid var(--chip-border)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Archivo, sans-serif',
            cursor: 'pointer',
          }}
        >
          {strings.autoplanThinkingCancel}
        </button>
      </div>
    </div>
  );
}
