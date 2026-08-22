import type {
  CitricSource,
  Content,
  Fill,
  FoodItem,
  MixSettings,
  PlanState,
  RatioPreset,
  RouteInput,
  Vessel,
  XUnit,
} from './types';

const FLUID_ABSORPTION_CAP_ML_H = 750;

/**
 * A rider doesn't start a ride dehydrated — losing fluid up to this fraction of body mass is a
 * tolerable buffer before replacement becomes urgent, same physiological idea as `preRideGut()`
 * giving carbs a head start instead of demanding fresh intake from km 0. Same value (weight_kg ×
 * 15) is planned for autoplan.ts's short-ride hydration gate ("should we even plan water") — not
 * implemented there yet, so there's no enforced coupling today; keep the two in sync by hand if
 * one changes. Deliberately below the ~2% ACSM danger-limit figure so the app doesn't plan right
 * up to the edge.
 */
const HYDRATION_BUFFER_ML_PER_KG = 15;

/**
 * Where the *carb* bar turns green. A tolerance the badge applies on top of the honest 100% target
 * (see `fluidNeed` on `Sample`), not a discount baked into what any chart line asks for.
 *
 * Was 85 while `coverage` over-credited (it divided by an EMA-shrunk denominator; see rateStats).
 * Fixing that arithmetic made the same plan read a few points lower, so the thresholds moved down
 * with it to keep "good enough" meaning what it meant to the rider who calibrated it: of the 43
 * non-empty saved plans in docs/tests, 85/60 reclassified 9 downward — including the rider's own
 * hand-built izo-6, verified at the time as green — while 80/55 changes exactly one verdict
 * (mix-5-autoplan at 82%, upward). The number moved so the judgement wouldn't.
 */
export const COVERAGE_TARGET_PCT = 80;

/** Below this, a carb plan isn't "a bit short" any more — it's a different plan. */
export const COVERAGE_SHORT_PCT = 55;

/** Chart reference line for typical untrained gut carb-absorption capacity, g/h. */
export const GUT_LIMIT = 60;

/**
 * Where the *hydration* bar turns green — deliberately not the carb number.
 *
 * These two were briefly shared. That was wrong for a reason worth recording: only the carb
 * arithmetic changed, so moving the shared pair recalibrated hydration on carb evidence, and a
 * plan at 59% of sweat loss silently went red→amber (`food-7`/`food7` in docs/tests) without
 * anyone deciding it should. Asked and answered by the rider: dehydration is not the same kind of
 * failure as running low on carbs — bonking hurts, hyperthermia is dangerous — so water keeps the
 * stricter 85/60 it always had on desktop and does not inherit the carb recalibration.
 *
 * `hydrationPct` is unchanged by any of this: still the plain `fluidPlanned / sweatLoss` ratio,
 * reported as 100 below the short-ride gate. Note this is also stricter than the `>= 70` the
 * *mobile* card used to apply on its own — that number was never calibrated against anything and
 * disagreed with desktop, which is the whole class of bug this work set out to remove.
 */
export const HYDRATION_TARGET_PCT = 85;

/** Amber/red split for water. Same reasoning as `HYDRATION_TARGET_PCT`. */
export const HYDRATION_SHORT_PCT = 60;

/**
 * How much unused absorbed carb `rateStats` lets a rider carry forward, expressed as minutes of
 * their own hourly requirement. This is the body's tolerance for uneven delivery — gut contents
 * plus the immediately available glycogen pool — and it is what stops the coverage metric from
 * grading the model's 90-second sampling seam instead of the plan. See rateStats() for the full
 * reasoning and the measurements behind this value.
 */
const COVERAGE_CARRY_MINUTES = 15;

export type CoverageStatus = 'good' | 'partial' | 'short';

function tier(pct: number, targetPct: number, shortPct: number): CoverageStatus {
  if (pct >= targetPct) return 'good';
  if (pct < shortPct) return 'short';
  return 'partial';
}

/**
 * The verdict on the *carb* bar, for both the desktop cards and the mobile plan list. Colours
 * differ per layout (different palettes, different backgrounds); the *thresholds behind them*
 * must not, or the same plan reads as fine on one screen and short on the other — which is
 * exactly the bug this pair of functions exists to prevent. One mechanism, two calibrations:
 * carbs and water each get their own numbers, but neither layout gets to invent its own.
 */
export function coverageStatus(pct: number): CoverageStatus {
  return tier(pct, COVERAGE_TARGET_PCT, COVERAGE_SHORT_PCT);
}

/** The verdict on the *hydration* bar — stricter than carbs on purpose, see
 *  `HYDRATION_TARGET_PCT`. Same three tiers, so both layouts can share one palette. */
export function hydrationStatus(pct: number): CoverageStatus {
  return tier(pct, HYDRATION_TARGET_PCT, HYDRATION_SHORT_PCT);
}
const PROFILE_SAMPLES = 160;
const PACE_UP_K = 0.1;
const PACE_DOWN_K = 0.07;
const PACE_DOWN_FLOOR = 0.55;

export function timeWeight(gradPercent: number): number {
  if (gradPercent >= 0) return 1 + gradPercent * PACE_UP_K;
  return Math.max(PACE_DOWN_FLOOR, 1 + gradPercent * PACE_DOWN_K);
}

export interface ProfilePoint {
  x: number;
  ele: number;
  grad: number;
  effort: number;
}

export interface Profile {
  pts: ProfilePoint[];
  cum: number[];
  /** Raw, unnormalized cumulative pace-weighted distance — divide by cumTime[N] for a 0-1 ratio. */
  cumTime: number[];
  N: number;
  D: number;
}

export type ActiveSource = Content | 'food' | null;

