import type { CSSProperties } from 'react';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { tourGhostBtn, tourPrimaryBtn } from './tourStyles';

/**
 * Shown while the tour's sample plan stands in for the rider's own (plan 2.2), so it is never
 * mistaken for theirs, and so "Restore my plan" is still there after Skip or "Keep exploring".
 */
export function SampleBar({ style }: { style?: CSSProperties }) {
  const active = useAppStore((s) => s.preTourDoc !== null && s.ui.tourStep === null);
  const lang = useAppStore((s) => s.ui.lang);
  const restorePreTourPlan = useAppStore((s) => s.restorePreTourPlan);
  const dismissSample = useAppStore((s) => s.dismissSample);
  if (!active) return null;
  const strings = t(lang);

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        padding: '9px 12px',
        borderRadius: 12,
        background: 'var(--status-partial-bg)',
        border: '1px solid var(--border)',
        fontSize: 12.5,
        fontWeight: 600,
        ...style,
      }}
    >
      <span>{strings.sampleBarText}</span>
      <span style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={dismissSample} style={tourGhostBtn}>
          {strings.sampleBarKeep}
        </button>
        <button type="button" onClick={restorePreTourPlan} style={tourPrimaryBtn}>
          {strings.tourRestore}
        </button>
      </span>
    </div>
  );
}
