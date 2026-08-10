import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  absCap,
  carbsFill,
  dist,
  fmtX,
  prof,
  samples,
  valueAt,
  type Sample,
} from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { ElevationLayer } from '../chart/ElevationLayer';
import { CHART_COLORS, sourceColor } from '../chart/theme';

const WIDTH = 800;
const HEIGHT = 168;
const GUT_LIMIT = 60;

type RateKey = 'rate' | 'needRate' | 'fluidRate' | 'fluidNeedRate' | 'absorbed' | 'need' | 'gut';

function polyline(
  arr: Sample[],
  key: RateKey,
  px: (x: number) => number,
  py: (y: number) => number,
): string {
  return arr
    .map((p, i) => (i ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p[key]).toFixed(1))
    .join(' ');
}

export function MobileChart() {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const shops = useAppStore((s) => s.shops);
  const yMode = useAppStore((s) => s.ui.yMode);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const gpxPeek = useAppStore((s) => s.ui.gpxPeek);
  const scrubX = useAppStore((s) => s.ui.scrubX);
  const setScrubX = useAppStore((s) => s.setScrubX);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);
  const containerRef = useRef<HTMLDivElement>(null);

  const planState = { route, mix, gear, fills, foods, foodLib, shops };
  const S = samples(planState);
  const D = dist(route);
  const P = prof(route);

  const fluidMode = yMode === 'fluid';
  const sumMode = yMode === 'sum';
  const rateMode = !sumMode;
  const yk: RateKey = fluidMode ? 'fluidRate' : rateMode ? 'rate' : 'absorbed';
  const nk: RateKey = fluidMode ? 'fluidNeedRate' : rateMode ? 'needRate' : 'need';
  const izoCarbs = fills
    .filter((f) => f.content === 'izo')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const gelCarbs = fills
    .filter((f) => f.content === 'gel')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const cap = absCap(mix, izoCarbs, gelCarbs);

  const rawMaxY = fluidMode
    ? Math.max(750 * 1.1, ...S.map((p) => Math.max(p.fluidRate, p.fluidNeedRate))) * 1.1
    : rateMode
      ? Math.max(10, cap * 1.05, ...S.map((p) => Math.max(p.rate, p.needRate))) * 1.15
      : Math.max(1, ...S.map((p) => Math.max(p.absorbed, p.need))) * 1.08;
  // A route with zero total hours (distance set but speed still 0) makes samples()'s
  // rate EMA divide by a zero dt, producing NaN — guard here so a degenerate route
  // never puts a non-finite number into an SVG attribute.
  const maxY = Number.isFinite(rawMaxY) && rawMaxY > 0 ? rawMaxY : 10;

  // Shop-stop name chips (foreignObject below) sit at y=2..20 — only reserve
  // room for them above the gut lane when a route actually has a stop.
  const hasShops = shops.length > 0;
  const GT = hasShops ? 48 : 30;
  const GUT_TOP = hasShops ? 22 : 4;
  const gutPeak = Math.max(GUT_LIMIT * 1.25, ...S.map((p) => p.gut)) * 1.05;

  const px = (x: number) => (x / D) * WIDTH;
  const py = (y: number) => HEIGHT - ((Number.isFinite(y) ? y : 0) / maxY) * (HEIGHT - GT - 4);
  const gBase = GT - 8;
  const gy = (g: number) => gBase - (g / gutPeak) * (gBase - GUT_TOP);

  const runs: { color: string; pts: Sample[] }[] = [];
  S.forEach((p, i) => {
    const color = p.active ? sourceColor(p.active) : CHART_COLORS.neutralLine;
    const last = runs[runs.length - 1];
    if (!last || last.color !== color) runs.push({ color, pts: i ? [S[i - 1], p] : [p] });
    else last.pts.push(p);
  });

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setScrubX(frac * D);
  }

  function handlePointerDown(e: ReactPointerEvent) {
    updateFromClientX(e.clientX);
    const move = (ev: PointerEvent) => updateFromClientX(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setScrubX(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  const scrubFrac = scrubX != null ? Math.max(0, Math.min(1, scrubX / D)) : null;
  const badgeFlip = scrubFrac != null && scrubFrac > 0.62;

  const gutOver = S.some((p) => p.gut > GUT_LIMIT);
  const capY = fluidMode ? 750 : cap;
  const unit = fluidMode ? ' ml/h' : rateMode ? ' g/h' : ' g';

  let badgeLines: [string, string, string] | null = null;
  if (scrubX != null) {
    const topLine = fmtX(scrubX, true, route, xUnit);
    if (gpxPeek && route.gpxTrack && route.useGpx) {
      const N = P.N;
      const f = Math.max(0, Math.min(1, scrubX / D)) * N;
      const i = Math.min(N - 1, Math.floor(f));
      const a = P.pts[i];
      const b = P.pts[i + 1] ?? a;
      const ele = a.ele + (b.ele - a.ele) * (f - i);
      badgeLines = [topLine, Math.round(ele) + ' m', a.grad.toFixed(1) + ' %'];
    } else {
      const val = valueAt(S, D, scrubX, yk);
      const target = valueAt(S, D, scrubX, nk);
      badgeLines = [
        topLine,
        Math.round(val) + unit,
        strings.legendGpx + ' ' + Math.round(target) + unit,
      ];
    }
  }

  const showProfile = gpxPeek && route.gpxTrack && route.useGpx;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      style={{ position: 'relative', touchAction: 'none', userSelect: 'none' }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: HEIGHT, display: 'block' }}
      >
        {showProfile ? (
          <ElevationLayer
            pts={P.pts}
            distanceKm={D}
            width={WIDTH}
            height={HEIGHT}
            bottomPadding={0}
            share={1}
            visible
          />
        ) : (
          <>
            {!fluidMode && (
              <>
                <path
                  d={
                    polyline(S, 'gut', px, gy) + ' L' + WIDTH + ' ' + gBase + ' L0 ' + gBase + ' Z'
                  }
                  fill={gutOver ? CHART_COLORS.climb : '#C9A227'}
                  opacity={0.16}
                />
                <path
                  d={polyline(S, 'gut', px, gy)}
                  fill="none"
                  stroke={gutOver ? '#C0562C' : '#B08E1E'}
                  strokeWidth={1.6}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={0}
                  x2={WIDTH}
                  y1={gy(GUT_LIMIT)}
                  y2={gy(GUT_LIMIT)}
                  stroke={CHART_COLORS.climb}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.7}
                  vectorEffect="non-scaling-stroke"
                />
                <line
                  x1={0}
                  x2={WIDTH}
                  y1={gBase}
                  y2={gBase}
                  stroke="#E3E5E0"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}

            {fills.map((f) => (
              <rect
                key={'fb' + f.fid}
                x={px(f.from)}
                y={GT}
                width={Math.max(1, px(f.to) - px(f.from))}
                height={HEIGHT - GT}
                fill={sourceColor(f.content)}
                opacity={0.07}
              />
            ))}

            {[0.25, 0.5, 0.75].map((frac) => (
              <line
                key={'hg' + frac}
                x1={0}
                x2={WIDTH}
                y1={HEIGHT * frac}
                y2={HEIGHT * frac}
                stroke="#EDEFEA"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path
              d={polyline(S, yk, px, py) + ' L' + WIDTH + ' ' + HEIGHT + ' L0 ' + HEIGHT + ' Z'}
              fill={sourceColor(fluidMode ? 'water' : 'izo')}
              opacity={0.18}
            />

            {rateMode && (
              <line
                x1={0}
                x2={WIDTH}
                y1={py(capY)}
                y2={py(capY)}
                stroke={sourceColor(fluidMode ? 'water' : 'izo')}
                strokeWidth={1}
                strokeDasharray="3 5"
                opacity={0.8}
                vectorEffect="non-scaling-stroke"
              />
            )}

            <path
              d={polyline(S, nk, px, py)}
              fill="none"
              stroke="#A8AEA9"
              strokeWidth={2}
              strokeDasharray="6 5"
              vectorEffect="non-scaling-stroke"
            />

            {runs.map((run, i) => (
              <path
                key={'r' + i}
                fill="none"
                stroke={fluidMode ? CHART_COLORS.water : run.color}
                strokeWidth={2.8}
                vectorEffect="non-scaling-stroke"
                d={run.pts
                  .map((p, j) => (j ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p[yk]).toFixed(1))
                  .join(' ')}
              />
            ))}
          </>
        )}

        {shops.map((shop) => {
          const flip = D > 0 && shop.at / D > 0.78;
          return (
            <g key={'sh' + shop.id}>
              <line
                x1={px(shop.at)}
                x2={px(shop.at)}
                y1={0}
                y2={HEIGHT}
                stroke="#9AA09B"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <foreignObject
                x={flip ? px(shop.at) - 90 : px(shop.at) + 4}
                y={2}
                width={90}
                height={18}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    background: 'var(--track)',
                    border: '1px solid var(--chip-border)',
                    borderRadius: 5,
                    padding: '2px 5px',
                    fontFamily: "'Archivo', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--ink)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {shop.name}
                </div>
              </foreignObject>
            </g>
          );
        })}

        <line
          x1={0}
          x2={WIDTH}
          y1={HEIGHT - 1}
          y2={HEIGHT - 1}
          stroke="#DDE0DA"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {scrubX != null && (
          <line
            x1={px(scrubX)}
            x2={px(scrubX)}
            y1={0}
            y2={HEIGHT}
            stroke="var(--ink)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {badgeLines && scrubFrac != null && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: badgeFlip ? undefined : `calc(${scrubFrac * 100}% + 8px)`,
            right: badgeFlip ? `calc(${(1 - scrubFrac) * 100}% + 8px)` : undefined,
            minWidth: 104,
            background: 'var(--ink)',
            color: '#fff',
            borderRadius: 9,
            padding: '7px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#A8AEA9' }}
          >
            {badgeLines[0]}
          </span>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700 }}
          >
            {badgeLines[1]}
          </span>
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#A8AEA9' }}
          >
            {badgeLines[2]}
          </span>
        </div>
      )}

      {scrubX == null && <span style={hintStyle}>{strings.scrubHint}</span>}
    </div>
  );
}

const hintStyle: CSSProperties = {
  position: 'absolute',
  bottom: 4,
  right: 6,
  fontSize: 9,
  color: 'var(--muted-3)',
  pointerEvents: 'none',
};
