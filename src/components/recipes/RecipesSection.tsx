import { useState, type CSSProperties } from 'react';
import {
  combineNeedsConfirm,
  combinedGroups,
  type CombinedGroup,
} from '../../domain/combinedRefill';
import { partsOf, rangeLabel } from '../../domain/fuel';
import type { Fill, MixSettings, RouteInput, Vessel, XUnit } from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { sourceColor } from '../chart/theme';
import { combinedGroupLines, contentLabel, fillRecipeLines, pourLine } from './recipeLines';

const cardStyle: CSSProperties = {
  border: '1px solid var(--border-soft)',
  borderRadius: 12,
  overflow: 'hidden',
};
const cardHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: '10px 14px',
  background: '#F4F5F2',
  borderBottom: '1px solid var(--border-soft)',
};
const fillBlockStyle: CSSProperties = { padding: '10px 0', borderBottom: '1px solid #F2F3EF' };

export function RecipesSection() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const combinedFillIds = useAppStore((s) => s.combinedFillIds);
  const toggleCombinedFill = useAppStore((s) => s.toggleCombinedFill);
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const openPanel = useAppStore((s) => s.openPanel);
  const strings = t(lang);
  const [pendingFid, setPendingFid] = useState<number | null>(null);

  const selectedFills = fills.filter((f) => combinedFillIds.includes(f.fid));
  const showCombined = selectedFills.length > 1;
  const groups = showCombined ? combinedGroups(selectedFills, gear, mix) : [];

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
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 24px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px 24px',
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: 280 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {strings.recipes}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 4 }}>
            {strings.recipesHint}
          </div>
        </div>
        <button
          onClick={() => openPanel('mix')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--chip-border)',
            background: '#fff',
            borderRadius: 9,
            padding: '7px 12px',
            fontFamily: 'Archivo, sans-serif',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ink-soft)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>{strings.editInSettings}</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 14,
        }}
      >
        {gear.map((vessel) => (
          <VesselRecipeCard
            key={vessel.gid}
            vessel={vessel}
            fills={fills.filter((f) => f.gid === vessel.gid).sort((a, b) => a.from - b.from)}
            route={route}
            mix={mix}
            xUnit={xUnit}
            lang={lang}
            combinedFillIds={combinedFillIds}
            showCombined={showCombined}
            onToggleCombine={handleToggle}
          />
        ))}
      </div>

      {showCombined && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {strings.combineSectionTitle}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted-2)', marginTop: 4 }}>
              {strings.combineSectionHint}
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ padding: '10px 14px 12px' }}>
              {groups.map((group) => (
                <CombinedGroupBlock key={group.content} group={group} lang={lang} />
              ))}
            </div>
          </div>
        </div>
      )}

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

function CombinedGroupBlock({ group, lang }: { group: CombinedGroup; lang: Lang }) {
  const strings = t(lang);
  const lines = combinedGroupLines(group, lang);

  return (
    <div style={fillBlockStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {contentLabel(group.content, lang)}
          {group.content === 'gel' ? ` ${group.parts}×` : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--muted-3)' }}>
          {strings.combineBottles}: {group.vesselNames.join(', ')}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {lines.map((line) => (
          <div
            key={line.k}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{line.k}</span>
            <span
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}
            >
              {line.v}
            </span>
          </div>
        ))}
      </div>
      {group.pours && group.pours.length > 1 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border-soft)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted-3)', marginBottom: 4 }}>
            {strings.combinePourLabel}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {group.pours.map((pour) => (
              <div
                key={pour.fid}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
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

interface VesselRecipeCardProps {
  vessel: Vessel;
  fills: Fill[];
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  lang: Lang;
  combinedFillIds: number[];
  showCombined: boolean;
  onToggleCombine: (fill: Fill) => void;
}

function VesselRecipeCard({
  vessel,
  fills,
  route,
  mix,
  xUnit,
  lang,
  combinedFillIds,
  showCombined,
  onToggleCombine,
}: VesselRecipeCardProps) {
  const strings = t(lang);

  return (
    <div style={cardStyle}>
      <div style={cardHeadStyle}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{vessel.name}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.85 }}>
          {vessel.vol} ml · {fills.length}× · {Math.max(0, fills.length - 1)} {strings.refills}
        </span>
      </div>
      <div style={{ padding: '4px 14px 12px' }}>
        {fills.map((f, i) => {
          const selected = combinedFillIds.includes(f.fid);
          return (
            <FillRecipe
              key={f.fid}
              fill={f}
              index={i}
              vessel={vessel}
              route={route}
              mix={mix}
              xUnit={xUnit}
              lang={lang}
              selected={selected}
              showCombinedNote={selected && showCombined}
              onToggleCombine={() => onToggleCombine(f)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface FillRecipeProps {
  fill: Fill;
  index: number;
  vessel: Vessel;
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  lang: Lang;
  selected: boolean;
  showCombinedNote: boolean;
  onToggleCombine: () => void;
}

function FillRecipe({
  fill,
  index,
  vessel,
  route,
  mix,
  xUnit,
  lang,
  selected,
  showCombinedNote,
  onToggleCombine,
}: FillRecipeProps) {
  const strings = t(lang);
  const n = partsOf(fill, [vessel]);
  const lines = fillRecipeLines({ fill, index, vessel, route, mix, xUnit, lang });

  return (
    <div style={fillBlockStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <span
          style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleCombine}
            title={strings.combineFillCheckbox}
          />
          {strings.fill} {index + 1} · {rangeLabel(fill.from, fill.to, false, route, xUnit)}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 999,
            color: '#fff',
            background: sourceColor(fill.content),
            whiteSpace: 'nowrap',
          }}
        >
          {contentLabel(fill.content, lang)}
          {fill.content === 'gel' ? ` ${n}×` : ''}
        </span>
      </div>
      {showCombinedNote ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-2)' }}>{strings.combineNote}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {lines.map((line) => (
            <div
              key={line.k}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--muted-2)' }}>{line.k}</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {line.v}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
