/**
 * The default mix before honey + lemon (2026-09-24): maltodextrin/fructose 2:1 with citric acid.
 * The autoplan and share tests are pinned to it, so a change of the app's default does not quietly
 * change what they test.
 */
import { DEFAULT_MIX, type MixSettings } from '../types';

export const LEGACY_TEST_MIX: MixSettings = {
  ...DEFAULT_MIX,
  ratio: 2,
  gelRatio: 2,
  ratioPreset: 'iso',
  gelRatioPreset: 'iso',
  citricSource: 'citric',
  gelCitricSource: 'citric',
};
