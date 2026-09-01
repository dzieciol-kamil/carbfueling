import { describe, expect, test } from 'vitest';
import { BALANCE_SCALE_PCT, balanceBarGeometry, fmtWaterBalance } from './waterBalance';

describe('fmtWaterBalance', () => {
  test('always carries its sign, because the sign is the message', () => {
    expect(fmtWaterBalance(2.23, 'en')).toBe('+2.2%');
    expect(fmtWaterBalance(-0.93, 'en')).toBe('−0.9%');
  });

  test('a balanced plan reads as a plain zero, not a signed one', () => {
    // −0.0% looks like a rounding bug rather than a plan that replaces what it loses.
    expect(fmtWaterBalance(-0.02, 'en')).toBe('0.0%');
    expect(fmtWaterBalance(0, 'en')).toBe('0.0%');
  });

  test('Polish gets a decimal comma', () => {
    expect(fmtWaterBalance(2.23, 'pl')).toBe('+2,2%');
    expect(fmtWaterBalance(-1.5, 'pl')).toBe('−1,5%');
  });
});

describe('balanceBarGeometry', () => {
  test('zero draws nothing, sitting exactly on the centre line', () => {
    expect(balanceBarGeometry(0)).toEqual({ left: 50, width: 0 });
  });

  test('a deficit grows leftward from the centre, a surplus rightward', () => {
    // Half the scale either way, so half of a half-track: 25% of the full width.
    expect(balanceBarGeometry(-BALANCE_SCALE_PCT / 2)).toEqual({ left: 25, width: 25 });
    expect(balanceBarGeometry(BALANCE_SCALE_PCT / 2)).toEqual({ left: 50, width: 25 });
  });

  test('both ends clamp instead of overflowing the track', () => {
    expect(balanceBarGeometry(-BALANCE_SCALE_PCT * 3)).toEqual({ left: 0, width: 50 });
    expect(balanceBarGeometry(BALANCE_SCALE_PCT * 3)).toEqual({ left: 50, width: 50 });
  });
});
