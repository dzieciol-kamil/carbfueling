import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { AutoplanMessage } from '../../domain/autoplan/run';
import type { FoodSelectionEntry } from '../../domain/autoplan/types';
import { totalHours } from '../../domain/fuel';
import type { RouteInput } from '../../domain/types';
import { t } from '../../i18n/strings';
import { autoplanInput, useAppStore } from '../../store/appStore';
import { DEFAULT_AUTOPLAN_OPTIONS, type AutoplanOptions } from './autoplanOptions';
import { AutoplanPreflightModal } from './AutoplanPreflightModal';
import { AutoplanThinkingModal } from './AutoplanThinkingModal';

type Phase = 'idle' | 'preflight' | 'thinking' | 'appliedNote';

/** Owner's hard stop (2026-09-24): after this the search ends as if it had finished on its own —
 *  the best plan so far stays on the chart. 194 km runs ~89M points at ~70/s, so it would not. */
export const THINKING_LIMIT_MS = 5 * 60_000;

/** Where the thinking modal lands once the run ends — by `done`, the time limit, a worker error or
 *  Cancel. With no plan posted yet (Cancel during the climb) the chart is untouched, so there is
 *  nothing to announce. `gate` is part of the contract but doesn't change the answer today: the
 *  applied note itself picks its short-ride wording from the gate at render time. */
export function finishPhase(received: boolean, _gate: 'shortRide' | 'ready'): Phase {
  return received ? 'appliedNote' : 'idle';
}

/** How much longer the modal stays up so it never flashes: at least one second in total. */
export function holdMs(startedAt: number, now: number): number {
  return Math.max(0, 1000 - (now - startedAt));
}

const desktopButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  border: '1px solid var(--chip-border)',
  background: 'var(--surface)',
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
  background: 'var(--surface)',
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
    background: 'var(--selected-bg)',
    color: 'var(--on-brand)',
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
  const insertAutoplan = useAppStore((s) => s.insertAutoplan);
  const openPanel = useAppStore((s) => s.openPanel);
  const setTab = useAppStore((s) => s.setTab);
  const strings = t(lang);
  const [phase, setPhase] = useState<Phase>('idle');
  const gate = autoplanGate(route);

  // One run at a time. `runId` is bumped whenever a run ends (done, limit, error, Cancel,
  // unmount), so anything its worker or timers still deliver afterwards is recognised and ignored.
  const runId = useRef(0);
  const worker = useRef<Worker | null>(null);
  const limitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const received = useRef(false);

  function stopWorker() {
    runId.current++;
    worker.current?.terminate();
    worker.current = null;
    clearTimeout(limitTimer.current);
  }

  useEffect(
    () => () => {
      stopWorker();
      clearTimeout(holdTimer.current);
    },
    [],
  );

  function run(selection: FoodSelectionEntry[], options: AutoplanOptions) {
    const runGate = gate === 'shortRide' ? 'shortRide' : 'ready';
    stopWorker();
    clearTimeout(holdTimer.current);
    const id = runId.current;
    const startedAt = performance.now();
    received.current = false;

    // Done, the time limit and a worker failure all end the same way: the best plan so far
    // stays, and the modal holds for its minimum second. onerror/onmessageerror cover what
    // runAutoplan's own `finally` can't — e.g. the worker module failing to load at all.
    const finish = () => {
      if (runId.current !== id) return;
      stopWorker();
      holdTimer.current = setTimeout(
        () => setPhase(finishPhase(received.current, runGate)),
        holdMs(startedAt, performance.now()),
      );
    };

    const w = new Worker(new URL('../../domain/autoplan/autoplan.worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.current = w;
    w.onmessage = (e: MessageEvent<AutoplanMessage>) => {
      if (runId.current !== id) return;
      if (e.data.type === 'plan') {
        insertAutoplan(e.data.result, options);
        received.current = true;
      } else {
        finish();
      }
    };
    w.onerror = finish;
    w.onmessageerror = finish;
    limitTimer.current = setTimeout(finish, THINKING_LIMIT_MS);

    setPhase('thinking');
    w.postMessage({ state: autoplanInput(useAppStore.getState(), options), selection });
  }

  function cancelThinking() {
    // No minimum hold here: the rider asked to stop, so the modal goes at once.
    stopWorker();
    setPhase(finishPhase(received.current, gate === 'shortRide' ? 'shortRide' : 'ready'));
  }

  function handleTrigger() {
    if (gate === 'shortRide') {
      // Nothing here to ask about: carbs never enter a plan this short (autoplanGate), so the
      // pre-flight screen would only cover blocks that don't apply. A previous run's own stops
      // are always replaced — see autoplanOptions.ts — the rider's own stops are never touched.
      run([], DEFAULT_AUTOPLAN_OPTIONS);
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
            run(selection, options);
          }}
        />
      )}

      {phase === 'thinking' && (
        <AutoplanThinkingModal lang={lang} sport={route.sport} onCancel={cancelThinking} />
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
              color: 'var(--on-brand)',
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
