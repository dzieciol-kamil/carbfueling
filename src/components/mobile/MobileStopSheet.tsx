import { useEffect, useState, type CSSProperties } from 'react';
import { dist } from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';

const sheetStyle: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 31,
  background: '#fff',
  borderRadius: '22px 22px 0 0',
  padding: '8px 18px 24px',
  boxShadow: '0 -12px 40px rgba(0,0,0,0.18)',
  transition: 'transform 220ms cubic-bezier(0.22,0.9,0.3,1)',
};
const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 30,
  background: 'rgba(22,25,28,0.34)',
};
const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid var(--chip-border)',
  borderRadius: 10,
  padding: '11px 12px',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  background: '#fff',
};

export function MobileStopSheet() {
  const stopSheet = useAppStore((s) => s.ui.stopSheet);
  const closeStopSheet = useAppStore((s) => s.closeStopSheet);
  const route = useAppStore((s) => s.route);
  const addStop = useAppStore((s) => s.addStop);
  const updateStop = useAppStore((s) => s.updateStop);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  const distanceKm = dist(route);

  const [km, setKm] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!stopSheet) return;
    setKm('');
    setName(strings.stopDefaultName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopSheet]);

  if (!stopSheet) return null;

  const kmValue = parseFloat(km);
  const valid = km !== '' && !Number.isNaN(kmValue) && kmValue >= 0 && kmValue <= distanceKm;

  function submit() {
    if (!valid) return;
    const newId = useAppStore.getState().nextStopId;
    addStop();
    updateStop(newId, { at: kmValue, name });
    closeStopSheet();
  }

  return (
    <>
      <div style={backdropStyle} onClick={closeStopSheet} />
      <div style={sheetStyle}>
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 2,
            background: 'var(--chip-border)',
            margin: '0 auto 10px',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
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
            {strings.stopSheetTitle}
          </span>
          <button
            type="button"
            onClick={closeStopSheet}
            style={{
              width: 34,
              height: 34,
              border: '1px solid var(--chip-border)',
              borderRadius: 10,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.stopSheetKm}</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder={'0–' + Math.round(distanceKm) + ' km'}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              style={{
                ...inputStyle,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 19,
                fontWeight: 700,
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--muted-2)' }}>{strings.stopSheetName}</span>
            <input
              type="text"
              value={name}
              maxLength={10}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
          </label>

          <button
            type="button"
            disabled={!valid}
            onClick={submit}
            style={{
              marginTop: 4,
              background: valid ? 'var(--ink)' : '#E6E8E2',
              color: valid ? '#fff' : '#B7BCB6',
              border: 'none',
              borderRadius: 12,
              padding: 15,
              fontSize: 14,
              fontWeight: 700,
              cursor: valid ? 'pointer' : 'not-allowed',
            }}
          >
            {strings.stopSheetAdd}
          </button>
        </div>
      </div>
    </>
  );
}
