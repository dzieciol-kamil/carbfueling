import type { CSSProperties } from 'react';
import { gaps } from '../../domain/dragMath';
import { dist } from '../../domain/fuel';
import { packFoodRows } from '../../domain/laneLayout';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { FillBar } from './FillBar';
import { FoodBar } from './FoodBar';

const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const labelColStyle: CSSProperties = {
  width: 168,
  flex: '0 0 168px',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  minWidth: 0,
};
const nameStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ink)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
const subStyle: CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
  color: 'var(--muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
const addColStyle: CSSProperties = {
  width: 40,
  flex: '0 0 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
};

function trackStyle(tone: string): CSSProperties {
  return {
    position: 'relative',
    flex: 1,
    minWidth: 0,
    height: 24,
    background: tone,
    borderRadius: 6,
  };
}

const emptyTrackHintStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 8,
  fontSize: 10,
  color: 'var(--muted-3)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  pointerEvents: 'none',
};

function addButtonStyle(can: boolean): CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: 7,
    cursor: can ? 'pointer' : 'not-allowed',
    border: '1px dashed ' + (can ? '#B9C0B7' : '#E6E8E2'),
    background: can ? '#F7F8F5' : '#FBFCFA',
    color: can ? 'var(--ink-soft)' : '#C9CEC7',
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    padding: 0,
    fontFamily: 'Archivo, sans-serif',
  };
}

function contentLabelFor(content: string, strings: ReturnType<typeof t>): string {
  return content === 'water' ? strings.water : content === 'gel' ? strings.gel : strings.izo;
}

export function LanesSection() {
  const route = useAppStore((s) => s.route);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const lang = useAppStore((s) => s.ui.lang);
  const tourDemoFid = useAppStore((s) => s.ui.tourDemoFid);
  const addFillInGap = useAppStore((s) => s.addFillInGap);
  const strings = t(lang);
  const distanceKm = dist(route);

  const demoVesselGid = fills.find((f) => f.fid === tourDemoFid)?.gid;
  const foodRows = packFoodRows(foods, distanceKm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 10 }}>
      {gear.map((vessel) => {
        const vesselFills = fills
          .filter((f) => f.gid === vessel.gid)
          .sort((a, b) => a.from - b.from);
        const can = gaps(vesselFills, distanceKm).length > 0;
        return (
          <div key={vessel.gid} style={rowStyle}>
            <div style={labelColStyle}>
              <span style={nameStyle}>{vessel.name}</span>
              <span style={subStyle}>
                {vessel.vol} ml ·{' '}
                {(vessel.allowed || []).map((k) => contentLabelFor(k, strings)).join(' / ')}
              </span>
            </div>
            <div style={trackStyle('#F4F5F2')}>
              {vesselFills.length === 0 && (
                <span style={emptyTrackHintStyle}>{strings.emptyLaneHint}</span>
              )}
              {vesselFills.map((f) => (
                <FillBar key={f.fid} fill={f} vessel={vessel} distanceKm={distanceKm} />
              ))}
            </div>
            <div style={addColStyle}>
              <button
                data-tour={vessel.gid === demoVesselGid ? 'demo-add-fill' : undefined}
                onClick={() => addFillInGap(vessel.gid)}
                disabled={!can}
                title={can ? strings.addFillTo + vessel.name : vessel.name + ' · ' + strings.noGap}
                style={addButtonStyle(can)}
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      {foodRows.map((row, i) => (
        <div key={'food' + i} style={rowStyle}>
          <div style={labelColStyle}>
            <span style={{ ...nameStyle, color: i === 0 ? 'var(--ink)' : 'transparent' }}>
              {i === 0 ? strings.foodLane : ''}
            </span>
            <span style={subStyle}>{i === 0 ? strings.foodLaneSub : ''}</span>
          </div>
          <div style={trackStyle('#FAF3EF')}>
            {row.map((fd) => (
              <FoodBar key={fd.id} food={fd} distanceKm={distanceKm} />
            ))}
          </div>
          <div style={addColStyle}>
            <button disabled style={{ ...addButtonStyle(false), visibility: 'hidden' }}>
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
