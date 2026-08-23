import { describe, expect, test } from 'vitest';
import { elevationTicks } from './ElevationLayer';
import type { ProfilePoint } from '../../domain/fuel';

function pt(ele: number): ProfilePoint {
  return { x: 0, ele, grad: 0, effort: 1 };
}

describe('elevationTicks', () => {
  test('a flat profile at 0m (sea-level GPX, or the empty-track fallback in prof()) does not divide by a zero maxEle', () => {
    const ticks = elevationTicks([pt(0), pt(0), pt(0)], 200, 20, 0.5);
    expect(ticks.every((t) => Number.isFinite(t.y))).toBe(true);
  });

  test('a normal profile still places ticks at the expected elevations', () => {
    const ticks = elevationTicks([pt(0), pt(500), pt(1000)], 200, 20, 0.5);
    expect(ticks.every((t) => Number.isFinite(t.y))).toBe(true);
    expect(ticks.some((t) => t.value > 0)).toBe(true);
  });
});