export interface Sample {
  x: number;
  intake: number;
  absorbed: number;
  gut: number;
  ml: number;
  /** Cumulative fluid that has actually cleared the stomach, capped at
   *  `FLUID_ABSORPTION_CAP_ML_H` the same way `absorbed` caps carb intake — `ml` is what was
   *  poured, this is what physiologically got through. `fluidRate` is derived from this, not `ml`. */
  mlAbsorbed: number;
  need: number;
  active: ActiveSource;
  rate: number;
  needRate: number;
  /** Actual fluid delivery rate — causally smoothed (double-pass EMA, ~6min time constant) so
   *  fill-boundary transitions ease in as a gentle S-curve instead of an instant cliff. */
  fluidRate: number;
  /** Cumulative fluid the rider should have replaced by this point — the full sweat loss
   *  (`sweatRate × hours`, 0 below the short-ride buffer gate) distributed by effort the same way
   *  `need` is for carbs, so climbs carry more of the requirement than descents. Not discounted by
   *  `HYDRATION_TARGET_PCT` — that's a separate, more lenient tolerance the badge applies on top. */
  fluidNeed: number;
  /** Instantaneous per-step derivative of `fluidNeed` — see `fluidRate`, same reasoning. */
  fluidNeedRate: number;
}

export interface RateStats {
  /** Share of the ride's carb requirement actually met *as the ride goes*, 0-100. See rateStats(). */
  coverage: number;
  /** Grams behind `coverage` — the numerator, so the UI can print "X / target g" without
   *  reaching for a different quantity than the percentage was computed from. */
  coveredCarbs: number;
  samples: Sample[];
}

export function totalHours(route: RouteInput): number {
  if (route.mode === 'route') return route.speed > 0 ? route.distance / route.speed : 0;
  return (route.hours || 0) + (route.minutes || 0) / 60;
}

export function dist(route: RouteInput): number {
  if (route.mode === 'route') return Math.max(1, route.distance);
  return Math.max(1, Math.round(totalHours(route) * 10));
}

export function cph(route: RouteInput): number {
  const h = totalHours(route);
  const i = route.intensity;
  if (h < 1) return i === 'high' ? 60 : i === 'low' ? 30 : 45;
  if (h <= 2.5) return i === 'low' ? 30 : i === 'high' ? 60 : 45;
  return i === 'low' ? 60 : i === 'high' ? 90 : 75;
}

export function sweat(route: RouteInput): number {
  const base = 380 + Math.max(0, route.temp - 15) * 42;
  const iB = route.intensity === 'high' ? 220 : route.intensity === 'low' ? 0 : 110;
  return Math.round(((base + iB) * (route.weight / 75)) / 10) * 10;
}

/**
 * Gut absorption ceiling (g/h). izo and gel can each have their own malto:fructose ratio, so
 * this blends `ratio`/`gelRatio` weighted by how much each content type actually contributes
 * to the plan's carbs (izoCarbs/gelCarbs) — a rider fuelling mostly from a low-ratio gel has a
 * lower real cap than a pure-izo plan would suggest, and vice versa.
 *
 * izoCarbs/gelCarbs default to 0 (no split known), which falls back to the izo ratio alone —
 * used by UI spots that only have `mix` in scope with no plan/fills yet to weigh (the footer's
 * absorption note, the mobile "Me" tab, and the mix-editing screen's live preview), rather than
 * pretending to know a real-world split. Call sites that do have fills/gear (samples() below,
 * the desktop/mobile charts) pass the actual carb totals for a true blended figure.
 */
export function absCap(mix: MixSettings, izoCarbs = 0, gelCarbs = 0): number {
  const rIzo = mix.ratio || 2;
  const rGel = mix.gelRatio || 2;
  const gluIzo = rIzo / (rIzo + 1);
  const gluGel = rGel / (rGel + 1);
  const total = izoCarbs + gelCarbs;
  const wGel = total > 0 ? gelCarbs / total : 0;
  const wIzo = 1 - wGel;
  const glu = wIzo * gluIzo + wGel * gluGel;
  const fru = 1 - glu;
  return Math.round(Math.max(45, Math.min(95, Math.min(60 / glu, 32 / fru))));
}

export function preRideGut(route: RouteInput, cap: number): number {
  const preRideHours = route.preMealMinutes / 60;
  return Math.max(0, route.preMealCarbs - cap * preRideHours);
}

const SYNTHETIC_ANCHORS: [number, number][] = [
  [0, 120],
  [0.1, 165],
  [0.16, 185],
  [0.3, 620],
  [0.38, 300],
  [0.5, 345],
  [0.56, 300],
  [0.72, 900],
  [0.8, 520],
  [0.88, 610],
  [1, 140],
];

