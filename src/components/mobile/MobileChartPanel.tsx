import type { CSSProperties } from 'react';
import { dist, fmtX } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore, type YMode } from '../../store/appStore';
import { PrintIcon } from '../print/PrintIcon';
import { SegmentedControl } from '../ui/SegmentedControl';
import { MobileChart } from './MobileChart';
import { MobileLaneStrip } from './MobileLaneStrip';

const Y_MODES: { mode: YMode; label: string }[] = [
  { mode: 'rate', label: 'g/h' },
  { mode: 'fluid', label: 'ml/h' },
];

/** The icon chips sitting to the left of the km/hours switch: print, and the GPX peek toggle.
 *  `active` is the toggle's on-state — an inverted fill, which is what tells the rider the peek
 *  is on. Print is never active; it just borrows the box so the two read as one pair. */
function chipButtonStyle(active: boolean): CSSProperties {
  return {
    width: 34,
    height: 30,
    borderRadius: 8,
    border: '1px solid var(--chip-border)',
    background: active ? 'var(--ink)' : '#fff',
    color: active ? '#fff' : 'var(--muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };
}

export function MobileChartPanel() {
  const route = useAppStore((s) => s.route);
  const yMode = useAppStore((s) => s.ui.yMode);
  const setYMode = useAppStore((s) => s.setYMode);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const setXUnit = useAppStore((s) => s.setXUnit);
  const gpxPeek = useAppStore((s) => s.ui.gpxPeek);
  const toggleGpxPeek = useAppStore((s) => s.toggleGpxPeek);
  const lang = useAppStore((s) => s.ui.lang);
  const openChartHelp = useAppStore((s) => s.openChartHelp);
  const strings = t(lang);

  const distanceKm = dist(route);
  const showEye = !!route.gpxTrack && route.useGpx;
  const profileMode = gpxPeek && showEye;

  const narration = profileMode
    ? strings.narrationProfile
    : yMode === 'fluid'
      ? strings.narrationFluid
      : strings.narrationRate;

  const axisPoints = [0, distanceKm / 3, (distanceKm * 2) / 3, distanceKm];

  return (
    <>
      <div
        style={{
          background: '#fff',
          padding: '11px 14px 9px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
        >
          <SegmentedControl
            options={Y_MODES.map(({ mode, label }) => ({ value: mode, label }))}
            value={yMode}
            onChange={setYMode}
            fullWidth={false}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => window.print()}
              title={strings.printPlanButton}
              aria-label={strings.printPlanButton}
              style={chipButtonStyle(false)}
            >
              {/* A denser glyph than the eye's open outline, so it needs to run smaller to read
                  at the same weight beside it. */}
              <PrintIcon size={14} />
            </button>
            {showEye && (
              <button
                type="button"
                onClick={toggleGpxPeek}
                aria-label="gpx"
                style={chipButtonStyle(gpxPeek)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 22 22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.9}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 11 C2 11 6 5 11 5 C16 5 20 11 20 11 C20 11 16 17 11 17 C6 17 2 11 2 11 Z" />
                  <circle cx="11" cy="11" r="3" />
                </svg>
              </button>
            )}
            <SegmentedControl
              options={[
                { value: 'km' as const, label: 'km' },
                { value: 'h' as const, label: strings.axisTime },
              ]}
              value={xUnit}
              onChange={setXUnit}
              fullWidth={false}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <button
            type="button"
            onClick={openChartHelp}
            title={strings.chartHelpBtnLabel}
            aria-label={strings.chartHelpBtnLabel}
            aria-hidden={profileMode}
            tabIndex={profileMode ? -1 : undefined}
            style={{
              flexShrink: 0,
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--muted)',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              cursor: 'pointer',
              opacity: profileMode ? 0 : 1,
              pointerEvents: profileMode ? 'none' : 'auto',
            }}
          >
            ?
          </button>
          <p style={{ margin: 0, fontSize: 11, lineHeight: 1.45, color: 'var(--muted)', flex: 1 }}>
            {narration}
          </p>
        </div>
      </div>

      <div
        data-mobile-sticky
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: '#fff',
          borderBottom: '1px solid var(--border-soft)',
          padding: '0 14px 9px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div data-tour="chart">
          <MobileChart />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: 'var(--muted)',
          }}
        >
          {axisPoints.map((km, i) => (
            <span key={i}>{fmtX(km, i === axisPoints.length - 1, route, xUnit)}</span>
          ))}
        </div>

        <MobileLaneStrip />
      </div>
    </>
  );
}
