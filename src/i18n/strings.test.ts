import { describe, expect, test } from 'vitest';
import { countedNoun, STR } from './strings';

describe('countedNoun', () => {
  test('picks the Polish form for one, few and many', () => {
    const forms = STR.pl.shareStopsPlural;
    expect(countedNoun(1, forms, 'pl')).toBe('1 postój');
    expect(countedNoun(2, forms, 'pl')).toBe('2 postoje');
    expect(countedNoun(5, forms, 'pl')).toBe('5 postojów');
    // Zero is "many" in Polish, not a form of its own.
    expect(countedNoun(0, forms, 'pl')).toBe('0 postojów');
  });

  test('picks the two-form English plural', () => {
    const forms = STR.en.shareStopsPlural;
    expect(countedNoun(1, forms, 'en')).toBe('1 stop');
    expect(countedNoun(0, forms, 'en')).toBe('0 stops');
    expect(countedNoun(3, forms, 'en')).toBe('3 stops');
  });
});