export function prof(route: RouteInput): Profile {
  const T = route.gpxTrack;
  const D = dist(route);
  const N = PROFILE_SAMPLES;
  const pts: ProfilePoint[] = [];
  const hasTrackPoints = !!T && T.ele.length > 0;

  for (let i = 0; i <= N; i++) {
    const f = i / N;
    if (hasTrackPoints && T) {
      const g = f * (T.ele.length - 1);
      const a = Math.floor(g);
      const b = Math.min(T.ele.length - 1, a + 1);
      pts.push({ x: D * f, ele: T.ele[a] + (T.ele[b] - T.ele[a]) * (g - a), grad: 0, effort: 1 });
      continue;
    }
    // T.ele can end up empty from corrupted/hand-edited persisted state (the zustand `merge`
    // above applies persisted JSON with no shape validation) or a settings import that predates
    // the length check in settingsExport.ts. A single point is fine — the interpolation above
    // resolves it to that one elevation for every sample — but an empty array makes
    // `f * (T.ele.length - 1)` go negative and index out of bounds, producing NaN. Flat 0 here
    // avoids that without flashing the synthetic demo terrain (which implies no track at all)
    // for what is nominally real GPX data.
    if (T) {
      pts.push({ x: D * f, ele: 0, grad: 0, effort: 1 });
      continue;
    }
    let j = 1;
    while (j < SYNTHETIC_ANCHORS.length - 1 && SYNTHETIC_ANCHORS[j][0] < f) j++;
    const [f0, e0] = SYNTHETIC_ANCHORS[j - 1];
    const [f1, e1] = SYNTHETIC_ANCHORS[j];
    const k = (f - f0) / (f1 - f0);
    const noise = Math.sin(f * 91) * 16 + Math.sin(f * 233) * 8 + Math.sin(f * 37) * 22;
    pts.push({ x: D * f, ele: Math.max(40, e0 + (e1 - e0) * k + noise), grad: 0, effort: 1 });
  }

  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(N, i + 1)];
    const dx = (b.x - a.x) * 1000;
    pts[i].grad = dx > 0 ? ((b.ele - a.ele) / dx) * 100 : 0;
    pts[i].effort = route.useGpx
      ? Math.max(0.32, Math.min(2.3, 1 + pts[i].grad * (pts[i].grad > 0 ? 0.19 : 0.11)))
      : 1;
  }

  const cum = [0];
  for (let i = 1; i <= N; i++) cum[i] = cum[i - 1] + (pts[i].effort + pts[i - 1].effort) / 2;

  const cumTime = [0];
  for (let i = 1; i <= N; i++) {
    const wA = route.useGpx ? timeWeight(pts[i - 1].grad) : 1;
    const wB = route.useGpx ? timeWeight(pts[i].grad) : 1;
    cumTime[i] = cumTime[i - 1] + (pts[i].x - pts[i - 1].x) * ((wA + wB) / 2);
  }

  return { pts, cum, cumTime, N, D };
}

export function eff(route: RouteInput, x: number): number {
  const P = prof(route);
  const f = Math.max(0, Math.min(1, x / P.D)) * P.N;
  const i = Math.floor(f);
  if (i >= P.N) return P.cum[P.N];
  return P.cum[i] + (P.cum[i + 1] - P.cum[i]) * (f - i);
}

export function timeAtDistance(route: RouteInput, km: number): number {
  const P = prof(route);
  const total = P.cumTime[P.N] || 1;
  const f = Math.max(0, Math.min(1, km / P.D)) * P.N;
  const i = Math.floor(f);
  const raw =
    i >= P.N ? P.cumTime[P.N] : P.cumTime[i] + (P.cumTime[i + 1] - P.cumTime[i]) * (f - i);
  return (raw / total) * totalHours(route);
}

export function distanceAtTime(route: RouteInput, hours: number): number {
  const P = prof(route);
  const total = P.cumTime[P.N] || 1;
  const totHrs = totalHours(route);
  const targetRaw = totHrs > 0 ? (hours / totHrs) * total : 0;
  if (targetRaw <= 0) return 0;
  if (targetRaw >= total) return P.D;
  let i = 0;
  while (i < P.N && P.cumTime[i + 1] < targetRaw) i++;
  const segSpan = P.cumTime[i + 1] - P.cumTime[i] || 1;
  const segFrac = (targetRaw - P.cumTime[i]) / segSpan;
  return P.pts[i].x + (P.pts[i + 1].x - P.pts[i].x) * segFrac;
}

function effTotal(route: RouteInput): number {
  const P = prof(route);
  return P.cum[P.N] || 1;
}

export function findVessel(gid: string, gear: Vessel[]): Vessel | undefined {
  return gear.find((g) => g.gid === gid);
}

export function volOf(fill: Fill, gear: Vessel[]): number {
  const v = findVessel(fill.gid, gear);
  return v ? v.vol : 0;
}

export function carbsFill(fill: Fill, gear: Vessel[], mix: MixSettings): number {
  if (fill.content === 'water') return 0;
  return (volOf(fill, gear) / 100) * (fill.content === 'gel' ? mix.gelConc : mix.conc);
}

export function mixSplit(carbsG: number, ratio: number): { malto: number; fructose: number } {
  const r = ratio || 2;
  return { malto: (carbsG * r) / (r + 1), fructose: carbsG / (r + 1) };
}

export function presetTagFor(r: number): RatioPreset {
  if (r === 2) return 'iso';
  if (r === 1) return 'sugar';
  if (r === 0.8) return 'honey';
  if (r === 1.5) return 'ratio15';
  return 'custom';
}

/**
 * Which of `presets` (if any) the current ratio/preset pair points at — both must match, since
 * `preset` disambiguates a numerically-coincidental custom entry from an actual preset pick (see
 * RatioPreset's doc comment). Returns -1 when neither, meaning the free-entry "custom" slot is
 * the one selected. Shared by desktop MixPanel.tsx and mobile MobileMix.tsx so their ratio
 * pickers can't drift apart on which segment lights up.
 */
export function ratioPresetIndex(
  value: number,
  preset: RatioPreset,
  presets: readonly number[],
): number {
  return presets.findIndex((r) => value === r && preset === presetTagFor(r));
}

// Honey is roughly 80% carbohydrate by weight — the rest is mostly water, plus trace
// minerals and enzymes. A rough real-world ballpark (varies ~76-83% by floral source
// and moisture content), not a lab figure — enough to turn "73g of carbs from honey"
// into "that's about 91g of honey to weigh into the bottle," which is the number a
// rider actually needs at the kitchen scale. Sugar (sucrose) needs no such conversion —
// it's ≈100% carbohydrate — so this helper is honey-specific.
const HONEY_CARB_FRACTION = 0.8;

export function honeyGramsFromCarbs(carbsG: number): number {
  return carbsG / HONEY_CARB_FRACTION;
}

export type FruitSpecies = 'lemon' | 'lime';

