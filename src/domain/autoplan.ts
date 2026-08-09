import {
  carbsFill,
  cph,
  dist,
  distanceAtTime,
  prof,
  sweat,
  timeAtDistance,
  totalHours,
} from './fuel';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  PlanState,
  RouteInput,
  ShopStop,
  Vessel,
} from './types';

export const CONCENTRATED_MIX_THRESHOLD_G_PER_100ML = 15;

export type DraftFill = Omit<Fill, 'fid'>;
export type DraftFood = Omit<FoodItem, 'id' | 'name'>;
export type DraftShop = Omit<ShopStop, 'id' | 'name'>;

export interface FoodSelectionEntry {
  key: string;
  count: number;
}

export interface AutoplanResult {
  fills: DraftFill[];
  foods: DraftFood[];
  newShops: DraftShop[];
}

function isAllowed(v: Vessel, content: Fill['content']): boolean {
  return (v.allowed || []).includes(content);
}

export function shortRideFills(state: PlanState): DraftFill[] {
  const { route, gear } = state;
  const D = dist(route);
  return gear
    .filter((v) => isAllowed(v, 'water'))
    .map((v) => ({ gid: v.gid, content: 'water' as const, from: 0, to: D }));
}

export function bucketVessels(
  gear: Vessel[],
  mix: MixSettings,
): {
  gelVessels: Vessel[];
  izoVessels: Vessel[];
  waterOnly: Vessel[];
  reservedWaterVessel: Vessel | null;
} {
  const gelVessels = gear.filter((v) => isAllowed(v, 'gel'));
  const gelGids = new Set(gelVessels.map((v) => v.gid));
  const nonGel = gear.filter((v) => !gelGids.has(v.gid));

  const izoCandidates = nonGel.filter((v) => isAllowed(v, 'izo'));
  const waterOnly = nonGel.filter((v) => !isAllowed(v, 'izo'));

  let reservedWaterVessel: Vessel | null = null;
  let izoVessels = izoCandidates;
  if (mix.conc > CONCENTRATED_MIX_THRESHOLD_G_PER_100ML && izoCandidates.length > 0) {
    reservedWaterVessel = izoCandidates.reduce((a, b) => (b.vol > a.vol ? b : a));
    izoVessels = izoCandidates.filter((v) => v.gid !== reservedWaterVessel!.gid);
  }

  return { gelVessels, izoVessels, waterOnly, reservedWaterVessel };
}

export function sequentialFills(
  vessels: Vessel[],
  content: 'izo' | 'gel',
  route: RouteInput,
  gear: Vessel[],
  mix: MixSettings,
): { fills: DraftFill[]; totalCarbs: number; endX: number } {
  const D = dist(route);
  const rate = cph(route);
  const fills: DraftFill[] = [];
  let totalCarbs = 0;
  let startHours = 0;
  let endX = 0;

  vessels.forEach((v) => {
    const carbs = carbsFill({ fid: 0, gid: v.gid, content, from: 0, to: 0 }, gear, mix);
    const hours = rate > 0 ? carbs / rate : 0;
    const fromX = distanceAtTime(route, startHours);
    const toX = Math.min(D, distanceAtTime(route, startHours + hours));
    fills.push({ gid: v.gid, content, from: fromX, to: toX });
    totalCarbs += carbs;
    startHours += hours;
    endX = toX;
  });

  return { fills, totalCarbs, endX };
}

export function planIzoRefills(
  route: RouteInput,
  gear: Vessel[],
  mix: MixSettings,
  izoVessels: Vessel[],
  izoStartEndX: number,
  balance: number,
  existingShops: ShopStop[],
): { fills: DraftFill[]; newShops: DraftShop[]; finalBalance: number; stopXs: number[] } {
  const D = dist(route);
  const rate = cph(route);
  const fills: DraftFill[] = [];
  const newShops: DraftShop[] = [];
  const stopXs: number[] = [];

  let cursor = izoStartEndX;
  let remaining = balance;

  while (remaining > 0 && cursor < D && izoVessels.length > 0) {
    const nextExisting = existingShops.filter((s) => s.at >= cursor).sort((a, b) => a.at - b.at)[0];
    const stopX = nextExisting ? nextExisting.at : Math.round(cursor);
    if (!nextExisting) newShops.push({ at: stopX });
    stopXs.push(stopX);

    let legCarbs = 0;
    let legHours = timeAtDistance(route, stopX);
    izoVessels.forEach((v) => {
      const maxCarbs = carbsFill({ fid: 0, gid: v.gid, content: 'izo', from: 0, to: 0 }, gear, mix);
      const take = Math.min(maxCarbs, Math.max(0, remaining - legCarbs));
      if (take <= 0) return;
      const hours = rate > 0 ? take / rate : 0;
      const fromX = distanceAtTime(route, legHours);
      const toX = Math.min(D, distanceAtTime(route, legHours + hours));
      fills.push({ gid: v.gid, content: 'izo', from: fromX, to: toX });
      legCarbs += take;
      legHours += hours;
    });

    remaining -= legCarbs;
    if (legCarbs <= 0) break; // no vessel had spare capacity — stop rather than loop forever
    cursor = Math.max(stopX + 1, distanceAtTime(route, legHours));
  }

  return { fills, newShops, finalBalance: Math.max(0, remaining), stopXs };
}

const CLIMB_GRAD_THRESHOLD_PCT = 4;
const CLIMB_MIN_LENGTH_KM = 1;

