import { useState, type CSSProperties } from 'react';
import {
  combineNeedsConfirm,
  combinedGroups,
  type CombinedGroup,
  type ContainerPour,
} from '../../domain/combinedRefill';
import {
  carbsFill,
  citricAmount,
  fmtFruitFractionPct,
  honeyGramsFromCarbs,
  mixSplit,
  partsOf,
  type CitricAmount,
} from '../../domain/fuel';
import type { CitricSource, Fill } from '../../domain/types';
import { fruitNoun, t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';

function citricSourceRowLabel(source: CitricSource, strings: ReturnType<typeof t>): string {
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
      return strings.mixRowCitric;
  }
}

function citricValueLabel(citric: CitricAmount, source: CitricSource, lang: Lang): string {
  if (citric.unit === 'g') return citric.amount.toFixed(2) + ' g';
  if (citric.unit === 'ml') return citric.amount.toFixed(1) + ' ml';
  const species = source === 'lime' ? 'lime' : 'lemon';
  return fmtFruitFractionPct(citric.amount) + ' ' + fruitNoun(species, citric.amount, lang);
}

function pourLine(pour: ContainerPour, content: CombinedGroup['content']): string {
  const pct = Math.round(pour.fraction * 100);
  const vol = Math.round(pour.volumeMl) + ' ml';
  if (content === 'water') return `${pour.vesselName}: ${pct}% → ${vol}`;
  return `${pour.vesselName}: ${pct}% → ${pour.carbsG.toFixed(0)} g, ${vol}`;
}

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
  borderBottom: '1px solid var(--border-soft)',
  padding: '8px 0',
};