// Approximate citric-acid concentration of fresh juice (g per ml), used only to turn a
// citric-acid-equivalent gram figure into a practical "squeeze this much juice" amount for the
// lemon/lime sources. Citric acid powder is ~100% citric acid, so it needs no conversion. These
// are rough real-world ballparks (lemon ~5% w/v, lime ~6% w/v, lime being slightly more acidic),
// not a precise nutritional reference — good enough for a recipe card, not a lab.
const JUICE_CITRIC_YIELD_G_PER_ML: Record<FruitSpecies, number> = {
  lemon: 0.05,
  lime: 0.06,
};

// Roughly how much juice one whole average fruit yields — again a kitchen-table ballpark
// (fruit size varies a lot), not a lab figure, just enough to turn "you need ~20ml of lemon
// juice" into "that's about 1/2 a lemon" for the whole-fruit sources.
const JUICE_ML_PER_WHOLE_FRUIT: Record<FruitSpecies, number> = {
  lemon: 45,
  lime: 30,
};

const FRUIT_SPECIES_OF: Record<Exclude<CitricSource, 'citric'>, FruitSpecies> = {
  lemon: 'lemon',
  lemonJuice: 'lemon',
  lime: 'lime',
  limeJuice: 'lime',
};

export interface CitricAmount {
  amount: number;
  /** 'g' for citric acid powder, 'ml' for bottled/squeezed juice, 'fruit' for a fraction of one whole fruit. */
  unit: 'g' | 'ml' | 'fruit';
}

/**
 * Converts a citric-acid-equivalent gram amount into the practical amount/unit for the given
 * source: grams for plain citric acid, ml of juice for the juice sources, or a raw (unrounded)
 * fraction of one whole fruit for the whole-fruit sources — e.g. 0.0889, not "rounded to the
 * nearest quarter". This is the single source of truth for "how much fruit this grams value
 * represents"; callers that want a clean kitchen-friendly quarter fraction for display (recipe
 * cards) should round via `fmtFruitFraction`/`fmtFruitFractionPct` at the point they format it,
 * not here — baking that rounding in here previously meant small, perfectly real settings (e.g.
 * the default 0.2g/100ml citric, which is ~8.9% of a lemon) collapsed to 0 before ever reaching
 * the editable settings-panel percentage display.
 */
export function citricAmount(gramsCitricAcid: number, source: CitricSource): CitricAmount {
  if (source === 'citric') return { amount: gramsCitricAcid, unit: 'g' };
  const species = FRUIT_SPECIES_OF[source];
  const yieldPerMl = JUICE_CITRIC_YIELD_G_PER_ML[species];
  const ml = yieldPerMl > 0 ? gramsCitricAcid / yieldPerMl : 0;
  if (source === 'lemonJuice' || source === 'limeJuice') return { amount: ml, unit: 'ml' };
  const mlPerFruit = JUICE_ML_PER_WHOLE_FRUIT[species];
  const fraction = mlPerFruit > 0 ? ml / mlPerFruit : 0;
  return { amount: fraction, unit: 'fruit' };
}

/**
 * Inverse of `citricAmount`: converts a practical amount (grams of powder, ml of juice, or a
 * fraction of one whole fruit) for the given source back into the citric-acid-equivalent grams
 * that `MixSettings.citric`/`gelCitric` store internally. Used by the mix-settings editor so the
 * input can be shown/edited in whichever unit matches the selected source while the underlying
 * stored value stays grams. Exact for all sources including the whole-fruit ones now that
 * `citricAmount` returns the raw unrounded fraction — round-tripping any fraction (quarter-aligned
 * or not) through `citricAmount`/`citricGramsFromAmount` reproduces the original grams exactly.
 */
export function citricGramsFromAmount(amount: number, source: CitricSource): number {
  if (source === 'citric') return amount;
  const species = FRUIT_SPECIES_OF[source];
  const yieldPerMl = JUICE_CITRIC_YIELD_G_PER_ML[species];
  if (source === 'lemonJuice' || source === 'limeJuice') return amount * yieldPerMl;
  const mlPerFruit = JUICE_ML_PER_WHOLE_FRUIT[species];
  return amount * mlPerFruit * yieldPerMl;
}

/**
 * The whole-fruit citric source stores/computes in a 0-1 fraction-of-one-fruit unit (see
 * `citricAmount`/`citricGramsFromAmount` above, which stay in that unit deliberately — the
 * grams<->fraction math doesn't change here). This pair of helpers is a presentation-layer-only
 * rescale so settings inputs (desktop's `MixPanel.tsx`, mobile's `MobileMix.tsx`) read and edit
 * a percentage (0-100+, e.g. "50" for half a fruit) instead of a raw fraction (e.g. "0.5") —
 * matching the ml-of-juice input's directly usable scale. The 'ml'/'g' units pass through
 * unchanged.
 */
export function citricDisplayAmount(amount: number, unit: CitricAmount['unit']): number {
  return unit === 'fruit' ? amount * 100 : amount;
}

export function citricAmountFromDisplay(displayValue: number, unit: CitricAmount['unit']): number {
  return unit === 'fruit' ? displayValue / 100 : displayValue;
}

const FRACTION_TEXT: Record<number, string> = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' };

/**
 * Formats a fraction-of-a-fruit amount as a compact numeral, rounding to the nearest quarter
 * itself (0 → "0", 0.25 → "1/4", 1 → "1", 1.25 → "1 1/4") — `citricAmount` now hands back the raw,
 * unrounded fraction (e.g. 0.089), so this is the only place that quantizes it to a clean
 * kitchen-friendly quarter for display; a raw fraction under 1/8 (e.g. 0.089) rounds down to "0".
 *
 * This used to render fractional amounts with unicode fraction glyphs (¼ ½ ¾), but those glyphs
 * render nearly invisible/thin in several fonts used by the app, so they're spelled out as plain
 * ASCII text instead. Kept deliberately compact (no percentage) — see `fmtFruitFractionPct` for
 * the recipe-card display that adds a percentage alongside this numeral.
 */
