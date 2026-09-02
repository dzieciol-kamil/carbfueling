/**
 * From a decision to a plan.
 *
 * The search decides *what each vessel carries and how many times it is filled*. This module turns
 * that one sentence into an actual plan: where each fill starts and ends, and where the rider has
 * to pull over. It contains no search of its own — every position below is either computed from
 * `spans.ts` (which inverts the app's own need curve) or forced by one of the owner's rules. Two
 * calls with the same arguments give the same draft.
 *
 * The rules it implements, in the owner's terms:
 *
 * **Handover is free; only a refill costs a stop.** Bottles hand over to each other. Vessel A runs
 * dry and vessel B takes over on the load it left home with — that costs nothing, wherever on the
 * route it happens, because B's izo was mixed in the kitchen. A *refill* — a vessel that has already
 * been used being filled again — needs a tap, so it needs a stop. A fill is a refill exactly when
 * its vessel has an earlier fill, in ride order. Same predicate as `score.ts`'s `powderCarried`,
 * and as the two scenario suites', on purpose: there is one definition of a refill on this branch.
 *
 * **One stop tops up every bottle at once**, so stops are counted per round, not per bottle. For a
 * content needing `L` loads across `V` vessels that is `stops ≈ max(0, L − V)` — the home load is
 * the `− V`. The owner's worked example: 2 izo bottles + a gel flask + a bladder cover 100 km with
 * **zero** stops, because `L ≤ V` for every content.
 *
 * **Vessels within one content stream run in round-robin relay.** The owner's own 194 km plan reads
 * `izo g1 0→48, g3 48→101, g1 101→150, g3 150→194`: the first pass over the vessels is the home
 * loads (free handovers) and the wrap back onto `g1` at 101 is the first refill, hence the first
 * stop.
 *
 * **Streams run in parallel.** Izo and water are drunk at the same time, so each content stream
 * tiles the whole route independently from km 0 rather than queueing behind the others.
 *
 * **A spent vessel may take water at a stop that already exists — never at a new one.** Once a
 * bottle has finished its carb duty it can be topped up with water, but it must not buy a stop to
 * do it: water is free and available everywhere, and a bottle earning its keep this way is not
 * worth pulling over for.
 *
 * Deliberately *not* here:
 *
 * - **Gel dose placement (`Fill.pos`).** A gel flask is `x movable doses`, not a stream, and where
 *   those doses land is a separate, known piece of work. Until it exists a gel vessel is laid out
 *   as an ordinary stream — one continuous span per load — which is the same shape the chart
 *   already draws for a gel fill with no `pos`.
 * - **Choosing the assignment.** That is the search's job. `layout` is the function the search
 *   calls; it never second-guesses what it was handed.
 * - **Placing food.** `foods` is an input and comes back out untouched. All this module does with it
 *   is read which of its entries are `needsStop` products, because buying one is a stop.
 */
import { carbsFill, dist } from '../fuel';
import type { Content, Fill, PlanState, Vessel } from '../types';
import { carbSpanEndKm, waterSpanEndKm } from './spans';
import type { Draft } from './score';
import type { DraftFill, DraftFood, DraftStop } from './types';

/** What one vessel does for the whole ride. */
export type VesselAssignment = {
  gid: string;
  /** What this vessel carries. Must be in the vessel's own `allowed` list — see `layout`. */
  content: Content;
  /** 1 = the home load only; 2 = home load + one refill; ... 0 = the vessel is not used. */
  loads: number;
};

/**
 * Two stops closer than this are the same stop: nobody pulls over twice inside 10 km. The same
 * window both scenario suites measure the planner against (`mergeWindow` there), stated once here
 * so the engine and the suites cannot drift apart on it.
 */
export function mergeWindowKm(D: number): number {
  return Math.min(10, D * 0.2);
}

/** A load, before merging has had its say. `refill` is the reason a stop exists. */
type Load = DraftFill & { refill: boolean };

/** A count of loads is a count: negative, fractional and non-finite all mean "no loads". */
function loadCount(loads: number): number {
  return Number.isFinite(loads) ? Math.max(0, Math.floor(loads)) : 0;
}

/**
 * Where a full load of `content` in `vessel`, started at `from`, runs out.
 *
 * Carbs go through `fuel.ts`'s own `carbsFill` rather than re-deriving `vol × conc / 100` here —
 * izo and gel read different concentrations off the mix and there must not be a second model of
 * what a bottle holds. Water is simply its volume.
 */
