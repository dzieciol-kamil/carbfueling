import { describe, expect, test } from 'vitest';
import { DEFAULT_MIX, type RouteInput, type Vessel } from '../../domain/types';
import { t } from '../../i18n/strings';
import { fillRecipeLines } from './recipeLines';

const route = { mode: 'route', distance: 90, speed: 28 } as RouteInput;
const vessel: Vessel = { gid: 'g1', name: 'Bidon', vol: 750, allowed: ['izo'], gelParts: 1 };

describe('a new rider’s recipe', () => {
  // The default mix is honey with lemon: what a rider has in the kitchen, so the recipe asks for
  // grams of honey and a piece of lemon rather than maltodextrin, fructose and citric acid.
  test('asks for honey in grams and lemon, not maltodextrin, fructose and citric acid', () => {
    const strings = t('en');
    const lines = fillRecipeLines({
      fill: { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 30 },
      index: 0,
      vessel,
      route,
      mix: DEFAULT_MIX,
      xUnit: 'km',
      lang: 'en',
    });
    const keys = lines.map((l) => l.k);
    expect(keys).toContain(strings.ratioLabelHoney);
    expect(keys).toContain(strings.citricSourceLemon);
    expect(keys).not.toContain(strings.malto);
    expect(keys).not.toContain(strings.fructose);
    expect(keys).not.toContain(strings.citric);
    expect(lines.find((l) => l.k === strings.ratioLabelHoney)?.v).toMatch(/^\d+ g$/);
  });
});
