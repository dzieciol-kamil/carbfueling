import { describe, expect, test } from 'vitest';
import { autoplanGate } from './AutoplanFlow';
import type { RouteInput } from '../../domain/types';

function makeRoute(overrides: Partial<RouteInput> = {}): RouteInput {
  return {
    mode: 'route',
    distance: 0,
    speed: 0,
    hours: 0,
    minutes: 0,
    weight: 75,
    preMealCarbs: 0,
    preMealMinutes: 0,
    intensity: 'mid',
    temp: 20,
    useGpx: false,
    gpxTrack: null,
    gpxName: null,
    gpxError: null,
    ...overrides,
  };
}

/**
 * A ride whose length nobody knows is not a short ride.
 *
 * `totalHours` answers 0 both for "40km at no speed at all" and for a route with nothing in it, and
 * the app ships with `speed: 0` — so a gate written as `< 1` told a rider who had just loaded a
 * 120km GPX that his ride was under an hour and planned him two bottles of water.
 */
describe('autoplanGate', () => {
  test('a distance with no speed yet is unknown, not short', () => {
    expect(autoplanGate(makeRoute({ distance: 120 }))).toBe('noDuration');
  });

  test('an empty route is unknown too', () => {
    expect(autoplanGate(makeRoute())).toBe('noDuration');
  });

  test('a time-mode route with no time on it is unknown', () => {
    expect(autoplanGate(makeRoute({ mode: 'time' }))).toBe('noDuration');
  });

  test('40 minutes on the clock is a short ride', () => {
    expect(autoplanGate(makeRoute({ mode: 'time', minutes: 40 }))).toBe('shortRide');
  });

  test('a 20km spin at 25km/h is a short ride', () => {
    expect(autoplanGate(makeRoute({ distance: 20, speed: 25 }))).toBe('shortRide');
  });

  test('120km at 30km/h is a ride to plan', () => {
    expect(autoplanGate(makeRoute({ distance: 120, speed: 30 }))).toBe('ready');
  });
});
