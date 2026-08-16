import { describe, expect, test } from 'vitest';
import {
  bestGapSpan,
  clampFillToDistance,
  clampFoodToDistance,
  clampShopToDistance,
  dragGelPart,
  fillBounds,
  gaps,
  moveFill,
  moveFood,
  moveListItem,
  moveShop,
  nextShopAt,
  rescalePositions,
  resizeFillLeft,
  resizeFillRight,
  resizeFoodLeft,
  resizeFoodRight,
} from './dragMath';
import type { Fill, FoodItem, ShopStop, Vessel } from './types';

const gear: Vessel[] = [
  { gid: 'g1', name: 'Bottle', vol: 500, allowed: ['izo', 'gel'], gelParts: 3 },
];

function fill(overrides: Partial<Fill>): Fill {
  return { fid: 1, gid: 'g1', content: 'izo', from: 0, to: 50, ...overrides };
}

describe('fillBounds', () => {
  test('unbounded when no siblings', () => {
    const f = fill({ fid: 1, from: 20, to: 40 });
    expect(fillBounds(f, [f], 100)).toEqual({ lo: 0, hi: 100 });
  });

  test('clamped by a sibling on each side', () => {
    const f = fill({ fid: 1, from: 20, to: 40 });
    const left = fill({ fid: 2, from: 0, to: 10 });
    const right = fill({ fid: 3, from: 60, to: 80 });
    expect(fillBounds(f, [f, left, right], 100)).toEqual({ lo: 10, hi: 60 });
  });
});

describe('moveFill', () => {
  test('moves freely within [0, D-width] when no siblings block it', () => {
    const f = fill({ fid: 1, from: 20, to: 40 });
    expect(moveFill(f, [f], 100, 10)).toEqual({ from: 30, to: 50 });
  });

  test('clamps at 0 when dragged past the start', () => {
    const f = fill({ fid: 1, from: 20, to: 40 });
    expect(moveFill(f, [f], 100, -50)).toEqual({ from: 0, to: 20 });
  });

  test('clamps against a left neighbour', () => {
    const f = fill({ fid: 1, from: 30, to: 50 });
    const left = fill({ fid: 2, from: 0, to: 20 });
    expect(moveFill(f, [f, left], 100, -15)).toEqual({ from: 20, to: 40 });
  });

  test('clamps against a right neighbour', () => {
    // want must stay short of the neighbour's own "from" (60) — a delta big enough to land
    // the raw target *inside* the neighbour's span is a same-event jump no continuous drag
    // produces, and the ported algorithm (like the prototype) doesn't resolve that case.
    const f = fill({ fid: 1, from: 30, to: 50 });
    const right = fill({ fid: 2, from: 60, to: 100 });
    expect(moveFill(f, [f, right], 100, 20)).toEqual({ from: 40, to: 60 });
  });

  test('shrinks to fit when dragged into a gap tighter than its own width', () => {
    // width=20, dragged into a gap [40,55] (15 wide) which is still >= min (1 for D=100)
    const f = fill({ fid: 1, from: 0, to: 20 });
    const left = fill({ fid: 2, from: 0, to: 40 });
    const right = fill({ fid: 3, from: 55, to: 100 });
    // note: left neighbour occupies [0,40], so dragged fill must start after 40
    expect(moveFill(f, [f, left, right], 100, 45)).toEqual({ from: 40, to: 55 });
  });

  test('does not move when the target gap is smaller than the minimum width', () => {
    const f = fill({ fid: 1, from: 0, to: 20 });
    const left = fill({ fid: 2, from: 0, to: 41 });
    const right = fill({ fid: 3, from: 41.5, to: 100 }); // gap of 0.5, min is max(2, round(100*0.01))=2
    const result = moveFill(f, [f, left, right], 100, 45);
    expect(result).toEqual({ from: f.from, to: f.to });
  });
});

