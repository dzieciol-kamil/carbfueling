import { describe, expect, test } from 'vitest';
import { nextHint, ONBOARDING_VERSION, shouldOpenSetup } from './onboardingFlow';

describe('shouldOpenSetup', () => {
  test('opens for a rider below the current version', () => {
    expect(shouldOpenSetup(ONBOARDING_VERSION - 1)).toBe(true);
  });

  test('stays shut for a rider already on it', () => {
    expect(shouldOpenSetup(ONBOARDING_VERSION)).toBe(false);
  });
});

describe('nextHint', () => {
  const empty = { routeReady: false, hasPlan: false };
  const route = { routeReady: true, hasPlan: false };
  const planned = { routeReady: true, hasPlan: true };

  test('the route hint waits for a route', () => {
    expect(nextHint(1, empty)).toBe(1);
  });

  test('a route moves it on to "Suggest a plan"', () => {
    expect(nextHint(1, route)).toBe(2);
  });

  test('"Suggest a plan" waits for a plan', () => {
    expect(nextHint(2, route)).toBe(2);
  });

  test('a plan moves it on to the chart', () => {
    expect(nextHint(2, planned)).toBe(3);
  });

  test('a plan built by hand skips "Suggest a plan"', () => {
    expect(nextHint(1, planned)).toBe(3);
  });

  test('the chart hint stays until it is closed', () => {
    expect(nextHint(3, empty)).toBe(3);
  });

  test('a closed sequence stays closed', () => {
    expect(nextHint(null, planned)).toBeNull();
  });
});
