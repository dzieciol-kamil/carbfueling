// The printed page: one A4 sheet, two columns. On the left a 40 mm strip with the ride schedule,
// meant to be cut out and taped to the top tube; on the right the bottle recipes, which stay in
// the kitchen. Hidden on screen entirely (see print.css) — the button in the Planning row and the
// one in the mobile header just call window.print().
//
// Deliberately monochrome and worded, never colour-coded: browsers don't print backgrounds by
// default, so a printed dot would be an invisible distinction.

import {
  combinedGroups,
  type CombinedGroup,
  type ContainerPour,
} from '../../domain/combinedRefill';
import { dist, fmtHM, partsOf, rangeLabel, totalHours } from '../../domain/fuel';
import { printStrip, vesselLabels } from '../../domain/printSheet';
import type { Fill, RouteInput, Vessel, XUnit } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import {
  combinedGroupLines,
  contentLabel,
  fillRecipeLines,
  pourLine,
  type RecipeLine,
} from '../recipes/recipeLines';

export function PrintSheet() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const shops = useAppStore((s) => s.shops);
  const combinedFillIds = useAppStore((s) => s.combinedFillIds);
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const strings = t(lang);

  const strip = printStrip({ route, gear, fills, foods, foodLib, shops, xUnit, lang });
  const labels = vesselLabels(gear);

  // Same rule as the on-screen Recipes section: a single ticked fill is not a batch.
  const selectedFills = fills.filter((f) => combinedFillIds.includes(f.fid));
  const showCombined = selectedFills.length > 1;
  const groups = showCombined ? combinedGroups(selectedFills, gear, mix) : [];
  // Whatever the batch doesn't cover still needs its own recipe. Fills that *are* in the batch
  // are dropped rather than printed with the screen's "counted in the batch above" placeholder —
  // on paper that line is a row of nothing.
  const looseFills = showCombined ? fills.filter((f) => !combinedFillIds.includes(f.fid)) : fills;

  return (
    <div className="print-sheet">
      <div className="print-strip-col">
        <aside className="print-strip">
          <div className="print-strip__head">
            {Math.round(dist(route))} km · {fmtHM(totalHours(route))}
          </div>

          {strip.fills.length > 0 && (
            <section className="print-strip__section">
              <h2>{strings.printStripBottles}</h2>
              {strip.fills.map((group) => (
                <div key={group.fid} className="print-strip__item">
                  <div className="print-strip__label">
                    {group.vessel} · {contentLabel(group.content, lang)}
                    {group.content === 'gel' && group.parts > 1 ? ` ${group.parts}×` : ''}
                  </div>
                  {/* Keyed by index, not by the label: positions are rounded for display, so two
                      short consecutive legs (10.2–10.4 and 10.4–10.6) both read "10–10". */}
                  {group.ranges.map((range, i) => (
                    <div key={i} className="print-strip__at">
                      {range}
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}

          {strip.foods.length > 0 && (
            <section className="print-strip__section">
              <h2>{strings.printStripFood}</h2>
              {strip.foods.map((row) => (
                <div key={row.id} className="print-strip__item">
                  <div className="print-strip__label">
                    {row.name} · <span className="print-strip__nb">{row.carbs} g</span>
                  </div>
                  <div className="print-strip__at">{row.at}</div>
                </div>
              ))}
            </section>
          )}

          {strip.stops.length > 0 && (
            <section className="print-strip__section">
              <h2>{strings.printStripStops}</h2>
              {strip.stops.map((group) => (
                <div key={group.id} className="print-strip__item">
                  <div className="print-strip__label">{group.name}</div>
                  {/* Same rounding trap as the legs above: two stops dragged to 100.2 and 100.4
                      both print "100". */}
                  {group.ats.map((at, i) => (
                    <div key={i} className="print-strip__at">
                      {at}
                    </div>
                  ))}
                </div>
              ))}
            </section>
          )}
        </aside>
        {/* Outside the dashed box on purpose: it's an instruction about the cut-out, not part of
            what the rider tapes to the bike. */}
        <div className="print-strip__cut">{strings.printCutHint}</div>
      </div>

      <main className="print-recipe">
        {groups.length > 0 && (
          <section>
            <h1>{strings.combineSectionTitle}</h1>
            {groups.map((group) => (
              <CombinedBlock key={group.content} group={group} fills={fills} labels={labels} />
            ))}
          </section>
        )}

        {looseFills.length > 0 && (
          <section>
            <h1>{strings.recipes}</h1>
            {gear.map((vessel) => (
              <VesselBlock
                key={vessel.gid}
                vessel={vessel}
                label={labels.get(vessel.gid) ?? vessel.name}
                allFills={fills}
                looseFills={looseFills}
              />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function Lines({ lines }: { lines: RecipeLine[] }) {
  return (
    <dl className="print-lines">
      {lines.map((line) => (
        <div key={line.k}>
          <dt>{line.k}</dt>
          <dd>{line.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Pours arrive in the order the rider ticked the fills; on paper they belong in ride order. */
function sortByFill(pours: ContainerPour[], fills: Fill[]): ContainerPour[] {
  const from = (p: ContainerPour) => fills.find((f) => f.fid === p.fid)?.from ?? 0;
  return pours.slice().sort((a, b) => from(a) - from(b));
}

/**
 * Which pour goes into which bottle *when*. One batch is typically a single bottle refilled two
 * or three times, so the vessel name alone repeats verbatim down the list; the leg each portion
 * belongs to is the part the rider is actually reading off the sheet.
 */
function pourLabel(
  pour: ContainerPour,
  fills: Fill[],
  labels: Map<string, string>,
  route: RouteInput,
  xUnit: XUnit,
): string {
  const name = labels.get(pour.gid) ?? pour.vesselName;
  const fill = fills.find((f) => f.fid === pour.fid);
  return fill ? `${name} ${rangeLabel(fill.from, fill.to, false, route, xUnit)}` : name;
}

function CombinedBlock({
  group,
  fills,
  labels,
}: {
  group: CombinedGroup;
  fills: Fill[];
  labels: Map<string, string>;
}) {
  const route = useAppStore((s) => s.route);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);
  // The group carries raw vessel names, and two bottles called "Bidon" are indistinguishable on
  // paper — rebuild the list from the disambiguated labels. Deduplicated, because a batch is
  // usually one bottle refilled several times, and "Bidon 2, Bidon 2, Bidon 2" says nothing.
  // A fill whose vessel was deleted has no name to contribute; dropped rather than left as an
  // empty entry that prints as a trailing comma, matching how printStrip() drops orphan fills.
  const names = [
    ...new Set(
      group.fillIds
        .map((fid) => {
          const gid = fills.find((f) => f.fid === fid)?.gid;
          return (gid && labels.get(gid)) || '';
        })
        .filter(Boolean),
    ),
  ];

  return (
    <div className="print-block">
      <div className="print-block__head">
        <strong>
          {contentLabel(group.content, lang)}
          {group.content === 'gel' && group.parts ? ` ${group.parts}×` : ''}
        </strong>
        <span>
          {strings.combineBottles}: {names.join(', ')}
        </span>
      </div>
      <Lines lines={combinedGroupLines(group, lang)} />
      {group.pours && group.pours.length > 1 && (
        <div className="print-pours">
          <div className="print-pours__label">{strings.combinePourLabel}</div>
          {sortByFill(group.pours, fills).map((pour) => (
            <div key={pour.fid}>
              {pourLine(
                { ...pour, vesselName: pourLabel(pour, fills, labels, route, xUnit) },
                group.content,
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VesselBlock({
  vessel,
  label,
  allFills,
  looseFills,
}: {
  vessel: Vessel;
  label: string;
  allFills: Fill[];
  looseFills: Fill[];
}) {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);

  // Numbering counts every fill on the vessel, so "Napełnienie 2" means the same here as on
  // screen even when fill 1 was weighed out as part of the combined batch.
  const ownFills = allFills.filter((f) => f.gid === vessel.gid).sort((a, b) => a.from - b.from);
  const printed = ownFills.filter((f) => looseFills.includes(f));
  if (printed.length === 0) return null;

  return (
    <div className="print-block">
      <div className="print-block__head">
        <strong>{label}</strong>
        <span>{vessel.vol} ml</span>
      </div>
      {printed.map((fill) => {
        const index = ownFills.indexOf(fill);
        const parts = partsOf(fill, [vessel]);
        return (
          <div key={fill.fid} className="print-fill">
            <div className="print-fill__head">
              <span>
                {strings.fill} {index + 1} · {rangeLabel(fill.from, fill.to, false, route, xUnit)}
              </span>
              <span>
                {contentLabel(fill.content, lang)}
                {fill.content === 'gel' && parts > 1 ? ` ${parts}×` : ''}
              </span>
            </div>
            <Lines lines={fillRecipeLines({ fill, index, vessel, route, mix, xUnit, lang })} />
          </div>
        );
      })}
    </div>
  );
}
