// The narrow left column of the printed sheet: the ride schedule, grouped the way the desktop
// timeline groups it (bottles, then food, then stops) rather than merged into one chronological
// run. Pure data — content labels stay raw `Content` values and are worded by the component, so
// this module owes nothing to i18n beyond resolving a food's own library name.

import { fmtX, partsOf } from './fuel';
import type {
  Content,
  Fill,
  FoodItem,
  FoodLibEntry,
  RouteInput,
  ShopStop,
  Vessel,
  XUnit,
} from './types';
import type { Lang } from '../i18n/strings';

/**
 * One bottle's consecutive fills of the same content, listed under a single heading. A 30 mm strip
 * has no room for "Bidon 2 · Izo" and a range on one line, and repeating the bottle's name above
 * every refill wastes the rows that are left — so the name is said once and the legs stack under
 * it. A switch of content starts a new group, because that heading no longer describes the leg.
 */
export interface StripFillGroup {
  /** First fill in the group — stable enough to key a list on. */
  fid: number;
  vessel: string;
  content: Content;
  /** Gel portions per fill; 1 for anything else. */
  parts: number;
  ranges: string[];
}

export interface StripFoodRow {
  id: number;
  name: string;
  carbs: number;
  /** A point for a one-shot item, a range for a sipped one. */
  at: string;
}

/**
 * Consecutive stops sharing a name, under one heading — "Sklep / 150 / 225" rather than the name
 * repeated above every kilometre. Consecutive only: grouping every same-named stop would pull
 * kilometres out of ride order to sit under one heading.
 */
export interface StripStopGroup {
  /** First stop in the group — stable enough to key a list on. */
  id: number;
  name: string;
  ats: string[];
}

export interface PrintStrip {
  fills: StripFillGroup[];
  foods: StripFoodRow[];
  stops: StripStopGroup[];
}

export interface PrintStripInput {
  route: RouteInput;
  gear: Vessel[];
  fills: Fill[];
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
  shops: ShopStop[];
  xUnit: XUnit;
  lang: Lang;
}

/**
 * Display name per vessel id. Two bottles both called "Bidon" is the default state of a fresh
 * plan, and on screen the rider tells them apart by position; on a strip taped to the top tube
 * there is no position to read, so duplicates get numbered. Names held by a single vessel are
 * left exactly as typed.
 */
export function vesselLabels(gear: Vessel[]): Map<string, string> {
  const total = new Map<string, number>();
  for (const v of gear) total.set(v.name, (total.get(v.name) ?? 0) + 1);

  const seen = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const v of gear) {
    if ((total.get(v.name) ?? 0) < 2) {
      labels.set(v.gid, v.name);
      continue;
    }
    const n = (seen.get(v.name) ?? 0) + 1;
    seen.set(v.name, n);
    labels.set(v.gid, `${v.name} ${n}`);
  }
  return labels;
}

export function foodName(item: FoodItem, foodLib: FoodLibEntry[], lang: Lang): string {
  const entry = foodLib.find((x) => x.key === item.key);
  return (entry && (entry[lang] || entry.en)) || item.name || '—';
}

/**
 * Positions without the unit, unlike `rangeLabel` — on a 40 mm strip a trailing " km" is three
 * characters that push the label onto a second line, and the strip's header already says whether
 * the ride is measured in kilometres or hours.
 */
function span(a: number, b: number, point: boolean, route: RouteInput, xUnit: XUnit): string {
  const from = fmtX(a, false, route, xUnit);
  return point ? from : `${from}–${fmtX(b, false, route, xUnit)}`;
}

export function printStrip({
  route,
  gear,
  fills,
  foods,
  foodLib,
  shops,
  xUnit,
  lang,
}: PrintStripInput): PrintStrip {
  const labels = vesselLabels(gear);

  return {
    // Grouped by vessel, in the order the rider arranged their gear — a fill whose vessel has
    // been deleted has no group to sit in and is left out.
    fills: gear.flatMap((v) => {
      const own = fills.filter((f) => f.gid === v.gid).sort((a, b) => a.from - b.from);
      const groups: StripFillGroup[] = [];
      for (const f of own) {
        const range = span(f.from, f.to, false, route, xUnit);
        const open = groups[groups.length - 1];
        if (open && open.content === f.content) {
          open.ranges.push(range);
          continue;
        }
        groups.push({
          fid: f.fid,
          vessel: labels.get(v.gid) ?? v.name,
          content: f.content,
          parts: partsOf(f, gear),
          ranges: [range],
        });
      }
      return groups;
    }),
    foods: foods
      .slice()
      .sort((a, b) => a.from - b.from)
      .map((f): StripFoodRow => ({
        id: f.id,
        name: foodName(f, foodLib, lang),
        carbs: f.carbs,
        at: span(f.from, f.to, !f.cont, route, xUnit),
      })),
    stops: shops
      .slice()
      .sort((a, b) => a.at - b.at)
      .reduce((groups: StripStopGroup[], s) => {
        const at = span(s.at, s.at, true, route, xUnit);
        const open = groups[groups.length - 1];
        if (open && open.name === s.name) open.ats.push(at);
        else groups.push({ id: s.id, name: s.name, ats: [at] });
        return groups;
      }, []),
  };
}
