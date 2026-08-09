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

const noteStyle: CSSProperties = {
  position: 'fixed',
  left: '50%',
  bottom: 20,
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

export function AutoplanFlow({ variant }: { variant: 'desktop' | 'mobile' }) {
  const lang = useAppStore((s) => s.ui.lang);
  const route = useAppStore((s) => s.route);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const applyAutoplan = useAppStore((s) => s.applyAutoplan);
  const strings = t(lang);
  const [phase, setPhase] = useState<Phase>('idle');

  function proceedAfterConfirm() {
    if (totalHours(route) < 1) {
      applyAutoplan([]);
      setPhase('appliedNote');
      return;
    }
    setPhase('foodSelect');
  }

  function handleTrigger() {
    const hasExisting = fills.length > 0 || foods.length > 0;
    if (hasExisting) {
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
        />
      )}

      {phase === 'foodSelect' && (
        <AutoplanFoodDialog
          foodLib={foodLib}
          lang={lang}
          onCancel={() => setPhase('idle')}
          onConfirm={(selection) => {
            applyAutoplan(selection);
            setPhase('appliedNote');
          }}
        />
      )}

      {phase === 'appliedNote' && (
        <div style={noteStyle}>
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
