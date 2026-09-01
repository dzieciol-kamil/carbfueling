import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { gaps } from '../../domain/dragMath';
import {
  coverageStatus,
  dist,
  hydrationStatus,
  planSummary,
  recoveryCarbs,
  type CoverageStatus,
} from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { InfoPopover } from '../ui/InfoPopover';
import { MobilePlanCard, type PlanCardItem } from './MobilePlanCard';

function selKeyFor(item: PlanCardItem): string {
  return item.kind === 'fill'
    ? 'f' + item.fid
    : item.kind === 'shop'
      ? 's' + item.id
      : 'x' + item.id;
}

/** Mobile's own tints for the status tiers. The palette is shared between the carb and
 *  water cards; the *thresholds* deliberately are not — carbs go through `coverageStatus` and
 *  water through the stricter `hydrationStatus`, the same two calls the desktop cards make. What
 *  must never come back is this screen picking its own numbers, which is how it ended up grading
 *  hydration on an uncalibrated `>= 70` that disagreed with desktop. */
const COVERAGE_TINT: Record<CoverageStatus, { bg: string; fg: string }> = {
  good: { bg: '#E7F2E1', fg: '#3D7A26' },
  partial: { bg: '#FBEAE1', fg: '#A3512A' },
  short: { bg: '#F8DED5', fg: '#8F3D1F' },
  // Water-only, and only above 100% — see HYDRATION_OVER_PCT.
  over: { bg: '#F6DBE0', fg: '#8C2F39' },
};

function coverageCardStyle(status: CoverageStatus): CSSProperties {
  return {
    flex: 1,
    borderRadius: 13,
    padding: '11px 12px',
    background: COVERAGE_TINT[status].bg,
  };
}

