import { describe, expect, test } from 'vitest';
import { coverageStatus, hydrationStatus, planSummary, totalHours } from './fuel';
import { TOUR_DEMO } from './tourDemo';

describe('TOUR_DEMO', () => {
  const { route, mix, gear, fills, foods } = TOUR_DEMO;
  const s = planSummary({ route, mix, gear, fills, foods, foodLib: [] });

  // Guards the tour against fuel.ts changes quietly turning its sample plan amber or red.
  test('is green on the carb badge', () => {
    expect(
      coverageStatus(
        s.carbRateGph,
        totalHours(route),
        s.carbPlannedRateGph,
        s.carbAbsCapGph,
        s.carbTargetGph,
        route.intensity,
      ),
    ).toBe('good');
  });

  test('is green on the hydration badge', () => {
    expect(hydrationStatus(s.waterBalancePct, route.temp)).toBe('good');
  });

  test('refills both bottles at its one stop', () => {
    const [stop] = TOUR_DEMO.shops;
    for (const v of gear) {
      expect(fills.filter((f) => f.gid === v.gid && f.from === stop.at)).toHaveLength(1);
    }
  });
});
