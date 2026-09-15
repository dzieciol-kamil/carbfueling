import { describe, expect, test } from 'vitest';
import { QR_QUIET_MODULES, qrCanvasMetrics, qrModules } from './shareQr';

describe('qrModules', () => {
  test('returns a square matrix', () => {
    const m = qrModules('https://carbfueling.com/pl/calculator/?p=abc');
    expect(m.length).toBeGreaterThan(20);
    expect(m.every((row) => row.length === m.length)).toBe(true);
  });

  test('draws the three finder patterns as dark corners', () => {
    const m = qrModules('https://carbfueling.com/pl/calculator/?p=abc');
    const last = m.length - 1;
    expect(m[0][0]).toBe(true);
    expect(m[0][last]).toBe(true);
    expect(m[last][0]).toBe(true);
  });

  test('grows with the payload', () => {
    const short = qrModules('https://carbfueling.com/');
    const long = qrModules('https://carbfueling.com/pl/calculator/?p=' + 'A'.repeat(700));
    expect(long.length).toBeGreaterThan(short.length);
  });

  test('is deterministic', () => {
    const a = qrModules('https://carbfueling.com/x');
    const b = qrModules('https://carbfueling.com/x');
    expect(a).toEqual(b);
  });
});

describe('qrCanvasMetrics', () => {
  test('adds the quiet zone on both sides', () => {
    const { side, cell, quiet } = qrCanvasMetrics(105, 6);
    expect(quiet).toBe(QR_QUIET_MODULES * cell);
    expect(side - 105 * cell).toBe(quiet * 2);
  });

  test('a known module count produces the expected side', () => {
    // 105 modules (a realistic plan link) at 6 px/module: 630 px of symbol + 24 px of quiet
    // zone on each side.
    expect(qrCanvasMetrics(105, 6)).toEqual({ side: 678, cell: 6, quiet: 24 });
  });

  test('side is a whole number of cells', () => {
    for (const n of [21, 81, 105, 133, 177]) {
      const { side, cell } = qrCanvasMetrics(n, 7);
      expect(side % cell).toBe(0);
      expect(side / cell).toBe(n + QR_QUIET_MODULES * 2);
    }
  });

  test('snaps a fractional cell to whole pixels', () => {
    const { side, cell } = qrCanvasMetrics(25, 5.4);
    expect(cell).toBe(5);
    expect(Number.isInteger(side)).toBe(true);
  });

  test('honours a custom quiet zone', () => {
    const { side, quiet } = qrCanvasMetrics(25, 4, 0);
    expect(quiet).toBe(0);
    expect(side).toBe(100);
  });
});
