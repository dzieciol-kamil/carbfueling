import { useState, type CSSProperties } from 'react';
import { totalHours } from '../../domain/fuel';
import type { RouteInput } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { AutoplanPreflightModal } from './AutoplanPreflightModal';

type Phase = 'idle' | 'preflight' | 'appliedNote';

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

// Matches Header.tsx's GearIcon/MixIcon/FoodIcon/SettingsIcon idiom (viewBox, stroke width,
// sizing) — desktop-only, so the mobile trigger stays text-only as before.
function WandIcon() {
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
    >
      <path d="M4.5 17.5 L13 9" />
      <path d="M16.5 3 v4 M14.5 5 h4" />
    </svg>
  );
}

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
 * Whether a second run has something of the rider's to destroy — drives the pre-flight modal's
 * inline "this replaces your plan" note, not a separate confirmation step.
 *
 * The stops from the last run count too — they are the part he is likeliest to have kept, being
 * real stops on his map. Read only the fills and foods and a rider who cleared those by hand gets
 * no note and loses his stops without being told. His own stops raise no question: nothing ever
 * removes those on their account.
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
  const gear = useAppStore((s) => s.gear);
  const shops = useAppStore((s) => s.shops);
  const applyAutoplan = useAppStore((s) => s.applyAutoplan);
  const openPanel = useAppStore((s) => s.openPanel);
  const setTab = useAppStore((s) => s.setTab);
  const strings = t(lang);
  const [phase, setPhase] = useState<Phase>('idle');
  const gate = autoplanGate(route);

  function handleTrigger() {
    if (gate === 'shortRide') {
      // Nothing here to ask about: carbs never enter a plan this short (autoplanGate), so the
      // pre-flight screen would only cover blocks that don't apply. A previous run's own stops
      // are always replaced — see autoplanOptions.ts — the rider's own stops are never touched.
      applyAutoplan([], true);
      setPhase('appliedNote');
      return;
    }
    setPhase('preflight');
  }

  function openGear() {
    setPhase('idle');
    if (variant === 'desktop') openPanel('gear');
    else setTab('gear');
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
        {variant === 'desktop' && <WandIcon />}
        <span>{strings.autoplanButton}</span>
      </button>

      {phase === 'preflight' && (
        <AutoplanPreflightModal
          variant={variant}
          route={route}
          gear={gear}
          shops={shops}
          foodLib={foodLib}
          lang={lang}
          showReplaceNote={needsReplaceConfirm({ fills, foods, shops })}
          onOpenGear={openGear}
          onCancel={() => setPhase('idle')}
          onConfirm={(selection, options) => {
            // Previous-run stops are always replaced now — re-running is what that means (see
            // autoplanOptions.ts). Only the rider's own stops are governed by options.stopsMode.
            applyAutoplan(selection, true, options);
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