export function fmtFruitFraction(n: number): string {
  if (n <= 0) return '0';
  const whole = Math.floor(n + 1e-9);
  const frac = Math.round((n - whole) * 4) / 4;
  const fracText = FRACTION_TEXT[frac];
  if (!fracText) return String(whole);
  return whole === 0 ? fracText : `${whole} ${fracText}`;
}

/**
 * Recipe-card display for a whole-fruit citric amount: `fmtFruitFraction`'s ASCII numeral, plus a
 * percentage in parentheses when the amount is under one whole fruit, e.g. 0.75 → "3/4 (75%)".
 * The percentage only reads intuitively as "fraction of one fruit" below 1 — past that point the
 * mixed-number fraction alone already communicates the quantity clearly, and tacking on a
 * percentage there (e.g. "6 3/4 (675%)") looks like noise or a typo rather than useful info. So
 * amounts at or above 1 whole fruit skip it entirely: 1 → "1", 1.25 → "1 1/4", 6.75 → "6 3/4".
 */
export function fmtFruitFractionPct(n: number): string {
  const numeral = fmtFruitFraction(n);
  const hasFraction = n > 0 && n < 1 && numeral !== '0';
  return hasFraction ? `${numeral} (${Math.round(n * 100)}%)` : numeral;
}

export function partsOf(fill: Fill, gear: Vessel[]): number {
  if (fill.content !== 'gel') return 1;
  const v = findVessel(fill.gid, gear);
  return Math.max(1, Math.round((v && v.gelParts) || 1));
}

export function partPos(fill: Fill, k: number, gear: Vessel[]): number {
  const n = partsOf(fill, gear);
  if (n <= 1) return fill.from;
  const even = fill.from + ((fill.to - fill.from) * k) / (n - 1);
  if (!fill.pos || fill.pos.length !== n || fill.pos[k] == null) return even;
  return Math.max(fill.from, Math.min(fill.to, fill.pos[k]));
}

export function partArray(fill: Fill, gear: Vessel[]): number[] {
  const n = partsOf(fill, gear);
  const arr: number[] = [];
  for (let k = 0; k < n; k++) arr.push(partPos(fill, k, gear));
  return arr;
}

export function fracFill(fill: Fill, x: number, gear: Vessel[], route: RouteInput): number {
  const n = partsOf(fill, gear);
  if (n > 1) {
    let c = 0;
    for (let k = 0; k < n; k++) if (x >= partPos(fill, k, gear)) c++;
    return c / n;
  }
  if (fill.to <= fill.from) return x >= fill.from ? 1 : 0;
  const a = eff(route, fill.from);
  const b = eff(route, fill.to);
  if (b <= a) return x >= fill.from ? 1 : 0;
  return Math.max(0, Math.min(1, (eff(route, x) - a) / (b - a)));
}

export function fracFood(food: FoodItem, x: number, route: RouteInput): number {
  if (!food.cont || food.to <= food.from) return x >= food.from ? 1 : 0;
  const a = eff(route, food.from);
  const b = eff(route, food.to);
  if (b <= a) return x >= food.from ? 1 : 0;
  return Math.max(0, Math.min(1, (eff(route, x) - a) / (b - a)));
}

