import { useState, type CSSProperties, type ReactNode } from 'react';
import { dist, fmtHM, prof, totalHours } from '../../domain/fuel';
import type { Content, FoodLibEntry, RouteInput, Stop, Vessel } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { sourceColor } from '../chart/theme';
import { NumberInput } from '../ui/NumberInput';
import { SegmentedControl } from '../ui/SegmentedControl';
import { createFoodReorderHandler } from './listReorderHandler';
import {
  DEFAULT_AUTOPLAN_OPTIONS,
  type AutoplanOptions,
  type AutoplanPreference,
  type StopsMode,
} from './autoplanOptions';

interface AutoplanPreflightModalProps {
  variant: 'desktop' | 'mobile';
  route: RouteInput;
  gear: Vessel[];
  stops: Stop[];
  foodLib: FoodLibEntry[];
  lang: Lang;
  preference: AutoplanPreference;
  onPreferenceChange: (preference: AutoplanPreference) => void;
  /** True when there is an existing plan (fills/foods/prior auto stops) this run would replace —
   *  shown as a one-line reminder, not a separate confirmation step. */
  showReplaceNote: boolean;
  onOpenGear: () => void;
  onCancel: () => void;
  onConfirm: (selection: { key: string; count: number }[], options: AutoplanOptions) => void;
}

/** Duplicated from RoutePanel.tsx/MobileRouteSheet.tsx rather than shared — same small
 *  route-profile-derived stat, same one-off pattern already used in both of those files. */
function elevationGain(route: RouteInput): number {
  const pts = prof(route).pts;
  let gain = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = pts[i].ele - pts[i - 1].ele;
    if (d > 0) gain += d;
  }
  return Math.round(gain / 10) * 10;
}

const overlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 200 };
const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(18,20,18,0.55)',
};
const cardBaseStyle: CSSProperties = {
  position: 'relative',
  background: '#fff',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
};
const desktopCardStyle: CSSProperties = {
  ...cardBaseStyle,
  margin: '32px auto',
  width: 480,
  maxWidth: 'calc(100vw - 28px)',
  maxHeight: 'calc(100vh - 64px)',
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  gap: 16,
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
};
// Mirrors MobileRouteSheet.tsx's sheetStyle: pinned to the bottom of the fixed overlay, full
// width, rounded top corners only, same shadow. Unlike the desktop card, the card itself isn't
// the scroll container — see mobileScrollAreaStyle/mobileFooterStyle below — so the "Ułóż plan"
// row can sit outside the scrolled area instead of needing to stick within it.
const mobileCardStyle: CSSProperties = {
  ...cardBaseStyle,
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  maxHeight: '86%',
  overflow: 'hidden',
  borderRadius: '22px 22px 0 0',
  boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
};
// The scrollable body of the mobile sheet. Same padding as MobileRouteSheet.tsx's sheetStyle;
// flex/minHeight let it shrink to fill whatever mobileCardStyle's maxHeight leaves after the
// footer, instead of forcing the card to grow.
const mobileScrollAreaStyle: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  padding: '8px 18px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};
const sectionTitleStyle: CSSProperties = { fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' };
const hintTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  lineHeight: 1.5,
  color: 'var(--ink-soft)',
};
// Height reserved for two lines at hintTextStyle's size/line-height, so switching the segmented
// control's selection never reflows the card.
const segmentDescriptionStyle: CSSProperties = { ...hintTextStyle, minHeight: 35 };
const stripStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 16px',
  marginTop: 8,
};
const statValueStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontWeight: 700,
  fontSize: 12.5,
  color: 'var(--ink)',
};
const statLabelStyle: CSSProperties = { fontSize: 10, color: 'var(--muted-3)' };
const buttonRowStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 8 };
// Footer for the mobile sheet, outside mobileScrollAreaStyle so "Ułóż plan" stays reachable
// without scrolling the five-block sheet to the bottom — a plain flex sibling below the scroll
// area rather than a `position: sticky` row inside it, so it can't be scrolled past.
const mobileFooterStyle: CSSProperties = {
  ...buttonRowStyle,
  flexShrink: 0,
  padding: '12px 18px 24px',
  background: '#fff',
  borderTop: '1px solid var(--border-soft)',
};
const gearRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '8px 10px',
  cursor: 'pointer',
};

