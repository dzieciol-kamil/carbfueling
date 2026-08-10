import { useState, type CSSProperties } from 'react';
import { totalHours } from '../../domain/fuel';
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
  // Pre-checked: this toggle only ever removes shops autoplan itself created on a prior
  // run (never a rider-placed one), so defaulting to "clean up after yourself" suits the
  // common case of a rider re-running autoplan a few times while dialing in food choices.
  const [removePreviousAutoStops, setRemovePreviousAutoStops] = useState(true);
  const hasPreviousAutoStops = shops.some((sh) => sh.autoCreated);

  function proceedAfterConfirm() {
    if (totalHours(route) < 1) {
      applyAutoplan([], hasPreviousAutoStops && removePreviousAutoStops);
      setPhase('appliedNote');
      return;
    }
    setPhase('foodSelect');
  }

  function handleTrigger() {
    const hasExisting = fills.length > 0 || foods.length > 0;
    if (hasExisting) {
      setRemovePreviousAutoStops(true);
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
        style={variant === 'desktop' ? desktopButtonStyle : mobileButtonStyle}
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
                checked={removePreviousAutoStops}
                onChange={(e) => setRemovePreviousAutoStops(e.target.checked)}
              />
              {strings.autoplanRemovePrevStopsLabel}
            </label>
          )}
        </ConfirmDialog>
      )}

      {phase === 'foodSelect' && (
        <AutoplanFoodDialog
          foodLib={foodLib}
          lang={lang}
          onCancel={() => setPhase('idle')}
          onConfirm={(selection) => {
            applyAutoplan(selection, hasPreviousAutoStops && removePreviousAutoStops);
            setPhase('appliedNote');
          }}
        />
      )}

      {phase === 'appliedNote' && (
        <div style={noteStyle(variant)}>
          <span>
            {totalHours(route) < 1 ? strings.autoplanShortRideNote : strings.autoplanAppliedNote}
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
