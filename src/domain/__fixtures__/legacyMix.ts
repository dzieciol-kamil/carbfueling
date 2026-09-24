/**
 * The default mix before honey + lemon (2026-09-24): maltodextrin/fructose 2:1 with citric acid.
 * The autoplan and share tests are pinned to it, so a change of the app's default does not quietly
 * change what they test — which is why every field is written out rather than spread from
 * `DEFAULT_MIX`.
 */
import type { MixSettings } from '../types';

export const LEGACY_TEST_MIX: MixSettings = {
  conc: 8.4,
  gelConc: 60,
  ratio: 2,
  gelRatio: 2,
  ratioPreset: 'iso',
  gelRatioPreset: 'iso',
  salt: 0.16,
  citric: 0.2,
  gelSalt: 0.4,
  gelCitric: 0.4,
  citricSource: 'citric',
  gelCitricSource: 'citric',
};
