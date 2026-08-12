import { useState, type CSSProperties } from 'react';
import { totalHours } from '../../domain/fuel';
import type { RouteInput } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AutoplanFoodDialog } from './AutoplanFoodDialog';

type Phase = 'idle' | 'confirmReplace' | 'foodSelect' | 'appliedNote';

const desktopButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  border: '1px solid var(--chip-border)',
  background: '#fff',
  borderRadius: 999,
  padding: '7px 12px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const mobileButtonStyle: CSSProperties = {
  border: '1px solid var(--chip-border)',
  borderRadius: 999,
  padding: '6px 11px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--ink)',
  background: '#fff',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

/** Nothing to plan yet: the button stays put and says why instead of disappearing on the rider. */
const disabledStyle: CSSProperties = { opacity: 0.45, cursor: 'default' };

function noteStyle(variant: 'desktop' | 'mobile'): CSSProperties {
  return {
    position: 'fixed',
    left: '50%',
    // Mobile's bottom tab bar (MobileApp.tsx) sits below the content in normal
    // flow, not as a fixed overlay — clear it explicitly so the toast doesn't
    // cover its icons.
    bottom: variant === 'mobile' ? 76 : 20,
    transform: 'translateX(-50%)',
    zIndex: 210,
    maxWidth: 'calc(100vw - 28px)',
    background: 'var(--ink)',
    color: '#fff',
    borderRadius: 12,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 12.5,
    boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
  };
}

/**
 * Whether there is a ride here to plan at all.
 *
 * `totalHours` answers 0 for a route nobody has finished describing — a distance without a speed,
 * a clock with nothing on it — and the app starts every session that way. That zero is "unknown",
 * not "under an hour", and the two want opposite answers: one waits for the rider, the other plans
 * water and calls it a day.
 */
export function autoplanGate(route: RouteInput): 'noDuration' | 'shortRide' | 'ready' {
  const hours = totalHours(route);
  if (hours <= 0) return 'noDuration';
  return hours < 1 ? 'shortRide' : 'ready';
}

/**
 * Whether a second run has something of the rider's to destroy.
 *
 * The stops from the last run count too — they are the part he is likeliest to have kept, being
 * real shops on his map, and the cleanup checkbox under the confirm is pre-ticked. Read only the
 * fills and foods and a rider who cleared those by hand gets no dialog, no checkbox, and loses his
 * stops without being asked. His own stops raise no question: nothing ever removes those.
 */
export function needsReplaceConfirm(plan: {
  fills: unknown[];
  foods: unknown[];
  shops: { autoCreated?: boolean }[];
}): boolean {
  return (
    plan.fills.length > 0 ||
    plan.foods.length > 0 ||
    plan.shops.some((sh) => sh.autoCreated === true)
  );
}

export function AutoplanFlow({ variant }: { variant: 'desktop' | 'mobile' }) {
  const lang = useAppStore((s) => s.ui.lang);
  const route = useAppStore((s) => s.route);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const shops = useAppStore((s) => s.shops);
  const applyAutoplan = useAppStore((s) => s.applyAutoplan);
  const strings = t(lang);
  const [phase, setPhase] = useState<Phase>('idle');
  // A stop is knowledge, not output: the rider may have checked that this is the only shop for the
  // next 40km, and that survives a replanned bottle schedule. So the plan is replaced and the stops
  // are kept unless he says otherwise — and a kept stop is not clutter, since the next run snaps
  // its own boundaries onto shops it can already see.
  const [keepPreviousAutoStops, setKeepPreviousAutoStops] = useState(true);
  const hasPreviousAutoStops = shops.some((sh) => sh.autoCreated);
  const gate = autoplanGate(route);

  function proceedAfterConfirm() {
    if (gate === 'shortRide') {
      applyAutoplan([], hasPreviousAutoStops && !keepPreviousAutoStops);
      setPhase('appliedNote');
      return;
    }
    setPhase('foodSelect');
  }

  function handleTrigger() {
    if (needsReplaceConfirm({ fills, foods, shops })) {
      setKeepPreviousAutoStops(true);
      setPhase('confirmReplace');
      return;
    }
    proceedAfterConfirm();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTrigger}
        disabled={gate === 'noDuration'}
        title={gate === 'noDuration' ? strings.autoplanNeedsDuration : undefined}
        style={
          gate === 'noDuration'
            ? {
                ...(variant === 'desktop' ? desktopButtonStyle : mobileButtonStyle),
                ...disabledStyle,
              }
            : variant === 'desktop'
              ? desktopButtonStyle
              : mobileButtonStyle
        }
      >
        {strings.autoplanButton}
      </button>

      {phase === 'confirmReplace' && (
        <ConfirmDialog
          title={strings.autoplanConfirmReplaceTitle}
          body={strings.autoplanConfirmReplaceBody}
          cancelLabel={strings.autoplanConfirmReplaceCancel}
          confirmLabel={strings.autoplanConfirmReplaceConfirm}
          onCancel={() => setPhase('idle')}
          onConfirm={proceedAfterConfirm}
        >
          {hasPreviousAutoStops && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12.5,
                  color: 'var(--ink-soft)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={keepPreviousAutoStops}
                  onChange={(e) => setKeepPreviousAutoStops(e.target.checked)}
                />
                {strings.autoplanKeepPrevStopsLabel}
              </label>
              <span style={{ fontSize: 11.5, color: 'var(--muted-2)', paddingLeft: 24 }}>
                {strings.autoplanKeepPrevStopsHint}
              </span>
            </div>
          )}
        </ConfirmDialog>
      )}

      {phase === 'foodSelect' && (
        <AutoplanFoodDialog
          foodLib={foodLib}
          lang={lang}
          onCancel={() => setPhase('idle')}
          onConfirm={(selection) => {
            applyAutoplan(selection, hasPreviousAutoStops && !keepPreviousAutoStops);
            setPhase('appliedNote');
          }}
        />
      )}

      {phase === 'appliedNote' && (
        <div style={noteStyle(variant)}>
          <span>
            {gate === 'shortRide' ? strings.autoplanShortRideNote : strings.autoplanAppliedNote}
          </span>
          <button
            onClick={() => setPhase('idle')}
            style={{
              border: 'none',
              background: 'rgba(255,255,255,0.16)',
              color: '#fff',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {strings.autoplanAppliedDismiss}
          </button>
        </div>
      )}
    </>
  );
}