export function MobileMixSheet() {
  const open = useAppStore((s) => s.ui.mixSheet);
  const closeMixSheet = useAppStore((s) => s.closeMixSheet);
  const lang = useAppStore((s) => s.ui.lang);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const combinedFillIds = useAppStore((s) => s.combinedFillIds);
  const toggleCombinedFill = useAppStore((s) => s.toggleCombinedFill);
  const mix = useAppStore((s) => s.mix);
  const strings = t(lang);
  const [pendingFid, setPendingFid] = useState<number | null>(null);

  if (!open) return null;

  const contentLabel = (content: CombinedGroup['content']) =>
    content === 'water'
      ? strings.water
      : content === 'gel'
        ? strings.gel
        : content === 'mixed'
          ? strings.combineMixedLabel
          : strings.izo;

  const selectedFills = fills.filter((f) => combinedFillIds.includes(f.fid));
  const showCombined = selectedFills.length > 1;
  const groups = showCombined ? combinedGroups(selectedFills, gear, mix) : [];

  const vesselGroups = gear
    .map((vessel) => ({ vessel, vesselFills: fills.filter((f) => f.gid === vessel.gid) }))
    .filter((g) => g.vesselFills.length > 0);

  function handleToggle(fill: Fill) {
    if (combinedFillIds.includes(fill.fid)) {
      toggleCombinedFill(fill.fid);
      return;
    }
    if (combineNeedsConfirm([...selectedFills, fill], mix)) {
      setPendingFid(fill.fid);
      return;
    }
    toggleCombinedFill(fill.fid);
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 26,
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 18px 10px',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{strings.mixSheetTitle}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{strings.mixSheetSubtitle}</div>
        </div>
        <button
          type="button"
          onClick={closeMixSheet}
          style={{
            width: 38,
            height: 38,
            border: '1px solid var(--chip-border)',
            borderRadius: 11,
            background: 'var(--surface)',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {vesselGroups.length === 0 && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{strings.mixSheetEmpty}</p>
        )}

        {vesselGroups.map(({ vessel, vesselFills }) => (
          <div key={vessel.gid}>
            {vesselFills.map((fill, i) => {
              const carbs = carbsFill(fill, gear, mix);
              const n = partsOf(fill, gear);
              const ratio = fill.content === 'gel' ? mix.gelRatio : mix.ratio;
              const split = mixSplit(carbs, ratio || 2);
              const preset = fill.content === 'gel' ? mix.gelRatioPreset : mix.ratioPreset;
              const salt = (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelSalt : mix.salt);
              const citricSource = fill.content === 'gel' ? mix.gelCitricSource : mix.citricSource;
              const citricGrams =
                (vessel.vol / 100) * (fill.content === 'gel' ? mix.gelCitric : mix.citric);
              const selected = combinedFillIds.includes(fill.fid);
              const citric = citricAmount(citricGrams, citricSource);

              const lines: { k: string; v: string }[] =
                fill.content === 'water'
                  ? [{ k: strings.mixRowWater, v: vessel.vol + ' ml' }]
                  : [
                      { k: strings.mixRowSugar, v: carbs.toFixed(0) + ' g' },
                      ...(preset === 'honey' || preset === 'sugar'
                        ? [
                            {
                              k:
                                preset === 'honey'
                                  ? strings.ratioLabelHoney
                                  : strings.ratioLabelSugar,
                              v:
                                preset === 'honey'
                                  ? honeyGramsFromCarbs(carbs).toFixed(0) + ' g'
                                  : carbs.toFixed(0) + ' g',
                            },
                          ]
                        : [
                            { k: strings.mixRowMalto, v: split.malto.toFixed(1) + ' g' },
                            { k: strings.mixRowFructose, v: split.fructose.toFixed(1) + ' g' },
                          ]),
                      { k: strings.mixRowSalt, v: salt.toFixed(2) + ' g' },
                      {
                        k: citricSourceRowLabel(citricSource, strings),
                        v: citricValueLabel(citric, citricSource, lang),
                      },
                      { k: strings.mixRowWater, v: vessel.vol + ' ml' },
                    ];

              return (
                <div key={fill.fid} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleToggle(fill)}
                      title={strings.combineFillCheckbox}
                    />
                    {vessel.name} · {strings.fill} {i + 1}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: 'var(--muted-3)',
                      marginBottom: 4,
                    }}
                  >
                    {vessel.vol} ml{fill.content === 'gel' ? ' · ' + n + '×' : ''}
                  </div>
                  {selected && showCombined ? (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted-2)' }}>
                      {strings.combineNote}
                    </p>
                  ) : (
                    lines.map((line) => (
                      <div key={line.k} style={rowStyle}>
                        <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{line.k}</span>
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {line.v}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {showCombined && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                {strings.combineSectionTitle}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2 }}>
                {strings.combineSectionHint}
              </div>
            </div>
            {groups.map((group) => (
              <CombinedGroupRows
                key={group.content}
                group={group}
                lang={lang}
                contentLabel={contentLabel}
              />
            ))}
          </div>
        )}
      </div>

      {pendingFid != null && (
        <ConfirmDialog
          title={strings.combineCrossTypeConfirmTitle}
          body={strings.combineCrossTypeConfirmBody}
          cancelLabel={strings.combineCrossTypeConfirmCancel}
          confirmLabel={strings.combineCrossTypeConfirmConfirm}
          onCancel={() => setPendingFid(null)}
          onConfirm={() => {
            toggleCombinedFill(pendingFid);
            setPendingFid(null);
          }}
        />
      )}
    </div>
  );
}

function CombinedGroupRows({
  group,
  lang,
  contentLabel,
}: {
  group: CombinedGroup;
  lang: Lang;
  contentLabel: (content: CombinedGroup['content']) => string;
}) {
  const strings = t(lang);
  const citric = citricAmount(group.citricG, group.citricSource);
  const lines: { k: string; v: string }[] =
    group.content === 'water'
      ? [{ k: strings.mixRowWater, v: group.volumeMl + ' ml' }]
      : [
          { k: strings.mixRowSugar, v: group.carbsG.toFixed(0) + ' g' },
          ...(group.ratioPreset === 'honey' || group.ratioPreset === 'sugar'
            ? [
                {
                  k:
                    group.ratioPreset === 'honey'
                      ? strings.ratioLabelHoney
                      : strings.ratioLabelSugar,
                  v:
                    group.ratioPreset === 'honey'
                      ? honeyGramsFromCarbs(group.carbsG).toFixed(0) + ' g'
                      : group.carbsG.toFixed(0) + ' g',
                },
              ]
            : [
                { k: strings.mixRowMalto, v: group.maltoG.toFixed(1) + ' g' },
                { k: strings.mixRowFructose, v: group.fructoseG.toFixed(1) + ' g' },
              ]),
          { k: strings.mixRowSalt, v: group.saltG.toFixed(2) + ' g' },
          {
            k: citricSourceRowLabel(group.citricSource, strings),
            v: citricValueLabel(citric, group.citricSource, lang),
          },
          { k: strings.mixRowWater, v: group.volumeMl + ' ml' },
        ];

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: 'var(--muted-3)',
          marginBottom: 4,
        }}
      >
        {contentLabel(group.content)}
        {group.content === 'gel' ? ' · ' + group.parts + '×' : ''} · {strings.combineBottles}:{' '}
        {group.vesselNames.join(', ')}
      </div>
      {lines.map((line) => (
        <div key={line.k} style={rowStyle}>
          <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{line.k}</span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {line.v}
          </span>
        </div>
      ))}
      {group.pours && group.pours.length > 1 && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border-soft)' }}>
          <div style={{ fontSize: 10, color: 'var(--muted-3)', marginBottom: 3 }}>
            {strings.combinePourLabel}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {group.pours.map((pour) => (
              <div
                key={pour.fid}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: 'var(--ink-soft)',
                }}
              >
                {pourLine(pour, group.content)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
