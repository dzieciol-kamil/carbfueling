import type { CSSProperties } from 'react';

export const tourGhostBtn: CSSProperties = {
  border: '1px solid var(--chip-border)',
  background: 'var(--surface)',
  color: 'var(--ink-soft)',
  borderRadius: 8,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'Archivo, sans-serif',
  cursor: 'pointer',
};

export const tourPrimaryBtn: CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--selected-bg)',
  color: 'var(--on-brand)',
  borderRadius: 8,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 700,
  fontFamily: 'Archivo, sans-serif',
  cursor: 'pointer',
};
