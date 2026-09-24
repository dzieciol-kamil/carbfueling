import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type MenuItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** The one item the menu leads with — drawn in the same soft green as the autoplan button. */
  accent?: boolean;
  disabled?: boolean;
  title?: string;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ transition: 'transform 120ms', transform: open ? 'rotate(180deg)' : undefined }}
    >
      <path d="M2 3.5 L5 6.5 L8 3.5" />
    </svg>
  );
}

const panelStyle = (align: 'left' | 'right'): CSSProperties => ({
  position: 'absolute',
  top: 'calc(100% + 6px)',
  [align]: 0,
  minWidth: 210,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 5,
  boxShadow: '0 14px 34px rgba(0,0,0,0.14)',
  zIndex: 60,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});

const itemStyle = (item: MenuItem): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '9px 11px',
  border: 'none',
  borderRadius: 8,
  // Plain items take their background (and its hover) from `.menu-item` in tokens.css.
  ...(item.accent ? { background: 'var(--status-good-bg)' } : {}),
  color: item.accent ? 'var(--status-good-fg)' : 'var(--ink)',
  fontFamily: 'Archivo, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  cursor: item.disabled ? 'default' : 'pointer',
  opacity: item.disabled ? 0.45 : 1,
});

/**
 * A button that opens a short list of actions under it. Closes when an item is picked, on a click
 * or tap anywhere else, when focus leaves it, and on Escape (focus going back to the button). The
 * keyboard lands on the first item and moves with the arrow keys. `triggerStyle` is the caller's
 * own button look, so the trigger sits in its row like the buttons around it; a chevron says it
 * opens.
 */
export function MenuButton({
  label,
  icon,
  items,
  triggerStyle,
  align = 'left',
}: {
  label: string;
  icon?: ReactNode;
  items: MenuItem[];
  triggerStyle: CSSProperties;
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const enabledItems = () =>
    Array.from(
      panelRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ??
        [],
    );

  useEffect(() => {
    if (!open) return;
    enabledItems()[0]?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      style={{ position: 'relative' }}
      // Tabbing out closes it. A blur with nowhere to go (iOS, which does not focus a tapped
      // button) is left to the outside-tap handler above, or a tap on an item would close the
      // menu before the item's click arrived.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && !ref.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ ...triggerStyle, display: 'flex', alignItems: 'center', gap: 7 }}
      >
        {icon}
        <span>{label}</span>
        <Chevron open={open} />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          style={panelStyle(align)}
          onKeyDown={(e) => {
            const items = enabledItems();
            const i = items.indexOf(document.activeElement as HTMLButtonElement);
            const to =
              e.key === 'ArrowDown'
                ? (i + 1) % items.length
                : e.key === 'ArrowUp'
                  ? (i - 1 + items.length) % items.length
                  : e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? items.length - 1
                      : null;
            if (to === null) return;
            e.preventDefault();
            items[to]?.focus();
          }}
        >
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={item.accent ? undefined : 'menu-item'}
              disabled={item.disabled}
              title={item.title}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              style={itemStyle(item)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
