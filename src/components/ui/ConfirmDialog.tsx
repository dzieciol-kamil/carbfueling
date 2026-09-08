interface ConfirmDialogProps {
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  title,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
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
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(18,20,18,0.55)',
        }}
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
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-soft)' }}>{body}</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              border: '1px solid var(--chip-border)',
              background: 'var(--surface)',
              color: 'var(--ink-soft)',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              border: '1px solid var(--selected-bg)',
              background: 'var(--selected-bg)',
              color: 'var(--on-brand)',
              borderRadius: 8,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
