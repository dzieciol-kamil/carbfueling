// The label/value lines of a bottle recipe, shared by the on-screen Recipes section and the
// printed sheet. Kept out of the components so both render the *same* numbers: this app has
// twice shipped a screen that quietly recomputed a figure its own way and disagreed with the
// other one (see the threshold comments in MobilePlanList).

import type { CombinedGroup, ContainerPour } from '../../domain/combinedRefill';
import {
  carbsFill,
  citricAmount,
  fmtFruitFractionPct,
  fmtX,
  honeyGramsFromCarbs,
  mixSplit,
  partsOf,
  type CitricAmount,
} from '../../domain/fuel';
import type {
  CitricSource,
  Content,
  Fill,
  MixSettings,
  RouteInput,
  Vessel,
  XUnit,
} from '../../domain/types';
import { fruitNoun, t, type Lang } from '../../i18n/strings';

export interface RecipeLine {
  k: string;
  v: string;
}

export function contentLabel(content: Content | 'mixed', lang: Lang): string {
  const strings = t(lang);
  if (content === 'water') return strings.water;
  if (content === 'gel') return strings.gel;
  if (content === 'mixed') return strings.combineMixedLabel;
  return strings.izo;
}

export function citricSourceLineLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
  switch (source) {
    case 'lemon':
      return strings.citricSourceLemon;
    case 'lemonJuice':
      return strings.citricSourceLemonJuice;
    case 'lime':
      return strings.citricSourceLime;
    case 'limeJuice':
      return strings.citricSourceLimeJuice;
    default:
      return strings.citric;
  }
}

export function citricValueLabel(citric: CitricAmount, source: CitricSource, lang: Lang): string {
  if (citric.unit === 'g') return `${citric.amount.toFixed(2)} g`;
  if (citric.unit === 'ml') return `${citric.amount.toFixed(1)} ml`;
  const species = source === 'lime' ? 'lime' : 'lemon';
  return `${fmtFruitFractionPct(citric.amount)} ${fruitNoun(species, citric.amount, lang)}`;
}

export function pourLine(pour: ContainerPour, content: CombinedGroup['content']): string {
  const pct = Math.round(pour.fraction * 100);
  const vol = `${Math.round(pour.volumeMl)} ml`;
  if (content === 'water') return `${pour.vesselName}: ${pct}% → ${vol}`;
  return `${pour.vesselName}: ${pct}% → ${pour.carbsG.toFixed(0)} g, ${vol}`;
}

export interface FillRecipeInput {
  fill: Fill;
  /** The fill's position within its own vessel — drives the "refill at" line. */
  index: number;
  vessel: Vessel;
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  lang: Lang;
}

export function fillRecipeLines({
  fill,
  index,
  vessel,
  route,
  mix,
  xUnit,
  lang,
}: FillRecipeInput): RecipeLine[] {
  const strings = t(lang);
  const carbs = carbsFill(fill, [vessel], mix);
  const n = partsOf(fill, [vessel]);
  const ratio = fill.content === 'gel' ? mix.gelRatio : mix.ratio;
  const split = mixSplit(carbs, ratio || 2);
  const preset = fill.content === 'gel' ? mix.gelRatioPreset : mix.ratioPreset;
  const citricSource = fill.content === 'gel' ? mix.gelCitricSource : mix.citricSource;
  const citricGrams = (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelCitric : mix.citric);
  const citric = citricAmount(citricGrams, citricSource);

  const lines: RecipeLine[] =
    fill.content === 'water'
      ? [{ k: strings.waterFill, v: `${vessel.vol} ml` }]
      : [
          { k: strings.carbsIn, v: `${carbs.toFixed(0)} g` },
          ...(preset === 'honey' || preset === 'sugar'
            ? [
                {
                  k: preset === 'honey' ? strings.ratioLabelHoney : strings.ratioLabelSugar,
                  v:
                    preset === 'honey'
                      ? `${honeyGramsFromCarbs(carbs).toFixed(0)} g`
                      : `${carbs.toFixed(0)} g`,
                },
              ]
            : [
                { k: strings.malto, v: `${split.malto.toFixed(1)} g` },
                { k: strings.fructose, v: `${split.fructose.toFixed(1)} g` },
              ]),
          {
            k: strings.salt,
            v: `${((vessel.vol / 100) * (fill.content === 'gel' ? mix.gelSalt : mix.salt)).toFixed(2)} g`,
          },
          {
            k: citricSourceLineLabel(citricSource, strings),
            v: citricValueLabel(citric, citricSource, lang),
          },
          { k: strings.waterFill, v: `${vessel.vol} ml` },
        ];
  if (fill.content === 'gel' && n > 1)
    lines.push({
      k: strings.perPortion,
      v: `${(carbs / n).toFixed(0)} g / ${Math.round(vessel.vol / n)} ml`,
    });
  if (index > 0)
    lines.push({ k: strings.refillAt + fmtX(fill.from, true, route, xUnit), v: `#${index + 1}` });

  return lines;
}

export function combinedGroupLines(group: CombinedGroup, lang: Lang): RecipeLine[] {
  const strings = t(lang);
  const citric = citricAmount(group.citricG, group.citricSource);
  if (group.content === 'water') return [{ k: strings.waterFill, v: `${group.volumeMl} ml` }];
  return [
    { k: strings.carbsIn, v: `${group.carbsG.toFixed(0)} g` },
    ...(group.ratioPreset === 'honey' || group.ratioPreset === 'sugar'
      ? [
          {
            k: group.ratioPreset === 'honey' ? strings.ratioLabelHoney : strings.ratioLabelSugar,
            v:
              group.ratioPreset === 'honey'
                ? `${honeyGramsFromCarbs(group.carbsG).toFixed(0)} g`
                : `${group.carbsG.toFixed(0)} g`,
          },
        ]
      : [
          { k: strings.malto, v: `${group.maltoG.toFixed(1)} g` },
          { k: strings.fructose, v: `${group.fructoseG.toFixed(1)} g` },
        ]),
    { k: strings.salt, v: `${group.saltG.toFixed(2)} g` },
    {
      k: citricSourceLineLabel(group.citricSource, strings),
      v: citricValueLabel(citric, group.citricSource, lang),
    },
    { k: strings.waterFill, v: `${group.volumeMl} ml` },
  ];
}