function loadSpanEnd(state: PlanState, vessel: Vessel, content: Content, from: number): number {
  if (content === 'water') return waterSpanEndKm(state.route, from, vessel.vol);
  const probe: Fill = { fid: 0, gid: vessel.gid, content, from, to: from };
  return carbSpanEndKm(state.route, from, carbsFill(probe, state.gear, state.mix));
}

/** A position that wants a stop, and whether it is free to move to get one. */
type Candidate = { at: number; movable: boolean };

/**
 * Lay `assignment` out into a draft plan.
 *
 * **Illegal assignments throw.** A vessel asked to carry a content its `allowed` list does not
 * permit, an unknown `gid`, or the same `gid` assigned twice are all rejected with an error rather
 * than skipped. Legality is knowable by the caller from `state.gear` alone, and cheaply; silently
 * dropping a vessel would hand back a plan that is not the one the caller asked for, and the search
 * would then score *that* plan while believing it had measured the other. Every hard bug in the
 * previous engine was some version of "the planner thinks X, the app says Y", so this fails loudly
 * at the point the mistake was made instead of quietly two layers later. `loads: 0` is not an
 * error — that is a legal way to say a vessel is left at home.
 */
export function layout(
  state: PlanState,
  assignment: VesselAssignment[],
  foods: DraftFood[],
): Draft {
  const { route, gear, foodLib } = state;
  const D = dist(route);

  const vesselOf = new Map<string, Vessel>();
  for (const a of assignment) {
    const v = gear.find((g) => g.gid === a.gid);
    if (!v) throw new Error(`layout: assignment names vessel "${a.gid}", which is not in the gear`);
    if (!v.allowed.includes(a.content)) {
      throw new Error(`layout: vessel "${a.gid}" may not carry ${a.content}`);
    }
    if (vesselOf.has(a.gid)) throw new Error(`layout: vessel "${a.gid}" is assigned twice`);
    vesselOf.set(a.gid, v);
  }

  // --- Tile each content stream ------------------------------------------------------------
  //
  // Contents are laid out in the order they first appear in the assignment; within a content, the
  // vessels keep the order they were given, because that order *is* the handover order and it is
  // one of the search's decisions. Each stream starts again at km 0: izo and water are drunk
  // simultaneously, not one after the other.
  const contents: Content[] = [];
  for (const a of assignment) if (!contents.includes(a.content)) contents.push(a.content);

  const streams: Load[][] = [];
  for (const content of contents) {
    const group = assignment.filter((a) => a.content === content);
    const rounds = Math.max(0, ...group.map((a) => loadCount(a.loads)));
    const used = new Set<string>();
    const stream: Load[] = [];
    let x = 0;
    for (let r = 0; r < rounds && x < D; r++) {
      for (const a of group) {
        if (x >= D) break;
        if (loadCount(a.loads) <= r) continue;
        const vessel = vesselOf.get(a.gid) as Vessel;
        const to = Math.min(D, loadSpanEnd(state, vessel, content, x));
        // A load that reaches nowhere (an empty vessel) is not a fill, and must not be allowed to
        // stall the relay: skip it without consuming the vessel's turn as "used".
        if (!(to > x)) continue;
        stream.push({ gid: a.gid, content, from: x, to, refill: used.has(a.gid) });
        used.add(a.gid);
        x = to;
      }
    }
    if (stream.length > 0) streams.push(stream);
  }

  // --- Collect what wants a stop ------------------------------------------------------------
  //
  // Refills, plus one for each `needsStop` product: you don't carry a cola for 40 km, you buy it,
  // and buying it is a stop. `needsStop` lives on the food library, not on the draft entry, so it
  // is read back through `state.foodLib` by key.
  const stopFoods = foods.filter((f) => foodLib.find((e) => e.key === f.key)?.needsStop);

  const candidates: Candidate[] = [];
  for (const stream of streams) {
    for (const f of stream) if (f.refill) candidates.push({ at: f.from, movable: true });
  }
  // A product's position was chosen by the caller and comes back out unchanged, so it cannot move;
  // a fill boundary can. That asymmetry decides which one a merge pulls the other onto.
  for (const f of stopFoods) candidates.push({ at: f.from, movable: false });
  candidates.sort((a, b) => a.at - b.at);

  // --- Merge nearby stops -------------------------------------------------------------------
  //
  // A cluster is closed as soon as a candidate sits `mergeWindowKm` or more past the one that
  // opened it — so every cluster is narrower than the window and no boundary is ever dragged
  // further than that, which is what makes the move affordable. (Chaining on the *previous*
  // member instead would let a run of near-misses walk a boundary arbitrarily far.)
  //
  // The representative is the earliest immovable candidate in the cluster if it has one, and
  // otherwise its earliest candidate. Immovable first because a product must be bought where it
  // is; earliest because a boundary that moves earlier means topping up slightly before the bottle
  // ran dry, while one that moves later means riding on an empty bottle — and `fuel.ts` carries
  // unspent credit forward but cannot invent delivery that never happened.
  const w = mergeWindowKm(D);
  const clusters: Candidate[][] = [];
  for (const c of candidates) {
    const open = clusters[clusters.length - 1];
    if (open && c.at - open[0].at < w) open.push(c);
    else clusters.push([c]);
  }
  const reps = clusters.map((cl) => (cl.find((c) => !c.movable) ?? cl[0]).at);
  const repOf = (at: number): number => {
    const i = clusters.findIndex((cl) => cl.some((c) => c.at === at));
    return i < 0 ? at : reps[i];
  };

  // --- Rewrite the boundaries the merge moved -----------------------------------------------
  //
  // A stream is a chain of boundaries, and a fill is the gap between two of them, so moving a
  // refill's start automatically shortens or lengthens its neighbour instead of tearing a hole:
  // `fill[i].from === fill[i-1].to` holds by construction, before and after. (That is contiguity
  // *along the stream*, not per vessel — a relay is precisely a vessel whose own fills are not
  // adjacent.) The rest of the stream is deliberately **not** re-tiled from the new boundary: the
  // move is absorbed by the two fills either side of it, because re-tiling would shift every later
  // boundary and could undo merges already made further down the route.
  const fills: DraftFill[] = [];
  for (const stream of streams) {
    const n = stream.length;
    const b = stream.map((f) => f.from);
    b.push(stream[n - 1].to);
    // `b[0]` is 0 and is never a refill — the first load of a stream is some vessel's first.
    for (let i = 1; i < n; i++) if (stream[i].refill) b[i] = repOf(b[i]);
    // A merge onto a *later* product can push a boundary past the one after it. Clamping keeps the
    // chain ordered; the fill it collapses is a load whose whole span was swallowed by the merge,
    // which delivers nothing over no distance and so is not planned.
    for (let i = 1; i <= n; i++) b[i] = Math.min(D, Math.max(b[i], b[i - 1]));
    for (let i = 0; i < n; i++) {
      if (b[i + 1] <= b[i]) continue;
      fills.push({ gid: stream[i].gid, content: stream[i].content, from: b[i], to: b[i + 1] });
    }
  }

  // --- The stops the plan actually has ------------------------------------------------------
  //
  // Read back off the surviving fills rather than off the candidate list, so that the two
  // directions the suites check — every refill has a stop, every stop serves something — hold even
  // when a collapse above removed a load.
  const seen = new Set<string>();
  const at = new Set<number>();
  for (const f of [...fills].sort((a, b) => a.from - b.from)) {
    if (seen.has(f.gid)) at.add(f.from);
    else seen.add(f.gid);
  }
  for (const f of stopFoods) at.add(repOf(f.from));
  const stops: DraftStop[] = [...at].sort((a, b) => a - b).map((x) => ({ at: x }));

  // --- Water into vessels that have finished their carb duty ---------------------------------
  //
  // Only at a stop the plan already has, and only into a vessel that may hold water at all. The
  // fill starts at the stop, not where the bottle ran dry, so a gap between the two is real: the
  // rider carried an empty bottle for that stretch. Repeats at each later stop the bottle is empty
  // at, since one stop tops up every bottle at once.
  for (const a of assignment) {
    if (a.content === 'water') continue;
    const vessel = vesselOf.get(a.gid) as Vessel;
    if (!vessel.allowed.includes('water')) continue;
    const own = fills.filter((f) => f.gid === a.gid);
    if (own.length === 0) continue;
    let spentAt = Math.max(...own.map((f) => f.to));
    for (const s of stops) {
      if (s.at < spentAt || s.at >= D) continue;
      const to = Math.min(D, waterSpanEndKm(route, s.at, vessel.vol));
      if (!(to > s.at)) continue;
      fills.push({ gid: a.gid, content: 'water', from: s.at, to });
      spentAt = to;
    }
  }

  // Ride order, stable — so fills that start together stay in stream order, and the top-ups above
  // land next to the fills they follow rather than in a block at the end.
  fills.sort((a, b) => a.from - b.from);

  return { fills, foods, stops };
}