export function samples(state: PlanState): Sample[] {
  const { route, mix, gear, fills, foods } = state;
  const D = dist(route);
  const hrs = totalHours(route);
  const target = hrs * cph(route);
  const N = PROFILE_SAMPLES;
  const tot = effTotal(route);
  const izoCarbs = fills
    .filter((f) => f.content === 'izo')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const gelCarbs = fills
    .filter((f) => f.content === 'gel')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const cap = absCap(mix, izoCarbs, gelCarbs);
  // Assumes equal time per equal-distance sample (flat-pace approximation); the chart's
  // time axis is now terrain-aware (see timeAtDistance) but this absorption model is not — a
  // known, deliberate scope boundary, not an oversight.
  const dt = hrs / N;
  const sweatRate = sweat(route);

  const hydrationBuffer = route.weight * HYDRATION_BUFFER_ML_PER_KG;
  const sweatLoss = sweatRate * hrs;
  // Unlike carbs, fluid has no real digestion-lag physiology (the stomach passes water on to the
  // gut quickly; there's no enzyme-limited absorption cap the way there is for carbs), so a
  // time-varying "ramp" had no physiological basis. Real hydration guidance is stated as a flat
  // rate (ml/h) anyway, so the target is one constant rate for the whole ride.
  //
  // The total behind that flat rate is the full, undiscounted sweat loss (100%) — not
  // `HYDRATION_TARGET_PCT` and not sweat loss minus the buffer. The chart's job is to show the
  // honest physiological target; that constant is a separate, more lenient tolerance the *badge*
  // applies on top (via `hydrationStatus`) to decide "is this still good enough," not something
  // baked into what the line itself asks for. An earlier version used the buffer here and made
  // the chart say "you're above the line" while the badge still read 79% and amber for the same
  // plan — confirmed on a real reproduction; using the true 100% total instead means falling
  // short of the total always shows up as the actual line dipping below the target, honestly.
  //
  // Below the short-ride gate (sweatLoss < buffer — the same threshold that decides whether
  // autoplan bothers suggesting water stops at all) there's honestly nothing to plan for, so the
  // target stays at 0 rather than asking for a loss too small to act on.
  const totalFluidNeed = sweatLoss < hydrationBuffer ? 0 : sweatLoss;
  const out: Sample[] = [];
  let gut = preRideGut(route, cap);
  let absorbed = 0;
  let prevIn = 0;
  let fluidGut = 0;
  let mlAbsorbed = 0;
  let prevMl = 0;

  for (let i = 0; i <= N; i++) {
    const x = (D * i) / N;
    let intake = 0;
    let ml = 0;
    let rateAtX = 0;
    let active: ActiveSource = null;

    fills.forEach((f) => {
      intake += carbsFill(f, gear, mix) * fracFill(f, x, gear, route);
      if (f.content !== 'gel') ml += volOf(f, gear) * fracFill(f, x, gear, route);
      if (x >= f.from - D * 0.004 && x <= f.to + D * 0.004) {
        const r = carbsFill(f, gear, mix) / Math.max(0.1, f.to - f.from);
        if (r > rateAtX) {
          rateAtX = r;
          active = f.content;
        }
      }
    });

    foods.forEach((fd) => {
      intake += fd.carbs * fracFood(fd, x, route);
      ml += (fd.ml || 0) * fracFood(fd, x, route);
      if (x >= fd.from - D * 0.004 && x <= fd.to + D * 0.004) {
        const r = fd.carbs / Math.max(0.1, fd.to - fd.from);
        if (r > rateAtX) {
          rateAtX = r;
          active = 'food';
        }
      }
    });

    gut += Math.max(0, intake - prevIn);
    prevIn = intake;
    if (i) {
      const take = Math.min(gut, cap * dt);
      gut -= take;
      absorbed += take;
    }

    // Same gut-buffer treatment as carbs above: the stomach can only pass fluid on to the gut at
    // FLUID_ABSORPTION_CAP_ML_H, so pouring faster than that doesn't get absorbed any faster — it
    // backs up in the stomach and comes through once the drinking rate drops back below the cap
    // (or, if the ride ends first, never counts at all).
    fluidGut += Math.max(0, ml - prevMl);
    prevMl = ml;
    if (i) {
      const take = Math.min(fluidGut, FLUID_ABSORPTION_CAP_ML_H * dt);
      fluidGut -= take;
      mlAbsorbed += take;
    }

    out.push({
      x,
      intake,
      absorbed,
      gut,
      ml,
      mlAbsorbed,
      need: target * (eff(route, x) / tot),
      active,
      rate: 0,
      needRate: 0,
      fluidRate: 0,
      fluidNeed: totalFluidNeed * (eff(route, x) / tot),
      fluidNeedRate: 0,
    });
  }

  // Exponential moving average (time constant ~30 min) instead of a fixed
  // backward window: a boxcar window has a hard trailing edge, so any past
  // intake spike falling out of it produces a fake bump with no current
  // cause. EMA decays past events smoothly, so it can't ring like that.
  const tau = 0.5;
  const alpha = dt > 0 ? 1 - Math.exp(-dt / tau) : 1;

  // Seed the EMA by simulating the pre-ride meal's own digestion (same cap,
  // same dt) back to when it was eaten, so the rate right at the start line
  // reflects how recently digestion actually caught up — continuous in
  // preMealCarbs, instead of preRideGut()'s single leftover-or-not value.
  let rateEma = 0;
  if (dt > 0) {
    let gutPre = route.preMealCarbs;
    const preSteps = Math.max(0, Math.round(route.preMealMinutes / 60 / dt));
    for (let k = 0; k < preSteps; k++) {
      const take = Math.min(gutPre, cap * dt);
      gutPre -= take;
      rateEma += alpha * (take / dt - rateEma);
    }
  }

  let needRateEma = 0;
  for (let i = 0; i <= N; i++) {
    if (i > 0) {
      rateEma += alpha * ((out[i].absorbed - out[i - 1].absorbed) / dt - rateEma);
      needRateEma += alpha * ((out[i].need - out[i - 1].need) / dt - needRateEma);
    }
    out[i].rate = rateEma;
    out[i].needRate = needRateEma;
  }

  // fluidRate and fluidNeedRate deliberately skip the long (~30min) EMA above: `rate`/`needRate`
  // smooth real carb events (eating, gut digestion) that genuinely lag behind intake by that much
  // — water has no equivalent physiology, and `ml`/`fluidNeed` are both already smooth,
  // deterministic curves, so the long filter only added a fake "warm-up" curve at the start of the
  // ride with no physiological meaning (confirmed on a real deployed preview). But a *plain* raw
  // derivative isn't right either: it turns every fill boundary (a bottle running out, a new one
  // starting) into a perfectly vertical cliff, which looks broken even though the underlying event
  // is real (confirmed on the same preview, zoomed into one bottle's start/end).
  //
  // A *symmetric* (forward+backward averaged) filter was tried and rejected: it eases the curve
  // downward slightly *before* the fill boundary too, which is simply wrong — the bottle is still
  // full and being drunk right up to the boundary, so the rate must not start dropping until the
  // fill actually ends. It has to stay strictly causal (never react before the event happens).
  //
  // But a *single* forward-only EMA isn't quite right either: its steepest change lands
  // immediately at the very first step after the boundary, then eases off — an exponential decay,
  // not a rounded onset, so the top of the transition still reads as a small cliff. The fix is a
  // *cascaded* EMA — the same short filter applied twice in sequence, still 100% causal (each pass
  // only ever looks backward), but its step response starts at zero slope and eases into the
  // steepest part in the middle, then eases out — a proper S-curve onset instead of an instant jump.
  const fluidTau = 0.1; // ~6 minutes
  const fluidAlpha = dt > 0 ? 1 - Math.exp(-dt / fluidTau) : 1;
  function causalSmoothRate(cumulative: number[]): number[] {
    const n = cumulative.length;
    if (n < 2 || dt <= 0) return cumulative.map(() => 0);
    const raw = new Array<number>(n).fill(0);
    for (let i = 1; i < n; i++) raw[i] = (cumulative[i] - cumulative[i - 1]) / dt;
    raw[0] = raw[1];

    const pass1 = new Array<number>(n);
    let ema = raw[0];
    pass1[0] = ema;
    for (let i = 1; i < n; i++) {
      ema += fluidAlpha * (raw[i] - ema);
      pass1[i] = ema;
    }

    const pass2 = new Array<number>(n);
    ema = pass1[0];
    pass2[0] = ema;
    for (let i = 1; i < n; i++) {
      ema += fluidAlpha * (pass1[i] - ema);
      pass2[i] = ema;
    }

    return pass2;
  }

  const fluidRates = causalSmoothRate(out.map((p) => p.mlAbsorbed));
  const fluidNeedRates = causalSmoothRate(out.map((p) => p.fluidNeed));
  out.forEach((p, i) => {
    p.fluidRate = fluidRates[i];
    p.fluidNeedRate = fluidNeedRates[i];
  });

  return out;
}

