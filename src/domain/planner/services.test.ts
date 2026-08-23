import { describe, expect, test } from 'vitest';
import { carbsFill, volOf } from '../fuel';
import type { DraftFill } from '../autoplan';
import type { Fill, MixSettings, Vessel } from '../types';
import { servicesToFills } from './services';
import type { Service } from './types';

const gear: Vessel[] = [
  { gid: 'g1', name: 'Bidon', vol: 500, allowed: ['water', 'izo'], gelParts: 4 },
  { gid: 'g2', name: 'Flask', vol: 250, allowed: ['gel', 'water'], gelParts: 4 },
];

const mix: MixSettings = {
  conc: 8,
  gelConc: 60,
  ratio: 2,
  gelRatio: 2,
  ratioPreset: 'iso',
  gelRatioPreset: 'iso',
  salt: 0.4,
  citric: 0.4,
  gelSalt: 0.4,
  gelCitric: 0.4,
  citricSource: 'citric',
  gelCitricSource: 'citric',
};

function service(overrides: Partial<Service>): Service {
  return {
    vesselId: 'g1',
    fromKm: 0,
    toKm: 50,
    content: 'water',
    volumeMl: 500,
    carbsG: 0,
    filledAtStop: null,
    ...overrides,
  };
}

/** Gives a `DraftFill` a throwaway `fid` so `volOf`/`carbsFill` (which take a real `Fill`) can be
 *  run over the conversion's output — those two are otherwise the only consumers of `pos`/volume/
 *  carb figures that a `Fill` carries. */
function asFills(drafts: DraftFill[]): Fill[] {
  return drafts.map((d, i) => ({ ...d, fid: i }));
}

describe('servicesToFills', () => {
  test('relay: two services on one vessel separated by a gap produce two distinct fills', () => {
    const services: Service[] = [
      service({ vesselId: 'g1', fromKm: 0, toKm: 48, content: 'izo', volumeMl: 500, carbsG: 40 }),
      service({
        vesselId: 'g1',
        fromKm: 101,
        toKm: 150,
        content: 'izo',
        volumeMl: 500,
        carbsG: 40,
        filledAtStop: 1,
      }),
    ];

    const fills = servicesToFills(services, gear);

    // Neither merged into one fill nor dropped — the whole point of the rewrite (C4).
    expect(fills).toEqual<DraftFill[]>([
      { gid: 'g1', content: 'izo', from: 0, to: 48 },
      { gid: 'g1', content: 'izo', from: 101, to: 150 },
    ]);
  });

  test('a vessel need not start at km 0 (S4) — no stop is implied by a mid-route first service', () => {
    const services: Service[] = [
      service({ vesselId: 'g1', fromKm: 32, toKm: 90, content: 'water', filledAtStop: null }),
    ];

    const fills = servicesToFills(services, gear);

    expect(fills).toEqual<DraftFill[]>([{ gid: 'g1', content: 'water', from: 32, to: 90 }]);
    // The fill starts where the rider opened the bottle, not at 0.
    expect(fills[0].from).toBe(32);
  });

  test('one vessel carries different contents at different times: izo, then water once spent', () => {
    const services: Service[] = [
      service({ vesselId: 'g1', fromKm: 0, toKm: 60, content: 'izo', volumeMl: 500, carbsG: 40 }),
      service({
        vesselId: 'g1',
        fromKm: 60,
        toKm: 150,
        content: 'water',
        volumeMl: 500,
        carbsG: 0,
        filledAtStop: 0,
      }),
    ];

    const fills = servicesToFills(services, gear);

    expect(fills).toEqual<DraftFill[]>([
      { gid: 'g1', content: 'izo', from: 0, to: 60 },
      { gid: 'g1', content: 'water', from: 60, to: 150 },
    ]);
    expect(fills[0].content).not.toBe(fills[1].content);
  });

  test('round trip: total volume and carbs across produced fills equal the sum over services', () => {
    const services: Service[] = [
      service({ vesselId: 'g1', fromKm: 0, toKm: 48, content: 'izo', volumeMl: 500, carbsG: 40 }),
      service({
        vesselId: 'g1',
        fromKm: 101,
        toKm: 150,
        content: 'izo',
        volumeMl: 500,
        carbsG: 40,
        filledAtStop: 1,
      }),
      service({ vesselId: 'g2', fromKm: 0, toKm: 90, content: 'gel', volumeMl: 250, carbsG: 150 }),
      service({
        vesselId: 'g2',
        fromKm: 90,
        toKm: 150,
        content: 'water',
        volumeMl: 250,
        carbsG: 0,
        filledAtStop: 0,
      }),
    ];
    const wantVolumeMl = services.reduce((a, s) => a + s.volumeMl, 0);
    const wantCarbsG = services.reduce((a, s) => a + s.carbsG, 0);

    const fills = asFills(servicesToFills(services, gear));

    const gotVolumeMl = fills.reduce((a, f) => a + volOf(f, gear), 0);
    const gotCarbsG = fills.reduce((a, f) => a + carbsFill(f, gear, mix), 0);

    expect(gotVolumeMl).toBe(wantVolumeMl);
    expect(gotCarbsG).toBe(wantCarbsG);
  });

  test('drops a service whose vessel is no longer in gear', () => {
    const services: Service[] = [service({ vesselId: 'ghost' })];

    expect(servicesToFills(services, gear)).toEqual([]);
  });
});
