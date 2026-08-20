import type { ReactNode } from 'react';

interface PanelShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function PanelShell({ title, onClose, children }: PanelShellProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(18,20,18,0.34)' }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '43%',
          minWidth: 560,
          maxWidth: 820,
          background: '#fff',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-24px 0 60px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '22px 26px 16px',
            borderBottom: '1px solid var(--border-soft)',
          }}
        >
          <span style={{ fontSize: 17, fontWeight: 700 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              border: '1px solid var(--chip-border)',
              background: '#fff',
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--ink-soft)',
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '22px 26px 26px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
