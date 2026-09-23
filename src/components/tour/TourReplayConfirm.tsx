import type { StringTable } from '../../i18n/strings';
import { tourGhostBtn, tourPrimaryBtn } from './tourStyles';

interface TourReplayConfirmProps {
  strings: StringTable;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TourReplayConfirm({ strings, onCancel, onConfirm }: TourReplayConfirmProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onCancel}
        style={{ position: 'absolute', inset: 0, background: 'rgba(18,20,18,0.55)' }}
      />
      <div
        style={{
          position: 'relative',
          width: 340,
          maxWidth: 'calc(100vw - 28px)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxSizing: 'border-box',
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700 }}>{strings.tourConfirmTitle}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>
          {strings.tourConfirmBody}
        </span>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={tourGhostBtn}>
            {strings.tourConfirmCancel}
          </button>
          <button onClick={onConfirm} style={tourPrimaryBtn}>
            {strings.tourConfirmStart}
          </button>
        </div>
      </div>
    </div>
  );
}