export function findClimbStarts(route: RouteInput, fromX: number, toX: number): number[] {
  const P = prof(route);
  const starts: number[] = [];
  let runStart: number | null = null;

  for (const p of P.pts) {
    const inWindow = p.x >= fromX && p.x <= toX;
    const climbing = inWindow && p.grad >= CLIMB_GRAD_THRESHOLD_PCT;
    if (climbing && runStart === null) runStart = p.x;
    if (!climbing && runStart !== null) {
      if (p.x - runStart >= CLIMB_MIN_LENGTH_KM) starts.push(runStart);
      runStart = null;
    }
  }
  if (runStart !== null && P.D - runStart >= CLIMB_MIN_LENGTH_KM) starts.push(runStart);

  return starts;
}

export function selectItemsForAmount(
  selection: FoodSelectionEntry[],
  foodLib: FoodLibEntry[],
  amountToPlace: number,
): FoodLibEntry[] {
  const items: FoodLibEntry[] = [];
  let total = 0;

  for (const entry of selection) {
    for (let i = 0; i < entry.count; i++) {
      const libEntry = foodLib.find((f) => f.key === entry.key);
      if (!libEntry) break;
      items.push(libEntry);
      total += libEntry.carbs;
      if (total >= amountToPlace) return items;
    }
  }

  return items;
}

export function placeItemsEvenly(
  items: FoodLibEntry[],
  startX: number,
  D: number,
  route: RouteInput,
): DraftFood[] {
  const n = items.length;
  if (n === 0) return [];

  const span = Math.max(1, D - startX);
  const slotWidth = span / n;
  const climbXs = route.useGpx && route.gpxTrack ? findClimbStarts(route, startX, D) : [];
  let climbIdx = 0;

  return items.map((entry, i) => {
    let x = startX + slotWidth * (i + 0.5);
    while (climbIdx < climbXs.length && climbXs[climbIdx] < x - slotWidth / 2) climbIdx++;
    if (climbIdx < climbXs.length && climbXs[climbIdx] < x + slotWidth / 2) {
      x = climbXs[climbIdx];
      climbIdx++;
    }
    const from = Math.round(Math.max(startX, Math.min(D, x)));
    const to = entry.cont ? Math.min(D, from + (entry.span || 18)) : from;
    return { key: entry.key, carbs: entry.carbs, ml: entry.ml, cont: !!entry.cont, from, to };
  });
}

export function fluidCapacityStopX(
  route: RouteInput,
  waterVessels: Vessel[],
  firstPlannedStopX: number,
): number | null {
  const totalCapacityMl = waterVessels.reduce((a, v) => a + v.vol, 0);
  const sweatRate = sweat(route);
  if (sweatRate <= 0 || totalCapacityMl <= 0) return null;
  const maxHours = totalCapacityMl / sweatRate;
  const maxX = distanceAtTime(route, maxHours);
  return maxX < firstPlannedStopX ? Math.round(maxX) : null;
}

export function assignWaterLegs(waterVessels: Vessel[], stopXs: number[], D: number): DraftFill[] {
  const bounds = [0, ...stopXs.slice().sort((a, b) => a - b), D];
  const fills: DraftFill[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const from = bounds[i];
    const to = bounds[i + 1];
    if (to - from < 1) continue;
    waterVessels.forEach((v) => fills.push({ gid: v.gid, content: 'water', from, to }));
  }
  return fills;
}

export function autoplan(state: PlanState, selection: FoodSelectionEntry[]): AutoplanResult {
  const { route, mix, gear, foodLib } = state;
  const shops = (state as any).shops || [];
  const D = dist(route);

  if (totalHours(route) < 1) {
    return { fills: shortRideFills(state), foods: [], newShops: [] };
  }

  const { gelVessels, izoVessels, waterOnly, reservedWaterVessel } = bucketVessels(gear, mix);

  const gel = sequentialFills(gelVessels, 'gel', route, gear, mix);
  const izoStart = sequentialFills(izoVessels, 'izo', route, gear, mix);
  const startCarbs = gel.totalCarbs + izoStart.totalCarbs;

  const target = totalHours(route) * cph(route);
  const selectedFoodCarbs = selection.reduce((a, s) => {
    const entry = foodLib.find((f) => f.key === s.key);
    return a + (entry ? entry.carbs * s.count : 0);
  }, 0);
  const balance = target - startCarbs - selectedFoodCarbs;

  const refill =
    balance > 0 && izoVessels.length > 0
      ? planIzoRefills(route, gear, mix, izoVessels, izoStart.endX, balance, shops)
      : {
          fills: [] as DraftFill[],
          newShops: [] as DraftShop[],
          finalBalance: 0,
          stopXs: [] as number[],
        };

  const refillAmount = balance > 0 && izoVessels.length > 0 ? balance - refill.finalBalance : 0;
  const totalBottleCarbs = startCarbs + refillAmount;
  const foodTarget = Math.max(0, target - totalBottleCarbs);
  const items = selectItemsForAmount(selection, foodLib, foodTarget);
  const foods = placeItemsEvenly(items, izoStart.endX, D, route);

  const waterVessels = [...waterOnly, ...(reservedWaterVessel ? [reservedWaterVessel] : [])];
  let stopXs = refill.stopXs;
  let extraShops: DraftShop[] = [];
  const firstStopX = stopXs.length ? Math.min(...stopXs) : D;
  const fluidStopX = fluidCapacityStopX(route, waterVessels, firstStopX);
  if (fluidStopX !== null && fluidStopX > 0) {
    const nearExisting = shops.find((s: any) => Math.abs(s.at - fluidStopX) < 3);
    if (nearExisting) {
      stopXs = [...stopXs, nearExisting.at];
    } else {
      stopXs = [...stopXs, fluidStopX];
      extraShops = [{ at: fluidStopX }];
    }
  }

  const waterFills = assignWaterLegs(waterVessels, stopXs, D);

  return {
    fills: [...gel.fills, ...izoStart.fills, ...refill.fills, ...waterFills],
    foods,
    newShops: [...refill.newShops, ...extraShops],
  };
}
