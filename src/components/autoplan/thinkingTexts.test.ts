import { expect, test } from 'vitest';
import { t } from '../../i18n/strings';
import { nextTextDelayMs, textPool, textQueue } from './thinkingTexts';

/** Deterministic PRNG (mulberry32) so shuffle tests are reproducible across seeds. */
function mulberry(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('the pool is the shared texts plus the ride’s sport', () => {
  const s = t('pl');
  expect(textPool(s, 'running')).toEqual([
    ...s.autoplanThinkingShared,
    ...s.autoplanThinkingRunning,
  ]);
});

test('a queue uses every text once', () => {
  const q = textQueue(['a', 'b', 'c', 'd'], mulberry(1));
  expect([...q].sort()).toEqual(['a', 'b', 'c', 'd']);
});

test('a new round never opens with the text that just closed the last one', () => {
  for (let seed = 0; seed < 50; seed++) {
    expect(textQueue(['a', 'b', 'c'], mulberry(seed), 'a')[0]).not.toBe('a');
  }
});

test('texts change every 10 to 15 seconds', () => {
  expect(nextTextDelayMs(() => 0)).toBe(10_000);
  expect(nextTextDelayMs(() => 0.999)).toBeLessThan(15_000);
});

test.each(['pl', 'en', 'de', 'it'] as const)('%s has 20-30 texts per sport', (lang) => {
  const s = t(lang);
  for (const sport of ['cycling', 'running'] as const) {
    const n = textPool(s, sport).length;
    expect(n).toBeGreaterThanOrEqual(20);
    expect(n).toBeLessThanOrEqual(30);
  }
});
