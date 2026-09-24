import { useEffect, type CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { planHistory } from '../../store/planHistory';

/** Two arrows bending back on themselves — the same viewBox/stroke idiom as the Planning row's
 *  other icons (planIcons.tsx, ShareIcon). */
function ArrowIcon({ redo }: { redo?: boolean }) {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={redo ? { transform: 'scaleX(-1)' } : undefined}
    >
      <path d="M8 5 L4 9 L8 13" />
      <path d="M4 9 H13 A5 5 0 0 1 13 19 H9" />
    </svg>
  );
}

/**
 * Undo and redo, as one quiet pair: the same border and muted grey as the chips around it, so it
 * sits in the row rather than asking for attention, and a spent side simply fades.
 */
export function UndoRedo({ variant }: { variant: 'desktop' | 'mobile' }) {
  const strings = t(useAppStore((s) => s.ui.lang));
  const canUndo = planHistory.status((s) => s.canUndo);
  const canRedo = planHistory.status((s) => s.canRedo);
  const desktop = variant === 'desktop';

  const box: CSSProperties = {
    display: 'flex',
    border: '1px solid var(--chip-border)',
    borderRadius: desktop ? 999 : 8,
    background: 'var(--surface)',
    overflow: 'hidden',
    flexShrink: 0,
    // On the desktop row it takes the height of the buttons beside it.
    ...(desktop ? { alignSelf: 'stretch' } : { height: 30 }),
  };
  const side = (enabled: boolean, divider: boolean): CSSProperties => ({
    width: desktop ? 34 : 30,
    padding: 0,
    border: 'none',
    borderLeft: divider ? '1px solid var(--chip-border)' : 'none',
    background: 'transparent',
    color: 'var(--muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.35,
  });

  return (
    <div style={box}>
      <button
        type="button"
        onClick={planHistory.undo}
        disabled={!canUndo}
        title={strings.undoButton}
        aria-label={strings.undoButton}
        style={side(canUndo, false)}
      >
        <ArrowIcon />
      </button>
      <button
        type="button"
        onClick={planHistory.redo}
        disabled={!canRedo}
        title={strings.redoButton}
        aria-label={strings.redoButton}
        style={side(canRedo, true)}
      >
        <ArrowIcon redo />
      </button>
    </div>
  );
}

/** Ctrl/⌘+Z undoes, Ctrl/⌘+Shift+Z and Ctrl+Y redo — except in a text field, whose own undo is
 *  the one the rider means there, and while the stop sheet or the tour is open: both hold the id
 *  of something in the plan (the stop being edited, the tour's demo fill) that an undo could
 *  take away. The panels read the plan live, so undoing under them is fine. */
export function usePlanHistoryKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const ui = useAppStore.getState().ui;
      if (ui.shopSheet !== null || ui.tourStep !== null) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) planHistory.redo();
        else planHistory.undo();
      } else if (key === 'y' && e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        planHistory.redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