export function MobilePlanList() {
  const lang = useAppStore((s) => s.ui.lang);
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const shops = useAppStore((s) => s.shops);
  const selKey = useAppStore((s) => s.ui.selKey);
  const tourDemoFid = useAppStore((s) => s.ui.tourDemoFid);
  const selectedElRef = useRef<HTMLDivElement | null>(null);
  const prevContentTopRef = useRef<number | null>(null);
  const prevSelKeyRef = useRef<string | null>(null);
  const addFillInGap = useAppStore((s) => s.addFillInGap);
  const addFoodFromLibrary = useAppStore((s) => s.addFoodFromLibrary);
  const openShopSheet = useAppStore((s) => s.openShopSheet);
  const openMixSheet = useAppStore((s) => s.openMixSheet);
  const strings = t(lang);

  const summary = planSummary({ route, mix, gear, fills, foods, foodLib });
  const distanceKm = dist(route);

  // Both figures come straight from planSummary — this screen used to divide absorbedTotal by
  // target itself and band it at 90-115%, which is why the same plan read 23% here and 31% on
  // the desktop cards. One engine, one threshold scale, two palettes.
  const carbPct = summary.coverage;
  const carbStatus = coverageStatus(carbPct);
  const carbTint = COVERAGE_TINT[carbStatus];
  const hydPct = summary.hydrationPct;
  // hydrationStatus, not coverageStatus: water is graded on stricter thresholds than carbs, and
  // this screen used to apply its own uncalibrated `>= 70` on top of that.
  const hydStatus = hydrationStatus(hydPct);
  const hydTint = COVERAGE_TINT[hydStatus];
  const recovery = recoveryCarbs(route.weight);
  const demoVesselGid = fills.find((f) => f.fid === tourDemoFid)?.gid;

  const items: PlanCardItem[] = [
    ...fills.map((f): PlanCardItem => ({ kind: 'fill', fid: f.fid })),
    ...foods.map((f): PlanCardItem => ({ kind: 'food', id: f.id })),
    ...shops.map((s): PlanCardItem => ({ kind: 'shop', id: s.id })),
  ].sort((a, b) => {
    const fromOf = (item: PlanCardItem) =>
      item.kind === 'fill'
        ? (fills.find((f) => f.fid === item.fid)?.from ?? 0)
        : item.kind === 'shop'
          ? (shops.find((s) => s.id === item.id)?.at ?? 0)
          : (foods.find((f) => f.id === item.id)?.from ?? 0);
    return fromOf(a) - fromOf(b);
  });

  // The list re-sorts live as "from" changes, so the card being edited can move up or
  // down among its siblings mid-interaction. Rather than freeze that (which would make
  // the reorder happen all at once on collapse instead), keep the *edited* card's screen
  // position fixed by shifting the scroll container underneath it by the same delta —
  // everything else visibly reorders around it, but the buttons under the user's finger
  // never move.
  //
  // Track the element's position *within the scrollable content* (viewport top + current
  // scrollTop), not its raw viewport position — the raw viewport top also changes every
  // time the user scrolls normally, which isn't a reorder and must never be "compensated"
  // away (that bug made an ordinary scroll get silently undone on the next stepper tap).
  //
  // Scoped to [fills, foods, selKey]: without a dependency array this ran on *every*
  // render of this component, including ones triggered by completely unrelated store
  // changes (typing in the route sheet, toggling the mix sheet, anything else that touches
  // the store this component reads). Each of those re-runs still wrote to scrollTop (even
  // when the delta was ~0), and repeatedly touching scrollTop during/around an active touch
  // scroll is enough to freeze a mobile browser's native scroll physics — reported as "can't
  // scroll the Plan screen at all after opening and closing a sheet."
  useLayoutEffect(() => {
    const el = selectedElRef.current;
    if (!selKey || !el) {
      prevContentTopRef.current = null;
      prevSelKeyRef.current = selKey;
      return;
    }
    const scrollEl = el.closest('[data-mobile-scroll]') as HTMLElement | null;
    if (!scrollEl) return;
    const contentTop =
      el.getBoundingClientRect().top - scrollEl.getBoundingClientRect().top + scrollEl.scrollTop;
    if (prevSelKeyRef.current === selKey && prevContentTopRef.current != null) {
      const delta = contentTop - prevContentTopRef.current;
      if (Math.abs(delta) > 0.5) {
        scrollEl.scrollTop += delta;
      }
    }
    prevContentTopRef.current = contentTop;
    prevSelKeyRef.current = selKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fills, foods, selKey]);

  return (
    <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        <div style={coverageCardStyle(carbStatus)}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: carbTint.fg,
            }}
          >
            {strings.carbCardTitle}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: carbTint.fg,
            }}
          >
            {carbPct}%
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: '#fff',
              overflow: 'hidden',
              margin: '6px 0',
            }}
          >
            <div
              style={{
                width: Math.min(100, carbPct) + '%',
                height: '100%',
                background: carbTint.fg,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: carbTint.fg,
            }}
          >
            {/* coveredCarbs, not absorbedTotal: this line has to be the fraction the percentage
                above was computed from, or the card contradicts itself in place. */}
            {Math.round(summary.coveredCarbs)} / {Math.round(summary.target)} g
          </div>
          <InfoPopover
            hint={strings.recoveryHint}
            triggerStyle={{
              display: 'block',
              fontSize: 9,
              color: carbTint.fg,
              marginTop: 2,
            }}
            popoverStyle={{ top: 'calc(100% + 6px)', left: 0 }}
          >
            ({strings.recoveryLabel}: ~{recovery.min}–{recovery.max} g ⓘ)
          </InfoPopover>
        </div>
        <div style={coverageCardStyle(hydStatus)}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: hydTint.fg,
            }}
          >
            {strings.hydration}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: hydTint.fg,
            }}
          >
            {hydPct}%
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: '#fff',
              overflow: 'hidden',
              margin: '6px 0',
            }}
          >
            <div
              style={{
                width: Math.min(100, hydPct) + '%',
                height: '100%',
                background: hydTint.fg,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: hydTint.fg,
            }}
          >
            {Math.round(summary.fluidAbsorbedTotal)} / {summary.sweatLoss} ml
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          PLAN
        </span>
        <span
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}
        >
          {items.length} {strings.itemsSuffix}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item) => {
          const key = selKeyFor(item);
          return (
            <div key={key} ref={key === selKey ? selectedElRef : undefined}>
              <MobilePlanCard item={item} />
            </div>
          );
        })}
      </div>

      {gear.map((vessel) => {
        const hasGap =
          gaps(
            fills.filter((f) => f.gid === vessel.gid),
            distanceKm,
          ).length > 0;
        return (
          <button
            key={vessel.gid}
            type="button"
            data-tour={vessel.gid === demoVesselGid ? 'demo-add-fill' : undefined}
            disabled={!hasGap}
            onClick={() => addFillInGap(vessel.gid)}
            style={{
              border: '1px dashed #C9CEC7',
              borderRadius: 11,
              padding: 12,
              background: '#F7F8F5',
              fontFamily: 'Archivo, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              color: hasGap ? 'var(--ink-soft)' : '#B7BCB6',
              cursor: hasGap ? 'pointer' : 'not-allowed',
              width: '100%',
            }}
          >
            {hasGap ? strings.addFillTo + vessel.name : vessel.name + ' · ' + strings.noGap}
          </button>
        );
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {foodLib.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => addFoodFromLibrary(entry.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 999,
              padding: '9px 12px',
              border: '1px solid var(--chip-border)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: sourceColor('food') }}
            />
            <span style={{ fontSize: 12 }}>{entry[lang] || entry.en}</span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'var(--muted-3)',
              }}
            >
              {entry.carbs}g
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        data-tour="add-shop"
        onClick={() => openShopSheet(null)}
        style={{
          border: '1px dashed #C9CEC7',
          borderRadius: 11,
          padding: 12,
          background: '#F7F8F5',
          fontFamily: 'Archivo, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        + {strings.addLandmark}
      </button>

      <button
        type="button"
        onClick={openMixSheet}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F9FAF7',
          border: 'none',
          borderRadius: 12,
          padding: '15px 12px',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {strings.bidonComposition}
        </span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{strings.perFillGrams}</span>
      </button>
    </div>
  );
}
