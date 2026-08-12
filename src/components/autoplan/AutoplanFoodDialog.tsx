import { useState, type CSSProperties } from 'react';
import type { FoodLibEntry } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { NumberInput } from '../ui/NumberInput';
import { createFoodReorderHandler } from './listReorderHandler';

interface AutoplanFoodDialogProps {
  foodLib: FoodLibEntry[];
  lang: Lang;
  onConfirm: (selection: { key: string; count: number }[]) => void;
  onCancel: () => void;
}

const overlayStyle: CSSProperties = { position: 'fixed', inset: 0, zIndex: 200 };
const backdropStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(18,20,18,0.55)',
};
const cardStyle: CSSProperties = {
  position: 'relative',
  margin: '40px auto',
  width: 420,
  maxWidth: 'calc(100vw - 28px)',
  maxHeight: 'calc(100vh - 80px)',
  overflowY: 'auto',
  background: '#fff',
  border: '1px solid var(--border)',
  borderRadius: 14,
  padding: '18px 20px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  boxSizing: 'border-box',
};

export function AutoplanFoodDialog({
  foodLib,
  lang,
  onConfirm,
  onCancel,
}: AutoplanFoodDialogProps) {
  const [order, setOrder] = useState<string[]>(() => foodLib.map((f) => f.key));
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(foodLib.map((f) => [f.key, 0])),
  );
  const [dragKey, setDragKey] = useState<string | null>(null);
  const strings = t(lang);

  const orderedEntries = order
    .map((key) => foodLib.find((f) => f.key === key))
    .filter((f): f is FoodLibEntry => !!f);

  return (
    <div style={overlayStyle}>
      <div style={backdropStyle} onClick={onCancel} />
      <div style={cardStyle}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{strings.autoplanDialogTitle}</span>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-soft)' }}>
          {strings.autoplanDialogHint}
        </p>
        <div data-food-list style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {orderedEntries.map((entry) => (
            <div
              key={entry.key}
              data-food-key={entry.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid var(--chip-border)',
                borderRadius: 12,
                padding: '9px 10px',
                background: dragKey === entry.key ? '#F2F5EF' : '#fff',
              }}
            >
              <span
                onPointerDown={createFoodReorderHandler(entry.key, setOrder, setDragKey)}
                style={{
                  cursor: 'grab',
                  color: 'var(--muted-3)',
                  fontSize: 14,
                  touchAction: 'none',
                }}
              >
                ⠿
              </span>
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>
                {entry[lang] || entry.en}
              </span>
              <span style={{ fontSize: 10, color: 'var(--muted-3)' }}>
                {strings.autoplanDialogCountLabel}
              </span>
              <NumberInput
                min={0}
                step={1}
                parser="int"
                value={counts[entry.key] ?? 0}
                onChange={(n) => setCounts((c) => ({ ...c, [entry.key]: Math.max(0, n) }))}
                style={{
                  width: 44,
                  border: '1px solid var(--chip-border)',
                  borderRadius: 8,
                  padding: '6px 4px',
                  textAlign: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              border: '1px solid var(--chip-border)',
              background: '#fff',
              color: 'var(--ink-soft)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {strings.autoplanDialogCancel}
          </button>
          <button
            onClick={() => onConfirm(order.map((key) => ({ key, count: counts[key] ?? 0 })))}
            style={{
              border: '1px solid var(--ink)',
              background: 'var(--ink)',
              color: '#fff',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Archivo, sans-serif',
              cursor: 'pointer',
            }}
          >
            {strings.autoplanDialogConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
