import type { CSSProperties } from 'react';
import { carbsFill, dist, rangeLabel } from '../../domain/fuel';
import { gaps } from '../../domain/dragMath';
import type {
  Fill,
  FoodItem,
  FoodLibEntry,
  MixSettings,
  RouteInput,
  Vessel,
  XUnit,
} from '../../domain/types';
import { t, type Lang } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { CHART_COLORS, sourceColor } from '../chart/theme';

function contentLabel(content: Fill['content'], lang: Lang): string {
  const strings = t(lang);
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

function foodName(fd: FoodItem, foodLib: FoodLibEntry[], lang: Lang): string {
  const entry = foodLib.find((x) => x.key === fd.key);
  return (entry && (entry[lang] || entry.en)) || fd.name || '—';
}

function rowStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '10px 12px',
    padding: '8px 10px',
    margin: '0 -10px',
    borderRadius: 8,
    borderBottom: '1px solid #F4F5F1',
    background: active ? '#F2F5EF' : 'transparent',
  };
}

const groupCardStyle: CSSProperties = {
  border: '1px solid var(--border-soft)',
  borderRadius: 12,
  padding: '12px 14px 10px',
};
const groupHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 8,
};
const metaStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 11,
  color: 'var(--muted)',
};

export function TimelineSection() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const lang = useAppStore((s) => s.ui.lang);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const timelineOpen = useAppStore((s) => s.ui.timelineOpen);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const toggleTimelineOpen = useAppStore((s) => s.toggleTimelineOpen);
  const setHoverKey = useAppStore((s) => s.setHoverKey);
  const addFillInGap = useAppStore((s) => s.addFillInGap);
  const strings = t(lang);
  const distanceKm = dist(route);

  const itemCountLabel = `${fills.length + foods.length} ${strings.itemsSuffix}`;

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-soft)' }}>
      <button
        onClick={toggleTimelineOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '10px 14px',
          border: '1px solid #E9EBE6',
          background: timelineOpen ? '#F6F7F4' : '#fff',
          borderRadius: 11,
          cursor: 'pointer',
          fontFamily: 'Archivo, sans-serif',
          color: 'var(--ink)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span
            style={{
              fontSize: 10,
              color: 'var(--muted)',
              display: 'inline-block',
              transform: timelineOpen ? 'rotate(90deg)' : 'none',
              transition: 'transform .15s',
            }}
          >
            ▸
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
            }}
          >
            {strings.timeline}
          </span>
        </span>
        <span
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--muted)' }}
        >
          {itemCountLabel}
        </span>
      </button>

      {timelineOpen && (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--muted-2)' }}>
            {strings.timelineHint}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gear.map((vessel) => (
              <VesselGroup
                key={vessel.gid}
                vessel={vessel}
                fills={fills.filter((f) => f.gid === vessel.gid)}
                route={route}
                mix={mix}
                xUnit={xUnit}
                distanceKm={distanceKm}
                lang={lang}
                hoverKey={hoverKey}
                setHoverKey={setHoverKey}
                addFillInGap={addFillInGap}
              />
            ))}
            <FoodGroup
              foods={foods}
              foodLib={foodLib}
              route={route}
              xUnit={xUnit}
              lang={lang}
              hoverKey={hoverKey}
              setHoverKey={setHoverKey}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface VesselGroupProps {
  vessel: Vessel;
  fills: Fill[];
  route: RouteInput;
  mix: MixSettings;
  xUnit: XUnit;
  distanceKm: number;
  lang: Lang;
  hoverKey: string | null;
  setHoverKey: (key: string | null) => void;
  addFillInGap: (gid: string) => void;
}