describe('moveFill — swapping with a neighbour', () => {
  test('swaps with the right neighbour once dragged past its midpoint', () => {
    // f is 40 wide, neighbour [40,60] is 20 wide (midpoint 50). f's leading edge
    // reaches 50 at want=10, so a delta of 10 tips it over.
    const f = fill({ fid: 1, from: 0, to: 40 });
    const right = fill({ fid: 2, from: 40, to: 60 });
    expect(moveFill(f, [f, right], 100, 10)).toEqual({
      from: 20,
      to: 60,
      swap: { fid: 2, from: 0, to: 20 },
    });
  });

  test('stays put just short of the right neighbour’s midpoint', () => {
    const f = fill({ fid: 1, from: 0, to: 40 });
    const right = fill({ fid: 2, from: 40, to: 60 });
    expect(moveFill(f, [f, right], 100, 9)).toEqual({ from: 0, to: 40 });
  });

  test('swaps with the left neighbour once dragged past its midpoint', () => {
    // neighbour [10,30] has midpoint 20; f's leading (left) edge reaches it at want=20.
    const f = fill({ fid: 1, from: 40, to: 70 });
    const left = fill({ fid: 2, from: 10, to: 30 });
    expect(moveFill(f, [f, left], 100, -20)).toEqual({
      from: 10,
      to: 40,
      swap: { fid: 2, from: 50, to: 70 },
    });
  });

  test('stays put just short of the left neighbour’s midpoint', () => {
    const f = fill({ fid: 1, from: 40, to: 70 });
    const left = fill({ fid: 2, from: 10, to: 30 });
    expect(moveFill(f, [f, left], 100, -19)).toEqual({ from: 30, to: 60 });
  });

  test('keeps both widths, the gap between them and the outer span', () => {
    const f = fill({ fid: 1, from: 10, to: 40 });
    const right = fill({ fid: 2, from: 50, to: 70 });
    const result = moveFill(f, [f, right], 100, 30);
    expect(result).toEqual({ from: 40, to: 70, swap: { fid: 2, from: 10, to: 30 } });
    // widths unchanged, 10 km gap unchanged, block still spans [10,70]
    expect(result.to - result.from).toBe(30);
    expect(result.swap!.to - result.swap!.from).toBe(20);
    expect(result.from - result.swap!.to).toBe(10);
  });

  test('swaps only with the nearest neighbour when several are lined up', () => {
    const f = fill({ fid: 1, from: 0, to: 20 });
    const mid = fill({ fid: 2, from: 20, to: 40 });
    const far = fill({ fid: 3, from: 40, to: 60 });
    expect(moveFill(f, [f, mid, far], 100, 100)).toEqual({
      from: 20,
      to: 40,
      swap: { fid: 2, from: 0, to: 20 },
    });
  });

  test('does not swap when there is no neighbour in the drag direction', () => {
    const f = fill({ fid: 1, from: 40, to: 60 });
    const left = fill({ fid: 2, from: 0, to: 20 });
    expect(moveFill(f, [f, left], 100, 100)).toEqual({ from: 80, to: 100 });
  });
});

describe('resizeFillLeft / resizeFillRight', () => {
  test('left edge stops at the lower bound', () => {
    const f = fill({ fid: 1, from: 30, to: 50 });
    const bounds = { lo: 10, hi: 100 };
    expect(resizeFillLeft(f, bounds, -100, 30)).toBe(10);
  });

  test('left edge cannot cross within 2 units of the right edge', () => {
    const f = fill({ fid: 1, from: 30, to: 50 });
    const bounds = { lo: 0, hi: 100 };
    expect(resizeFillLeft(f, bounds, 100, 30)).toBe(48);
  });

  test('right edge stops at the upper bound', () => {
    const f = fill({ fid: 1, from: 30, to: 50 });
    const bounds = { lo: 0, hi: 70 };
    expect(resizeFillRight(f, bounds, 100, 50)).toBe(70);
  });

  test('right edge cannot cross within 2 units of the left edge', () => {
    const f = fill({ fid: 1, from: 30, to: 50 });
    const bounds = { lo: 0, hi: 100 };
    expect(resizeFillRight(f, bounds, -100, 50)).toBe(32);
  });
});

describe('rescalePositions', () => {
  test('proportionally maps positions from the old span to the new span', () => {
    expect(rescalePositions([25, 50, 75], 0, 100, 0, 50)).toEqual([12.5, 25, 37.5]);
  });

  test('returns undefined when there are no positions to rescale', () => {
    expect(rescalePositions(undefined, 0, 100, 0, 50)).toBeUndefined();
  });
});

