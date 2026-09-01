import type { CSSProperties } from 'react';
import {
  coverageStatus,
  hydrationStatus,
  planSummary,
  recoveryCarbs,
  type CoverageStatus,
} from '../domain/fuel';
import { t } from '../i18n/strings';
import { useAppStore } from '../store/appStore';
import { FAQ_HREF_FROM_CALCULATOR } from '../urls';
import { InfoPopover } from './ui/InfoPopover';
import { fmtWaterBalance } from './ui/waterBalance';

function fmt(n: number): string {
  return n.toFixed(0);
}

/** Takes an already-decided status rather than a percentage: which thresholds apply differs
 *  between carbs and water (see `hydrationStatus`), and that decision belongs in the domain, not
 *  in a colour helper. Only the palette is this layout's own. */
function statusColor(status: CoverageStatus, goodColor: string): string {
  if (status === 'good') return goodColor;
  // Deeper and cooler than the "short" brick on purpose: both ends of the water scale are bad,
  // but they are not the same problem, and the number next to the bar says which one it is.
  if (status === 'over') return '#8C2F39';
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
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  const summary = planSummary({ route, mix, gear, fills, foods, foodLib });
  const carbColor = statusColor(coverageStatus(summary.coverage), 'var(--carb)');
  // Colour and parenthetical come from the same number on purpose: the bar's headline percentage
  // is capped by absorption and can sit at 99 on a plan that pours nearly twice its sweat loss,
  // so without the balance next to it a maroon bar at 99% would be unreadable.
  const hydColor = statusColor(
    hydrationStatus(summary.waterBalancePct, route.temp),
    'var(--water)',
  );
  const recovery = recoveryCarbs(route.weight);

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
            {strings.sweatLoss} <b style={footerValueStyle}>{summary.sweatLoss} ml</b>{' '}
            <b style={{ ...footerValueStyle, color: hydColor }}>
              ({fmtWaterBalance(summary.waterBalancePct, lang)})
            </b>{' '}
            <InfoPopover
              ariaLabel={strings.waterBalanceAria}
              hint={
                <>
                  {strings.waterBalanceHint}{' '}
                  <a
                    href={FAQ_HREF_FROM_CALCULATOR + 'hydration-water-per-hour/'}
                    target="_blank"
                    rel="noopener"
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {strings.waterBalanceHintLink}
                  </a>
                </>
              }
              popoverStyle={{ bottom: 'calc(100% + 6px)', left: 0 }}
            >
              ⓘ
            </InfoPopover>
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