/**
 * Coverage: of everything the ride demanded, how much did the rider actually have on board *at
 * the time it was demanded*. Each step credits what arrived (plus whatever recent surplus is
 * still carried) against what that step required, so carbs that show up when the need is long
 * past earn nothing — a plan cannot be back-loaded into a good score.
 *
 * Two things this deliberately does NOT do, both of which it used to:
 *
 * 1. It no longer integrates the EMA-smoothed `rate`/`needRate` pair. Those two exist to draw
 *    readable *curves*; as the basis for a *total* they were wrong twice over. The need EMA lags
 *    ~30 min, so its integral fell ~37 g short of a 241 g requirement and quietly shrank the
 *    denominator by ~18%. And the intake EMA is seeded with the pre-ride meal digesting before
 *    the start line (see samples()), which leaked into the numerator — an empty plan with an
 *    80 g pre-ride meal reported 35% covered while carrying literally nothing.
 * 2. It no longer divides by anything but the honest full requirement, so the result is bounded
 *    at 100 and can be read as a plain percentage of `target`.
 *
 * ## Why the surplus carries forward instead of expiring each step
 *
 * A step is `hrs/160` — about 90 seconds. Settling up that often, with no carry, does not measure
 * the plan at all; it measures the model's own internal seam. `need` is distributed by *effort per
 * distance* (a climb demands more per km), while this absorption model still assumes uniform time
 * per distance step (the flat-pace approximation documented in samples()). So on a climb step
 * `Δneed` alone can exceed what the gut can physically pass in 90 s (`absCap × dt`), and a strict
 * per-step `min()` burns that difference permanently through no fault of the plan. Measured on a
 * 100 km route with 4 × ±300 m rollers, that made coverage a constant of the elevation profile
 * with the plan factored out entirely: 300 g, 600 g and 1200 g of carbs all scored exactly 80%,
 * so green was unreachable no matter what the rider carried.
 *
 * Carrying a bounded surplus fixes that without going soft on timing. The bound is the point: an
 * *unlimited* carry would collapse to the plain sum ratio (any early surplus could pay for any
 * later need, and front-loading everything into hour one would score a perfect 100%). Capping it
 * at `COVERAGE_CARRY_MINUTES` of requirement says what the physiology says — the gut and the
 * immediately available glycogen pool absorb short-term unevenness, and nothing beyond that.
 *
 * The carry *damps* that seam rather than removing it, so the achievable ceiling still depends on
 * terrain. Measured with 10x the required carbs, so the plan can never be the limiter: flat and
 * any uniform-gradient climb reach 100, rolling 150-300 m reaches 97-99, a realistic alpine day
 * 93, two big cols 88. It degrades from there — a single sustained 2500-5000 m climb-and-descent
 * inside a 4 h ride tops out at 79-75, i.e. green becomes unreachable again. That combination is
 * physically implausible at the speeds involved, and longer rides recover on their own (the same
 * 2000 m climb reads 82 over 100 km and 94 over 200 km), so it is logged as a known limit rather
 * than fixed here. Removing it for real means dropping the flat-pace approximation in samples()
 * and making `dt` terrain-aware, which changes the chart too.
 */
export function rateStats(state: PlanState): RateStats {
  const S = samples(state);
  const hrs = totalHours(state.route);
  const target = hrs * cph(state.route);
  const carryCap = (cph(state.route) * COVERAGE_CARRY_MINUTES) / 60;
  let covered = 0;
  let surplus = 0;

  S.forEach((p, i) => {
    if (i > 0) {
      const available = p.absorbed - S[i - 1].absorbed + surplus;
      const credited = Math.min(available, p.need - S[i - 1].need);
      covered += credited;
      surplus = Math.min(carryCap, available - credited);
    }
  });

  return {
    // A ride that demands nothing is covered by definition — the same call hydrationPct makes for
    // zero sweat loss, rather than painting a red 0% on a plan with nothing to cover.
    //
    // Note this also covers "no ride entered yet": the store's default route is distance 0 /
    // speed 0, so a fresh install shows a green 100% here (desktop used to show 0% — mobile
    // already showed 100%, and unifying had to pick one). Kept deliberately, as the rider's call.
    //
    // Worth knowing what does and doesn't soften it, because the two layouts differ: mobile
    // prints a self-cancelling "0 / 0 g" right under the number, but the desktop card prints
    // "Requirement 0g" and "Planned 0 g" as two separate figures, alongside a recovery range
    // computed from body weight — so on desktop the green 100% is the loudest thing on an
    // otherwise empty plan. That is the weaker of the two cases; if this ever stops feeling
    // right, desktop is where it will show first.
    coverage: target > 0 ? Math.round((covered / target) * 100) : 100,
    coveredCarbs: covered,
    samples: S,
  };
}