function chipStyle(color: string): CSSProperties {
  return {
    border: '1px solid ' + color,
    color,
    borderRadius: 6,
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 700,
  };
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={statLabelStyle}>{label}</span>
      <span style={statValueStyle}>{value}</span>
    </span>
  );
}

function contentLabel(content: Content, lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function Section({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>;
}

export function AutoplanPreflightModal({
  variant,
  route,
  gear,
  stops,
  foodLib,
  lang,
  preference,
  onPreferenceChange,
  showReplaceNote,
  onOpenGear,
  onCancel,
  onConfirm,
}: AutoplanPreflightModalProps) {
  const strings = t(lang);
  // "Twoje stopy" only asks about stops the rider placed himself — a previous autoplan run's own
  // guesses are always replaced (see autoplanOptions.ts) and aren't what this control is about.
  const hasOwnStops = stops.some((sh) => !sh.autoCreated);
  const [stopsMode, setStopsMode] = useState<StopsMode>(DEFAULT_AUTOPLAN_OPTIONS.stopsMode);
  const [carried, setCarried] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(gear.map((v) => [v.gid, true])),
  );
  const [order, setOrder] = useState<string[]>(() => foodLib.map((f) => f.key));
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(foodLib.map((f) => [f.key, 0])),
  );
  const [dragKey, setDragKey] = useState<string | null>(null);

  const orderedFood = order
    .map((key) => foodLib.find((f) => f.key === key))
    .filter((f): f is FoodLibEntry => !!f);

  const preferenceOptions = [
    { value: 'fewerStops' as const, label: strings.autoplanPreferenceFewerStops },
    { value: 'balanced' as const, label: strings.autoplanPreferenceBalanced },
    { value: 'lighter' as const, label: strings.autoplanPreferenceLighter },
  ];
  const preferenceHints: Record<AutoplanPreference, string> = {
    fewerStops: strings.autoplanPreferenceFewerStopsHint,
    balanced: strings.autoplanPreferenceBalancedHint,
    lighter: strings.autoplanPreferenceLighterHint,
  };

  const stopsModeOptions = [
    { value: 'keepAndAdd' as const, label: strings.autoplanStopsKeepAndAdd },
    { value: 'keepOnly' as const, label: strings.autoplanStopsKeepOnly },
    { value: 'clear' as const, label: strings.autoplanStopsClear },
  ];
  const stopsModeHints: Record<StopsMode, string> = {
    keepAndAdd: strings.autoplanStopsKeepAndAddHint,
    keepOnly: strings.autoplanStopsKeepOnlyHint,
    clear: strings.autoplanStopsClearHint,
  };

  const cardStyle = variant === 'mobile' ? mobileCardStyle : desktopCardStyle;

  function handleConfirm() {
    const allCarried = gear.every((v) => carried[v.gid] ?? true);
    const carriedVesselGids = allCarried
      ? null
      : gear.filter((v) => carried[v.gid]).map((v) => v.gid);
    onConfirm(
      order.map((key) => ({ key, count: counts[key] ?? 0 })),
      { stopsMode, carriedVesselGids, preference },
    );
  }

  const sections = (
    <>
      <span style={{ fontSize: 15, fontWeight: 700 }}>{strings.autoplanPreflightTitle}</span>
      {showReplaceNote && <p style={hintTextStyle}>{strings.autoplanPreflightReplaceNote}</p>}

      <Section>
        <span style={sectionTitleStyle}>{strings.autoplanRouteTitle}</span>
        <div style={stripStyle}>
          <Stat label={strings.distance} value={Math.round(dist(route)) + ' km'} />
          <Stat label={strings.autoplanElevationLabel} value={'+' + elevationGain(route) + ' m'} />
          <Stat label={strings.temp} value={route.temp + ' °C'} />
          <Stat label={strings.weight} value={route.weight + ' kg'} />
          <Stat
            label={strings.intensity}
            value={
              route.intensity === 'low'
                ? strings.low
                : route.intensity === 'high'
                  ? strings.high
                  : strings.medium
            }
          />
          <Stat label={strings.duration} value={fmtHM(totalHours(route))} />
        </div>
      </Section>

      {hasOwnStops && (
        <Section>
          <span style={sectionTitleStyle}>{strings.autoplanStopsTitle}</span>
          <SegmentedControl options={stopsModeOptions} value={stopsMode} onChange={setStopsMode} />
          <p style={segmentDescriptionStyle}>{stopsModeHints[stopsMode]}</p>
        </Section>
      )}

      <Section>
        <span style={sectionTitleStyle}>{strings.autoplanPreferenceTitle}</span>
        <SegmentedControl
          options={preferenceOptions}
          value={preference}
          onChange={onPreferenceChange}
        />
        <p style={segmentDescriptionStyle}>{preferenceHints[preference]}</p>
      </Section>

      <Section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={sectionTitleStyle}>{strings.autoplanGearTitle}</span>
          <button
            type="button"
            onClick={onOpenGear}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--ink-soft)',
              textDecoration: 'underline',
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {strings.autoplanGearEditLink}
          </button>
        </div>
        <p style={hintTextStyle}>{strings.autoplanGearHint}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {gear.map((v) => (
            <label key={v.gid} style={gearRowStyle}>
              <input
                type="checkbox"
                checked={carried[v.gid] ?? true}
                onChange={(e) => setCarried((c) => ({ ...c, [v.gid]: e.target.checked }))}
              />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{v.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>{v.vol} ml</span>
              <span style={{ display: 'flex', gap: 4 }}>
                {(v.allowed || []).map((c) => (
                  <span key={c} style={chipStyle(sourceColor(c))}>
                    {contentLabel(c, lang)}
                  </span>
                ))}
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section>
        <span style={sectionTitleStyle}>{strings.autoplanFoodTitle}</span>
        <p style={hintTextStyle}>{strings.autoplanDialogHint}</p>
        <div data-food-list style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orderedFood.map((entry) => (
            <div
              key={entry.key}
              data-food-key={entry.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid var(--chip-border)',
                borderRadius: 12,
                padding: '9px 10px',
                background: dragKey === entry.key ? '#F2F5EF' : '#fff',
              }}
            >
              <span
                onPointerDown={createFoodReorderHandler(entry.key, setOrder, setDragKey)}
                style={{
                  cursor: 'grab',
                  color: 'var(--muted-3)',
                  fontSize: 14,
                  touchAction: 'none',
                }}
              >
                ⠿
              </span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>
                {entry[lang] || entry.en}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>
                {strings.autoplanDialogCountLabel}
              </span>
              <NumberInput
                min={0}
                step={1}
                parser="int"
                value={counts[entry.key] ?? 0}
                onChange={(n) => setCounts((c) => ({ ...c, [entry.key]: Math.max(0, n) }))}
                style={{
                  width: 44,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 8,
                  padding: '6px 4px',
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              />
            </div>
          ))}
        </div>
      </Section>
    </>
  );

  const buttons = (
    <>
      <button
        onClick={onCancel}
        style={{
          border: '1px solid var(--chip-border)',
          background: '#fff',
          color: 'var(--ink-soft)',
          borderRadius: 8,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Archivo, sans-serif',
          cursor: 'pointer',
        }}
      >
        {strings.autoplanDialogCancel}
      </button>
      <button
        onClick={handleConfirm}
        style={{
          border: '1px solid var(--ink)',
          background: 'var(--ink)',
          color: '#fff',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Archivo, sans-serif',
          cursor: 'pointer',
        }}
      >
        {strings.autoplanPreflightConfirm}
      </button>
    </>
  );

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} onClick={onCancel} />
      <div style={cardStyle}>
        {variant === 'mobile' ? (
          <>
            <div style={mobileScrollAreaStyle}>{sections}</div>
            <div style={mobileFooterStyle}>{buttons}</div>
          </>
        ) : (
          <>
            {sections}
            <div style={buttonRowStyle}>{buttons}</div>
          </>
        )}
      </div>
    </div>
  );
}
