import type { CSSProperties, ReactNode } from 'react';
import {
  coverageStatus,
  hydrationStatus,
  maxCoveragePct,
  maxHydrationPct,
  planSummary,
  recoveryCarbs,
  type CoverageStatus,
} from '../domain/fuel';
import { t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { FAQ_HREF_FROM_CALCULATOR } from '../urls';
import { InfoPopover } from './ui/InfoPopover';

function fmt(n: number): string {
  return n.toFixed(0);
}

function FaqLink({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <a
      href={FAQ_HREF_FROM_CALCULATOR + slug + '/'}
      target="_blank"
      rel="noopener"
      style={{ color: 'inherit', textDecoration: 'underline' }}
    >
      {children}
    </a>
  );
}

/** Takes an already-decided status rather than a percentage: which thresholds apply differs
 *  between carbs and water (see `hydrationStatus`), and that decision belongs in the domain, not
 *  in a colour helper. Only the palette is this layout's own. */
function statusColor(status: CoverageStatus, goodColor: string): string {
  if (status === 'good') return goodColor;
  if (status === 'short') return '#B4552F';
  return '#D2703F';
}

const cardStyle: CSSProperties = {
  flex: '1 1 auto',
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: '14px 18px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 12,
};

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};
const titleStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};
const trackStyle: CSSProperties = {
  height: 10,
  borderRadius: 6,
  background: 'var(--border-soft)',
  overflow: 'hidden',
};
const footerRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: '4px 10px',
  fontSize: 12,
  color: 'var(--muted-2)',
};
const footerValueStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  color: 'var(--ink)',
};
const recoveryAnnotationStyle: CSSProperties = {
  color: 'var(--muted-2)',
};

export function SummaryCards() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const stops = useAppStore((s) => s.stops);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  const state = { route, mix, gear, fills, foods, foodLib, stops };
  const summary = planSummary(state);
  const carbColor = statusColor(coverageStatus(summary.coverage), 'var(--carb)');
  const hydColor = statusColor(hydrationStatus(summary.hydrationPct), 'var(--water)');
  const recovery = recoveryCarbs(route.weight);

  // Shown only when the plan actually lands on the physical ceiling (< 100, so it's a real
  // constraint) — not on the large majority of rides where the ceiling never binds, and not as a
  // consolation badge on an ordinary shortfall that's below the ceiling.
  const carbCeiling = maxCoveragePct(state);
  const atCarbCeiling = carbCeiling < 100 && summary.coverage === carbCeiling;
  const hydCeiling = maxHydrationPct(route);
  const atHydCeiling = hydCeiling < 100 && summary.hydrationPct === hydCeiling;
  const carbCeilingHint = (
    <>
      {strings.ceilingHintCarbsPre}
      <FaqLink slug="carb-transporter-mix">{strings.ceilingHintCarbsLink}</FaqLink>
      {strings.ceilingHintCarbsPost}
    </>
  );
  const hydCeilingHint = (
    <>
      {strings.ceilingHintHydrationPre}
      <FaqLink slug="hydration-water-per-hour">{strings.ceilingHintHydrationLink}</FaqLink>
      {strings.ceilingHintHydrationPost}
    </>
  );

  return (
    <div
      style={{
        // flexGrow 9999 (vs. RoutePanel's 1) means this absorbs virtually all leftover
        // row space, keeping RoutePanel pinned near 760px until this hits minWidth and wraps.
        // 443 is the card's natural single-line footer width (below it the recovery line
        // wraps to 2, then 3 cramped lines) — basis matches minWidth so the row wraps as
        // soon as that width is no longer available, instead of shrinking into that state.
        flex: '9999 1 443px',
        minWidth: 443,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={cardStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>{strings.coverage}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {atCarbCeiling && (
              <InfoPopover
                hint={carbCeilingHint}
                triggerStyle={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}
                popoverStyle={{ top: 'calc(100% + 6px)', right: 0 }}
              >
                {strings.ceilingLabel} {carbCeiling}% ⓘ
              </InfoPopover>
            )}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: carbColor,
              }}
            >
              {summary.coverage}%
            </span>
          </span>
        </div>
        <div style={trackStyle}>
          <div
            style={{
              width: `${Math.min(100, summary.coverage)}%`,
              height: '100%',
              background: carbColor,
              borderRadius: 6,
            }}
          />
        </div>
        <div style={footerRowStyle}>
          <span>
            {strings.needSum} <b style={footerValueStyle}>{fmt(summary.target)}g</b>{' '}
            <InfoPopover
              hint={strings.recoveryHint}
              triggerStyle={recoveryAnnotationStyle}
              popoverStyle={{ bottom: 'calc(100% + 6px)', left: 0 }}
            >
              ({strings.recoveryLabel}: ~{recovery.min}–{recovery.max}g ⓘ)
            </InfoPopover>
          </span>
          <span>
            {strings.planned}{' '}
            <b style={footerValueStyle}>
              {fmt(summary.totalCarbs)} g ({fmt(summary.totalCarbs * 4)} kcal)
            </b>
          </span>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={titleRowStyle}>
          <span style={titleStyle}>{strings.hydration}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {atHydCeiling && (
              <InfoPopover
                hint={hydCeilingHint}
                triggerStyle={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}
                popoverStyle={{ top: 'calc(100% + 6px)', right: 0 }}
              >
                {strings.ceilingLabel} {hydCeiling}% ⓘ
              </InfoPopover>
            )}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: hydColor,
              }}
            >
              {summary.hydrationPct}%
            </span>
          </span>
        </div>
        <div style={trackStyle}>
          <div
            style={{
              width: `${Math.min(100, summary.hydrationPct)}%`,
              height: '100%',
              background: hydColor,
              borderRadius: 6,
            }}
          />
        </div>
        <div style={footerRowStyle}>
          <span>
            {strings.sweatLoss} <b style={footerValueStyle}>{summary.sweatLoss} ml</b>
          </span>
          <span>
            {strings.tAbsorbed}{' '}
            <b style={footerValueStyle}>{Math.round(summary.fluidAbsorbedTotal)} ml</b>
          </span>
        </div>
      </div>
    </div>
  );
}