function VesselGroup({
  vessel,
  fills,
  route,
  mix,
  xUnit,
  distanceKm,
  lang,
  hoverKey,
  setHoverKey,
  addFillInGap,
}: VesselGroupProps) {
  const strings = t(lang);
  const sorted = fills.slice().sort((a, b) => a.from - b.from);
  const can = gaps(sorted, distanceKm).length > 0;

  return (
    <div style={groupCardStyle}>
      <div style={groupHeadStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: CHART_COLORS.carb,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{vessel.name}</span>
          <span style={metaStyle}>{vessel.vol} ml</span>
        </span>
        <span style={metaStyle}>
          {sorted.length} × {strings.fill.toLowerCase()} · {Math.max(0, sorted.length - 1)}{' '}
          {strings.refills}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((f, idx) => (
          <div
            key={f.fid}
            style={rowStyle(hoverKey === 'f' + f.fid)}
            onMouseEnter={() => setHoverKey('f' + f.fid)}
            onMouseLeave={() => setHoverKey(null)}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
                width: 196,
                flex: '0 0 196px',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 3,
                  background: sourceColor(f.content),
                  flexShrink: 0,
                }}
              />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {strings.fill} {idx + 1} · {contentLabel(f.content, lang)}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {carbsFill(f, [vessel], mix).toFixed(0)} g
                </span>
              </span>
            </span>
            <span
              style={{
                flex: '1 1 90px',
                minWidth: 80,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-soft)',
                textAlign: 'right',
              }}
            >
              {rangeLabel(f.from, f.to, false, route, xUnit)}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={() => addFillInGap(vessel.gid)}
        disabled={!can}
        style={{
          marginTop: 8,
          width: '100%',
          border: '1px dashed ' + (can ? '#C9CEC7' : '#E6E8E2'),
          background: can ? '#F7F8F5' : '#FBFCFA',
          color: can ? 'var(--ink-soft)' : '#B7BCB6',
          borderRadius: 9,
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'Archivo, sans-serif',
          cursor: can ? 'pointer' : 'not-allowed',
        }}
      >
        {can ? strings.addFill : strings.noRoom}
      </button>
    </div>
  );
}

interface FoodGroupProps {
  foods: FoodItem[];
  foodLib: FoodLibEntry[];
  route: RouteInput;
  xUnit: XUnit;
  lang: Lang;
  hoverKey: string | null;
  setHoverKey: (key: string | null) => void;
}

function FoodGroup({ foods, foodLib, route, xUnit, lang, hoverKey, setHoverKey }: FoodGroupProps) {
  const strings = t(lang);
  const sorted = foods.slice().sort((a, b) => a.from - b.from);
  const totalCarbs = foods.reduce((a, f) => a + f.carbs, 0);

  return (
    <div style={groupCardStyle}>
      <div style={groupHeadStyle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: CHART_COLORS.food,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{strings.foodLane}</span>
          <span style={metaStyle}>{strings.foodLaneSub}</span>
        </span>
        <span style={metaStyle}>
          {foods.length}× · {totalCarbs.toFixed(0)} g
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sorted.map((fd) => (
          <div
            key={fd.id}
            style={rowStyle(hoverKey === 'x' + fd.id)}
            onMouseEnter={() => setHoverKey('x' + fd.id)}
            onMouseLeave={() => setHoverKey(null)}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
                width: 196,
                flex: '0 0 196px',
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 3,
                  background: CHART_COLORS.food,
                  flexShrink: 0,
                }}
              />
              <span style={{ minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {foodName(fd, foodLib, lang)}
                </span>
                <span
                  style={{
                    display: 'block',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: 'var(--muted)',
                  }}
                >
                  {fd.carbs} g{fd.ml ? ` · ${fd.ml} ml` : ''} ·{' '}
                  {fd.cont ? strings.sipped : strings.shot}
                </span>
              </span>
            </span>
            <span
              style={{
                flex: '1 1 90px',
                minWidth: 80,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-soft)',
                textAlign: 'right',
              }}
            >
              {rangeLabel(fd.from, fd.to, !fd.cont, route, xUnit)}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 8,
          width: '100%',
          color: '#9AA09B',
          fontSize: 11,
          fontFamily: 'Archivo, sans-serif',
          padding: '6px 0',
          textAlign: 'left',
        }}
      >
        {strings.addFoodHint}
      </div>
    </div>
  );
}