describe('gaps', () => {
  test('finds the free stretches around existing fills, ignoring slivers under 4 units', () => {
    const fills: Fill[] = [fill({ fid: 1, from: 10, to: 30 }), fill({ fid: 2, from: 32, to: 60 })];
    expect(gaps(fills, 100)).toEqual([
      [0, 10],
      [60, 100],
    ]);
  });

  test('empty when fills cover the whole distance', () => {
    const fills: Fill[] = [fill({ fid: 1, from: 0, to: 100 })];
    expect(gaps(fills, 100)).toEqual([]);
  });

  test('reads lane positions, not array order', () => {
    const fills: Fill[] = [
      fill({ fid: 1, from: 0, to: 25 }),
      fill({ fid: 2, from: 60, to: 85 }),
      fill({ fid: 3, from: 30, to: 55 }),
    ];
    expect(gaps(fills, 90)).toEqual([
      [25, 30],
      [55, 60],
      [85, 90],
    ]);
  });
});

describe('bestGapSpan', () => {
  test('picks the widest gap and spans up to 28% of distance', () => {
    const result = bestGapSpan(
      [
        [0, 10],
        [40, 90],
      ],
      100,
    );
    expect(result).toEqual({ from: 40, to: 68 }); // min(50, max(20, round(28))) = 28 -> 40+28=68
  });

  test('spans the full gap when narrower than the 28% cap', () => {
    const result = bestGapSpan([[0, 15]], 100);
    expect(result).toEqual({ from: 0, to: 15 });
  });

  test('returns null when there are no gaps', () => {
    expect(bestGapSpan([], 100)).toBeNull();
  });
});

describe('dragGelPart', () => {
  test('clamps a middle portion between its neighbours with minimum spacing', () => {
    const f = fill({ fid: 1, content: 'gel', from: 0, to: 90 });
    // 3 parts -> even positions [0, 45, 90]; dragging k=1 far right should stop short of k=2 (min spacing = max(1, round(90*0.004))=1)
    const result = dragGelPart(f, gear, 1, 1000, 90);
    expect(result[1]).toBe(89); // hi = arr[2] - min = 90 - 1
  });

  test('first portion cannot move before fill.from', () => {
    const f = fill({ fid: 1, content: 'gel', from: 0, to: 90 });
    const result = dragGelPart(f, gear, 0, -1000, 90);
    expect(result[0]).toBe(0);
  });

  test('last portion cannot move past fill.to', () => {
    const f = fill({ fid: 1, content: 'gel', from: 0, to: 90 });
    const result = dragGelPart(f, gear, 2, 1000, 90);
    expect(result[2]).toBe(90);
  });
});

describe('moveFood', () => {
  test('moves freely within [0, D-width]', () => {
    const fd: FoodItem = { id: 1, key: 'ban', name: 'Banana', carbs: 25, from: 20, to: 20 };
    expect(moveFood(fd, 100, 30)).toEqual({ from: 50, to: 50 });
  });

  test('clamps at the route boundaries', () => {
    const fd: FoodItem = {
      id: 1,
      key: 'chew',
      name: 'Chews',
      carbs: 30,
      cont: true,
      from: 10,
      to: 30,
    };
    expect(moveFood(fd, 100, -50)).toEqual({ from: 0, to: 20 });
    expect(moveFood(fd, 100, 500)).toEqual({ from: 80, to: 100 });
  });
});

describe('resizeFoodLeft / resizeFoodRight', () => {
  test('left cannot cross within 1 unit of the right edge', () => {
    const fd: FoodItem = {
      id: 1,
      key: 'chew',
      name: 'Chews',
      carbs: 30,
      cont: true,
      from: 10,
      to: 30,
    };
    expect(resizeFoodLeft(fd, 1000, 10)).toBe(29);
  });

  test('right cannot cross within 1 unit of the left edge', () => {
    const fd: FoodItem = {
      id: 1,
      key: 'chew',
      name: 'Chews',
      carbs: 30,
      cont: true,
      from: 10,
      to: 30,
    };
    expect(resizeFoodRight(fd, 100, -1000, 30)).toBe(11);
  });

  test('right is clamped to the route distance', () => {
    const fd: FoodItem = {
      id: 1,
      key: 'chew',
      name: 'Chews',
      carbs: 30,
      cont: true,
      from: 10,
      to: 30,
    };
    expect(resizeFoodRight(fd, 100, 1000, 30)).toBe(100);
  });
});

