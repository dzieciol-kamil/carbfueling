import type { Sport } from '../../domain/types';
import type { StringTable } from '../../i18n/strings';

/** Shared texts plus the ones written for this ride's sport. */
export function textPool(strings: StringTable, sport: Sport): string[] {
  const bySport =
    sport === 'cycling' ? strings.autoplanThinkingCycling : strings.autoplanThinkingRunning;
  return [...strings.autoplanThinkingShared, ...bySport];
}

/** Fisher–Yates shuffle of `pool`. When the shuffled first entry equals `avoidFirst` (the text
 *  that just closed the previous round), it's swapped with the second entry so a fresh round
 *  never opens on the text the rider just saw. */
export function textQueue(pool: string[], rand: () => number, avoidFirst?: string): string[] {
  const queue = [...pool];
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  if (avoidFirst !== undefined && queue.length > 1 && queue[0] === avoidFirst) {
    [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  return queue;
}

/** 10-15s, randomized so the cadence doesn't feel mechanical. */
export function nextTextDelayMs(rand: () => number): number {
  return 10_000 + rand() * 5_000;
}
