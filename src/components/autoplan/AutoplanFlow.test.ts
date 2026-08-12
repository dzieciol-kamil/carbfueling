import { describe, expect, test } from 'vitest';
import { autoplanGate, needsReplaceConfirm } from './AutoplanFlow';
import type { Fill, FoodItem, RouteInput, ShopStop } from '../../domain/types';

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

/**
 * What a second run is about to destroy decides whether it asks first.
 *
 * The stops autoplan created last time are as much its output as the fills are — and they are the
 * part the rider is likeliest to have kept, because a stop is a real shop he found on the map. A
 * run that reads only fills and foods will happily wipe them without a word the moment the rider
 * has cleared the plan by hand.
 */
const fill: Fill = { fid: 1, gid: 'g1', content: 'water', from: 0, to: 50 };
const food: FoodItem = { id: 1, key: 'gel', name: 'Żel', carbs: 22, from: 30, to: 30 };
const autoStop: ShopStop = { id: 1, at: 40, name: 'Sklep', autoCreated: true };
const ownStop: ShopStop = { id: 2, at: 60, name: 'Żabka' };

describe('needsReplaceConfirm', () => {
  test('a fresh plan goes straight through', () => {
    expect(needsReplaceConfirm({ fills: [], foods: [], shops: [] })).toBe(false);
  });

  test('fills alone are enough to ask', () => {
    expect(needsReplaceConfirm({ fills: [fill], foods: [], shops: [] })).toBe(true);
  });

  test('stops autoplan made last time count, even with the plan emptied by hand', () => {
    expect(needsReplaceConfirm({ fills: [], foods: [], shops: [autoStop] })).toBe(true);
  });

  test("the rider's own stops are never touched, so they are no reason to ask", () => {
    expect(needsReplaceConfirm({ fills: [], foods: [], shops: [ownStop] })).toBe(false);
  });

  test('food alone is enough to ask', () => {
    expect(needsReplaceConfirm({ fills: [], foods: [food], shops: [] })).toBe(true);
  });
});
