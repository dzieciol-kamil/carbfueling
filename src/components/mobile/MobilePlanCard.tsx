import { useRef, useState, type CSSProperties } from 'react';
import { carbsFill, dist, partArray, rangeLabel } from '../../domain/fuel';
import type { Content } from '../../domain/types';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { sourceColor } from '../chart/theme';
import { clampGelPortion, resolveFillMove, stepperStep } from './mobileMath';
import { MobileStepper } from './MobileStepper';

export type PlanCardItem =
  { kind: 'fill'; fid: number } | { kind: 'food'; id: number } | { kind: 'stop'; id: number };

const CONTENT_OPTIONS: Content[] = ['water', 'izo', 'gel'];

const cardStyle: CSSProperties = {
  border: '1px solid #E9EBE5',
  borderRadius: 13,
  overflow: 'hidden',
};
const rowBtnStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  padding: '11px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  cursor: 'pointer',
  textAlign: 'left',
};
const chipStyle = (active: boolean, color: string): CSSProperties => ({
  flex: 1,
  padding: '10px 4px',
  borderRadius: 9,
  border: '1px solid ' + (active ? color : 'var(--chip-border)'),
  background: active ? color : '#fff',
  color: active ? '#fff' : 'var(--muted-2)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'center',
});

export function MobilePlanCard({ item }: { item: PlanCardItem }) {
  const lang = useAppStore((s) => s.ui.lang);
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const stops = useAppStore((s) => s.stops);
  const updateStop = useAppStore((s) => s.updateStop);
  const removeStop = useAppStore((s) => s.removeStop);
  const selKey = useAppStore((s) => s.ui.selKey);
  const setSelKey = useAppStore((s) => s.setSelKey);
  const tourDemoFid = useAppStore((s) => s.ui.tourDemoFid);
  const updateFill = useAppStore((s) => s.updateFill);
  const removeFill = useAppStore((s) => s.removeFill);
  const setFillContent = useAppStore((s) => s.setFillContent);
  const updateFood = useAppStore((s) => s.updateFood);
  const removeFood = useAppStore((s) => s.removeFood);
  const strings = t(lang);

  const distanceKm = dist(route);
  const bigStep = stepperStep(distanceKm);

  const [showNoRoom, setShowNoRoom] = useState(false);
  const noRoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function flashNoRoomHint() {
    if (noRoomTimerRef.current) clearTimeout(noRoomTimerRef.current);
    setShowNoRoom(true);
    noRoomTimerRef.current = setTimeout(() => setShowNoRoom(false), 1200);
  }
  const noRoomHintStyle: CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    background: 'var(--ink)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 7,
    padding: '5px 9px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
    pointerEvents: 'none',
  };

  if (item.kind === 'fill') {
    const fill = fills.find((f) => f.fid === item.fid);
    if (!fill) return null;
    const vessel = gear.find((g) => g.gid === fill.gid);
    const siblingFills = fills
      .filter((f) => f.gid === fill.gid && f.fid !== fill.fid)
      .map((f) => ({ from: f.from, to: f.to }));
    // Growing "do" (resize) must stop at the nearest sibling ahead of this fill, not
    // sail through it — resize clamps at the boundary, it doesn't jump past like a move.
    const rightBound = siblingFills
      .filter((s) => s.from >= fill.from)
      .reduce((min, s) => Math.min(min, s.from), distanceKm);
    const key = 'f' + fill.fid;
    const expanded = selKey === key;
    const contentLabel =
      fill.content === 'water' ? strings.water : fill.content === 'gel' ? strings.gel : strings.izo;
    const carbs = Math.round(carbsFill(fill, gear, mix));
    const parts = fill.content === 'gel' ? partArray(fill, gear) : [];
    const n = parts.length;
    const subtitle =
      fill.content === 'gel'
        ? (vessel?.vol ?? 0) + ' ml · ' + n + ' ' + strings.gelPartsLabel + ' · ' + carbs + ' g'
        : (vessel?.vol ?? 0) + ' ml · ' + carbs + ' g';
    const rate = Math.round(carbsFill(fill, gear, mix) / Math.max(0.1, fill.to - fill.from));

    return (
      <div style={cardStyle}>
        <button
          type="button"
          data-tour={fill.fid === tourDemoFid ? 'demo-fill' : undefined}
          style={rowBtnStyle}
          onClick={() => setSelKey(expanded ? null : key)}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: sourceColor(fill.content),
              flex: '0 0 auto',
            }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {vessel?.name} · {contentLabel}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'var(--muted-3)',
              }}
            >
              {subtitle}
            </div>
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              flex: '0 0 auto',
            }}
          >
            {rangeLabel(fill.from, fill.to, false, route, 'km')}
          </span>
        </button>

        {expanded && (
          <div
            style={{
              position: 'relative',
              borderTop: '1px solid var(--border-soft)',
              background: '#FBFCFA',
              padding: '11px 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {showNoRoom && <span style={noRoomHintStyle}>{strings.noRoomHint}</span>}
            <div style={{ display: 'flex', gap: 6 }}>
              {(vessel?.allowed ?? CONTENT_OPTIONS).map((c) => (
                <button
                  key={c}
                  type="button"
                  style={chipStyle(fill.content === c, sourceColor(c))}
                  onClick={() => setFillContent(fill.fid, c)}
                >
                  {c === 'water' ? strings.water : c === 'gel' ? strings.gel : strings.izo}
                </button>
              ))}
            </div>

            {n <= 1 ? (
              <>
                <MobileStepper
                  label="od"
                  value={fill.from}
                  min={0}
                  max={distanceKm - (fill.to - fill.from)}
                  smallStep={1}
                  bigStep={bigStep}
                  onChange={(from) => {
                    const width = fill.to - fill.from;
                    const resolved = resolveFillMove(
                      from,
                      width,
                      fill.from,
                      siblingFills,
                      distanceKm,
                    );
                    if (resolved === fill.from) flashNoRoomHint();
                    else updateFill(fill.fid, { from: resolved, to: resolved + width });
                  }}
                />
                <MobileStepper
                  label="do"
                  value={fill.to}
                  min={fill.from + 1}
                  max={rightBound}
                  smallStep={1}
                  bigStep={bigStep}
                  onChange={(to) => {
                    if (to === fill.to) flashNoRoomHint();
                    else updateFill(fill.fid, { to });
                  }}
                />
              </>
            ) : (
              parts.map((posVal, k) => {
                if (k === 0) {
                  return (
                    <MobileStepper
                      key={k}
                      label={'od (porcja 1)'}
                      value={fill.from}
                      min={0}
                      max={distanceKm - (fill.to - fill.from)}
                      smallStep={0.5}
                      bigStep={bigStep}
                      onChange={(from) => {
                        const width = fill.to - fill.from;
                        const resolved = resolveFillMove(
                          from,
                          width,
                          fill.from,
                          siblingFills,
                          distanceKm,
                        );
                        if (resolved === fill.from) {
                          flashNoRoomHint();
                          return;
                        }
                        const delta = resolved - fill.from;
                        const pos = fill.pos ? fill.pos.map((p) => p + delta) : undefined;
                        updateFill(fill.fid, { from: resolved, to: fill.to + delta, pos });
                      }}
                    />
                  );
                }
                if (k === n - 1) {
                  return (
                    <MobileStepper
                      key={k}
                      label={'do (porcja ' + n + ')'}
                      value={fill.to}
                      min={fill.from + 0.5}
                      max={rightBound}
                      smallStep={0.5}
                      bigStep={bigStep}
                      onChange={(to) => {
                        if (to === fill.to) {
                          flashNoRoomHint();
                          return;
                        }
                        // Freeze the other portions at their current (possibly still
                        // default-even) positions so moving only the last boundary
                        // doesn't reflow points the user hasn't touched.
                        const pos = partArray(fill, gear);
                        pos[n - 1] = to;
                        updateFill(fill.fid, { to, pos });
                      }}
                    />
                  );
                }
                return (
                  <MobileStepper
                    key={k}
                    label={k + 1 + '.'}
                    value={posVal}
                    min={fill.from}
                    max={fill.to}
                    smallStep={0.5}
                    bigStep={bigStep}
                    onChange={(candidate) => {
                      const existing = partArray(fill, gear);
                      const clamped = clampGelPortion(
                        candidate,
                        k,
                        n,
                        fill.from,
                        fill.to,
                        existing,
                      );
                      const newPos = existing.slice();
                      newPos[k] = clamped;
                      updateFill(fill.fid, { pos: newPos });
                    }}
                  />
                );
              })
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: 'var(--muted)',
                }}
              >
                {rate + strings.rateInSegmentSuffix}
              </span>
              <button
                type="button"
                onClick={() => removeFill(fill.fid)}
                style={{
                  border: '1px solid #E3D3CD',
                  borderRadius: 8,
                  padding: '6px 10px',
                  background: '#fff',
                  color: 'var(--food)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {strings.removeItem}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (item.kind === 'stop') {
    const stop = stops.find((s) => s.id === item.id);
    if (!stop) return null;
    const key = 's' + stop.id;
    const expanded = selKey === key;
    return (
      <div style={cardStyle}>
        <button type="button" style={rowBtnStyle} onClick={() => setSelKey(expanded ? null : key)}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: '#9AA09B',
              flex: '0 0 auto',
            }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{stop.name}</div>
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              fontWeight: 600,
              flex: '0 0 auto',
            }}
          >
            {rangeLabel(stop.at, stop.at, true, route, 'km')}
          </span>
        </button>

        {expanded && (
          <div
            style={{
              borderTop: '1px solid var(--border-soft)',
              background: '#FBFCFA',
              padding: '11px 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <MobileStepper
              label="na"
              value={stop.at}
              min={0}
              max={distanceKm}
              smallStep={1}
              bigStep={bigStep}
              onChange={(at) => updateStop(stop.id, { at })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => removeStop(stop.id)}
                style={{
                  border: '1px solid #E3D3CD',
                  borderRadius: 8,
                  padding: '6px 10px',
                  background: '#fff',
                  color: 'var(--food)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {strings.removeItem}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const food = foods.find((f) => f.id === item.id);
  if (!food) return null;
  const key = 'x' + food.id;
  const expanded = selKey === key;
  const subtitle = food.ml ? food.ml + ' ml · ' + food.carbs + ' g' : food.carbs + ' g';
  const rate = Math.round(food.carbs / Math.max(0.1, food.to - food.from));

  return (
    <div style={cardStyle}>
      <button type="button" style={rowBtnStyle} onClick={() => setSelKey(expanded ? null : key)}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background: sourceColor('food'),
            flex: '0 0 auto',
          }}
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{food.name}</div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: 'var(--muted-3)',
            }}
          >
            {subtitle}
          </div>
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            fontWeight: 600,
            flex: '0 0 auto',
          }}
        >
          {rangeLabel(food.from, food.to, !food.cont, route, 'km')}
        </span>
      </button>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--border-soft)',
            background: '#FBFCFA',
            padding: '11px 12px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {food.cont ? (
            <>
              <MobileStepper
                label="na"
                value={food.from}
                min={0}
                max={distanceKm - (food.to - food.from)}
                smallStep={1}
                bigStep={bigStep}
                onChange={(from) => updateFood(food.id, { from, to: from + (food.to - food.from) })}
              />
              <MobileStepper
                label="do"
                value={food.to}
                min={food.from + 1}
                max={distanceKm}
                smallStep={1}
                bigStep={bigStep}
                onChange={(to) => updateFood(food.id, { to })}
              />
            </>
          ) : (
            <MobileStepper
              label="na"
              value={food.from}
              min={0}
              max={distanceKm}
              smallStep={1}
              bigStep={bigStep}
              onChange={(at) => updateFood(food.id, { from: at, to: at })}
            />
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              {food.cont ? rate + strings.rateInSegmentSuffix : strings.eatenOnceLabel}
            </span>
            <button
              type="button"
              onClick={() => removeFood(food.id)}
              style={{
                border: '1px solid #E3D3CD',
                borderRadius: 8,
                padding: '6px 10px',
                background: '#fff',
                color: 'var(--food)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {strings.removeItem}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