describe('moveListItem', () => {
  test('moves an item forward, shifting items in between back by one', () => {
    expect(moveListItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  test('moves an item backward, shifting items in between forward by one', () => {
    expect(moveListItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  test('is a no-op when from equals to', () => {
    const list = ['a', 'b', 'c'];
    expect(moveListItem(list, 1, 1)).toEqual(['a', 'b', 'c']);
  });

  test('does not mutate the original array', () => {
    const list = ['a', 'b', 'c'];
    moveListItem(list, 0, 2);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});

describe('moveShop', () => {
  test('moves freely within [0, distanceKm]', () => {
    const shop: ShopStop = { id: 1, at: 50, name: 'Shop' };
    expect(moveShop(shop, 100, 10)).toBe(60);
  });

  test('clamps at the route start', () => {
    const shop: ShopStop = { id: 1, at: 10, name: 'Shop' };
    expect(moveShop(shop, 100, -50)).toBe(0);
  });

  test('clamps at the route end', () => {
    const shop: ShopStop = { id: 1, at: 90, name: 'Shop' };
    expect(moveShop(shop, 100, 50)).toBe(100);
  });
});

describe('clampFillToDistance', () => {
  test('leaves a fill alone when it already fits', () => {
    const f = fill({ from: 20, to: 40 });
    expect(clampFillToDistance(f, 100)).toBe(f);
  });

  test('shifts a fill left, preserving its width, when the route shrinks past its end', () => {
    const f = fill({ from: 70, to: 90 });
    expect(clampFillToDistance(f, 50)).toEqual({ ...f, from: 30, to: 50 });
  });

  test('shrinks the width too when the route is shorter than the fill itself', () => {
    const f = fill({ from: 70, to: 90 });
    expect(clampFillToDistance(f, 15)).toEqual({ ...f, from: 0, to: 15 });
  });

  test('rescales gel part positions along with the shifted span', () => {
    const f = fill({ content: 'gel', from: 70, to: 90, pos: [75, 85] });
    const result = clampFillToDistance(f, 50);
    expect(result.from).toBe(30);
    expect(result.to).toBe(50);
    expect(result.pos).toEqual([35, 45]);
  });
});

describe('clampFoodToDistance', () => {
  test('leaves a food item alone when it already fits', () => {
    const fd: FoodItem = { id: 1, key: 'ban', name: 'Banana', carbs: 25, from: 20, to: 20 };
    expect(clampFoodToDistance(fd, 100)).toBe(fd);
  });

  test('shifts left, preserving its width, when the route shrinks past its end', () => {
    const fd: FoodItem = {
      id: 1,
      key: 'chew',
      name: 'Chews',
      carbs: 30,
      cont: true,
      from: 70,
      to: 90,
    };
    expect(clampFoodToDistance(fd, 50)).toEqual({ ...fd, from: 30, to: 50 });
  });
});

describe('clampShopToDistance', () => {
  test('leaves a shop stop alone when it already fits', () => {
    const shop: ShopStop = { id: 1, at: 40, name: 'Shop' };
    expect(clampShopToDistance(shop, 100)).toBe(shop);
  });

  test('pulls it back to the new end of the route', () => {
    const shop: ShopStop = { id: 1, at: 90, name: 'Shop' };
    expect(clampShopToDistance(shop, 50)).toEqual({ ...shop, at: 50 });
  });
});

describe('nextShopAt', () => {
  test('midpoint between the start and the end when there are no markers yet', () => {
    expect(nextShopAt([], 100)).toBe(50);
  });

  test('midpoint between the last marker and the end', () => {
    const shops: ShopStop[] = [
      { id: 1, at: 20, name: 'Shop' },
      { id: 2, at: 60, name: 'Shop' },
    ];
    expect(nextShopAt(shops, 100)).toBe(80); // (60 + 100) / 2
  });
});