type NumericSampleKey = {
  [K in keyof Sample]: Sample[K] extends number ? K : never;
}[keyof Sample];

export function valueAt(S: Sample[], D: number, x: number, key: NumericSampleKey): number {
  const N = S.length - 1;
  const f = Math.max(0, Math.min(1, x / D)) * N;
  const i = Math.min(N - 1, Math.floor(f));
  const a = S[i][key];
  const b = S[i + 1][key];
  return a + (b - a) * (f - i);
}

export function fmtHM(h: number): string {
  const m = Math.round(h * 60);
  return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
}

function xu(route: RouteInput, xUnit: XUnit): XUnit | 'time' {
  return route.mode === 'time' ? 'time' : xUnit;
}

export function fmtX(km: number, withUnit: boolean, route: RouteInput, xUnit: XUnit): string {
  if (xu(route, xUnit) === 'km') return Math.round(km) + (withUnit ? ' km' : '');
  return fmtHM(timeAtDistance(route, km)) + (withUnit ? ' h' : '');
}

export function rangeLabel(
  a: number,
  b: number,
  point: boolean,
  route: RouteInput,
  xUnit: XUnit,
): string {
  if (point) return fmtX(a, true, route, xUnit);
  return fmtX(a, false, route, xUnit) + '–' + fmtX(b, true, route, xUnit);
}

export interface PlanSummary {
  target: number;
  izoCarbs: number;
  gelCarbs: number;
  foodCarbs: number;
  totalCarbs: number;
  fluidPlanned: number;
  sweatLoss: number;
  hydrationPct: number;
  coverage: number;
  /** Grams counted toward `coverage` — pair this with `target` when showing the ratio in grams.
   *  Not the same as `absorbedTotal`, which ignores whether a gram arrived when it was needed. */
  coveredCarbs: number;
  absorbedTotal: number;
  /** Fluid that actually cleared the stomach over the whole ride, capped at
   *  `FLUID_ABSORPTION_CAP_ML_H` — what `hydrationPct` is based on. Not the same as `fluidPlanned`,
   *  which is the raw volume poured and can be higher if it was poured faster than the gut can
   *  pass it on. */
  fluidAbsorbedTotal: number;
}

export function planSummary(state: PlanState): PlanSummary {
  const { route, mix, gear, fills, foods } = state;
  const hrs = totalHours(route);
  const target = hrs * cph(route);

  const izoCarbs = fills
    .filter((f) => f.content === 'izo')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const gelCarbs = fills
    .filter((f) => f.content === 'gel')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const foodCarbs = foods.reduce((a, f) => a + f.carbs, 0);
  const totalCarbs = izoCarbs + gelCarbs + foodCarbs;

  const fluidPlanned =
    fills.filter((f) => f.content !== 'gel').reduce((a, f) => a + volOf(f, gear), 0) +
    foods.reduce((a, f) => a + (f.ml || 0), 0);
  const sweatLoss = Math.round(sweat(route) * hrs);
  // Below the short-ride buffer gate (the same one that zeroes the chart's fluidNeed target —
  // see samples() above), there's honestly nothing to actively cover, so this reports "fully
  // met" rather than dividing by a raw sweatLoss the chart itself has already decided doesn't
  // apply — otherwise a mild/short ride with zero fills showed the chart's target line flat at
  // 0 (satisfied) while this badge showed 0%, red: the same disagreement this whole rework set
  // out to eliminate, just in the opposite direction.
  const { coverage, coveredCarbs, samples: S } = rateStats(state);
  const fluidAbsorbedTotal = S[S.length - 1].mlAbsorbed;
  const hydrationPct =
    sweatLoss > 0 && sweatLoss >= route.weight * HYDRATION_BUFFER_ML_PER_KG
      ? Math.round((fluidAbsorbedTotal / sweatLoss) * 100)
      : 100;

  return {
    target,
    izoCarbs,
    gelCarbs,
    foodCarbs,
    totalCarbs,
    fluidPlanned,
    sweatLoss,
    hydrationPct,
    coverage,
    coveredCarbs,
    absorbedTotal: S[S.length - 1].absorbed,
    fluidAbsorbedTotal,
  };
}

export interface RecoveryCarbs {
  min: number;
  max: number;
}

const RECOVERY_CARBS_MIN_G_PER_KG = 1.0;
const RECOVERY_CARBS_MAX_G_PER_KG = 1.2;

/**
 * Recommended carbs to eat in the first ~30 min after finishing a ride, per
 * common sports-nutrition guidance of 1.0–1.2 g/kg body weight. Shown as a
 * range (not a single midpoint) since the source guidance itself is a range
 * and rounding to one number would imply false precision.
 */
export function recoveryCarbs(weightKg: number): RecoveryCarbs {
  return {
    min: Math.round(weightKg * RECOVERY_CARBS_MIN_G_PER_KG),
    max: Math.round(weightKg * RECOVERY_CARBS_MAX_G_PER_KG),
  };
}

export interface PlanExtras {
  gutPeak: { g: number; x: number };
  refillTotal: number;
  gelPortions: number;
}

export function planExtras(state: PlanState): PlanExtras {
  const { gear, fills } = state;
  const { samples: S } = rateStats(state);

  let gutPeak = { g: 0, x: 0 };
  S.forEach((p) => {
    if (p.gut > gutPeak.g) gutPeak = { g: p.gut, x: p.x };
  });

  const refillTotal = gear.reduce(
    (a, g) => a + Math.max(0, fills.filter((f) => f.gid === g.gid).length - 1),
    0,
  );
  const gelPortions = fills
    .filter((f) => f.content === 'gel')
    .reduce((a, f) => a + partsOf(f, gear), 0);

  return { gutPeak, refillTotal, gelPortions };
}

export { FLUID_ABSORPTION_CAP_ML_H };
