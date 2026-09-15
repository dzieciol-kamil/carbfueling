import { describe, expect, test } from 'vitest';
import { qrModules } from './shareQr';

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
