import { carbsFill, cph, dist, distanceAtTime, timeAtDistance } from './fuel';
import type { Fill, FoodItem, MixSettings, PlanState, RouteInput, ShopStop, Vessel } from './types';

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
