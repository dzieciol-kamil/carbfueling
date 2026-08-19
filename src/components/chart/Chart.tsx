import { Fragment, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import {
  absCap,
  carbsFill,
  dist,
  distanceAtTime,
  fmtX,
  GUT_LIMIT,
  prof,
  samples,
  totalHours,
  valueAt,
  type Sample,
} from '../../domain/fuel';
import { t } from '../../i18n/strings';
import { useAppStore } from '../../store/appStore';
import { ElevationLayer, niceStep } from './ElevationLayer';
import { CHART_COLORS, sourceColor } from './theme';

const FLUID_CAP = 750;
const WIDTH = 800;

type NumericSampleKey =
  | 'intake'
  | 'absorbed'
  | 'gut'
  | 'ml'
  | 'need'
  | 'rate'
  | 'needRate'
  | 'fluidRate'
  | 'fluidNeedRate';

function polyline(
  samplesArr: Sample[],
  key: NumericSampleKey,
  px: (x: number) => number,
  py: (y: number) => number,
): string {
  return samplesArr
    .map((p, i) => (i ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p[key]).toFixed(1))
    .join(' ');
}

interface ChartProps {
  height: number;
  showAxis: boolean;
}

export function Chart({ height, showAxis }: ChartProps) {
  const route = useAppStore((s) => s.route);
  const mix = useAppStore((s) => s.mix);
  const gear = useAppStore((s) => s.gear);
  const fills = useAppStore((s) => s.fills);
  const foods = useAppStore((s) => s.foods);
  const foodLib = useAppStore((s) => s.foodLib);
  const yMode = useAppStore((s) => s.ui.yMode);
  const xUnit = useAppStore((s) => s.ui.xUnit);
  const hoverKey = useAppStore((s) => s.ui.hoverKey);
  const dragKey = useAppStore((s) => s.ui.dragKey);
  const scrubX = useAppStore((s) => s.ui.scrubX);
  const setScrubX = useAppStore((s) => s.setScrubX);
  const lang = useAppStore((s) => s.ui.lang);
  const strings = t(lang);
  const containerRef = useRef<HTMLDivElement>(null);

  const planState = { route, mix, gear, fills, foods, foodLib };
  const S = samples(planState);
  const D = dist(route);
  const P = prof(route);

  const fluidMode = yMode === 'fluid';
  const rateMode = yMode === 'rate' || fluidMode;
  const yk: NumericSampleKey = fluidMode ? 'fluidRate' : rateMode ? 'rate' : 'absorbed';
  const nk: NumericSampleKey = fluidMode ? 'fluidNeedRate' : rateMode ? 'needRate' : 'need';
  const izoCarbs = fills
    .filter((f) => f.content === 'izo')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const gelCarbs = fills
    .filter((f) => f.content === 'gel')
    .reduce((a, f) => a + carbsFill(f, gear, mix), 0);
  const cap = absCap(mix, izoCarbs, gelCarbs);
  const capY = fluidMode ? FLUID_CAP : cap;

  const maxY = fluidMode
    ? Math.max(FLUID_CAP * 1.1, ...S.map((p) => Math.max(p.fluidRate, p.fluidNeedRate))) * 1.1
    : rateMode
      ? Math.max(10, cap * 1.05, ...S.map((p) => Math.max(p.rate, p.needRate))) * 1.15
      : Math.max(1, ...S.map((p) => Math.max(p.intake, p.need))) * 1.08;

  const yUnit = fluidMode ? ' ml/h' : rateMode ? ' g/h' : ' g';
  const yStep = niceStep(maxY, 3);
  const yTicks: number[] = [];
  for (let v = 0; v <= maxY + 0.001; v += yStep) yTicks.push(v);

  const GT = showAxis ? 52 : 26;
  const gutPeak = Math.max(GUT_LIMIT * 1.25, ...S.map((p) => p.gut)) * 1.05;
  const PB = showAxis ? 22 : 14;

  const px = (x: number) => (x / D) * WIDTH;
  const py = (y: number) => height - PB - (y / maxY) * (height - PB - GT - 6);
  const gBase = GT - 8;
  const gy = (g: number) => gBase - (g / gutPeak) * (gBase - 4);

  const area =
    polyline(S, yk, px, py) + ' L' + WIDTH + ' ' + (height - PB) + ' L0 ' + (height - PB) + ' Z';

  let worst = { d: 0, x: 0 };
  S.forEach((p) => {
    const d = p.need - p.absorbed;
    if (d > worst.d) worst = { d, x: p.x };
  });

  const gutOver = S.some((p) => p.gut > GUT_LIMIT);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setScrubX(frac * D);
  }

  function handleMouseMove(e: ReactMouseEvent) {
    updateFromClientX(e.clientX);
  }

  function handleMouseLeave() {
    setScrubX(null);
  }

  const scrubFrac = scrubX != null ? Math.max(0, Math.min(1, scrubX / D)) : null;
  const badgeFlip = scrubFrac != null && scrubFrac > 0.62;

  let badgeLines: string[] | null = null;
  if (scrubX != null) {
    const topLine = fmtX(scrubX, true, route, xUnit);
    const mainLine = Math.round(valueAt(S, D, scrubX, yk)) + yUnit;
    const targetLine = strings.legendGpx + ' ' + Math.round(valueAt(S, D, scrubX, nk)) + yUnit;
    badgeLines = [topLine, mainLine, targetLine];
    if (route.useGpx && route.gpxTrack) {
      const N = P.N;
      const f = Math.max(0, Math.min(1, scrubX / D)) * N;
      const i = Math.min(N - 1, Math.floor(f));
      const a = P.pts[i];
      const b = P.pts[i + 1] ?? a;
      const ele = a.ele + (b.ele - a.ele) * (f - i);
      badgeLines.push(Math.round(ele) + ' m');
    }
  }

  const timeAxis = route.mode === 'time' || xUnit === 'h';
  const ticks: number[] = [];
  if (!timeAxis) {
    const step = D > 120 ? 50 : D > 40 ? 20 : 10;
    for (let k = 0; k <= D + 0.01; k += step) ticks.push(k);
  } else {
    const hrs = totalHours(route);
    const step = hrs > 6 ? 1 : hrs > 3 ? 0.5 : 0.25;
    for (let hh = 0; hh <= hrs + 0.001; hh += step) ticks.push(distanceAtTime(route, hh));
  }

  const runs: { color: string; pts: Sample[] }[] = [];
  S.forEach((p, i) => {
    const color = p.active ? sourceColor(p.active) : CHART_COLORS.neutralLine;
    const last = runs[runs.length - 1];
    if (!last || last.color !== color) {
      runs.push({ color, pts: i ? [S[i - 1], p] : [p] });
    } else {
      last.pts.push(p);
    }
  });

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative' }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: `${height}px`, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="fpg" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor={CHART_COLORS.carb} stopOpacity={0.24} />
            <stop offset="100%" stopColor={CHART_COLORS.carb} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <defs>
          <linearGradient id="fpb" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0%" stopColor={CHART_COLORS.water} stopOpacity={0.24} />
            <stop offset="100%" stopColor={CHART_COLORS.water} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <ElevationLayer
          pts={prof(route).pts}
          distanceKm={D}
          width={WIDTH}
          height={height}
          bottomPadding={PB}
          share={showAxis ? 0.62 : 0.7}
          visible={route.useGpx}
        />

        {!fluidMode && (
          <>
            <path
              d={polyline(S, 'gut', px, gy) + ' L' + WIDTH + ' ' + gBase + ' L0 ' + gBase + ' Z'}
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

        {fills.map((f) => {
          const key = 'f' + f.fid;
          const on = hoverKey === key || dragKey === key;
          const color =
            f.content === 'water'
              ? CHART_COLORS.water
              : f.content === 'gel'
                ? CHART_COLORS.gel
                : CHART_COLORS.carb;
          return (
            <g key={key} opacity={on ? 1 : 0.34}>
              <rect
                x={px(f.from)}
                y={0}
                width={Math.max(1, px(f.to) - px(f.from))}
                height={height - PB}
                fill={color}
                opacity={on ? 0.14 : 0.03}
              />
              <line
                x1={px(f.from)}
                x2={px(f.from)}
                y1={0}
                y2={height - PB}
                stroke={color}
                strokeWidth={on ? 1.6 : 1}
                strokeDasharray={on ? undefined : '2 4'}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}

        {foods.map((fd) => {
          const key = 'x' + fd.id;
          const on = hoverKey === key || dragKey === key;
          return (
            <line
              key={key}
              x1={px(fd.from)}
              x2={px(fd.from)}
              y1={0}
              y2={height - PB}
              stroke={CHART_COLORS.food}
              opacity={on ? 1 : 0.4}
              strokeWidth={on ? 1.6 : 1}
              strokeDasharray={on ? undefined : '2 4'}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {ticks.map((k, i) => (
          <line
            key={'g' + i}
            x1={px(k)}
            x2={px(k)}
            y1={4}
            y2={height - PB}
            stroke="#EDEFEA"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1={0}
          x2={WIDTH}
          y1={height - PB}
          y2={height - PB}
          stroke="#DDE0DA"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        <path d={area} fill={fluidMode ? 'url(#fpb)' : 'url(#fpg)'} />

        {rateMode && (
          <path
            fill={CHART_COLORS.climb}
            opacity={0.16}
            d={
              polyline(S, nk, px, py) +
              ' ' +
              S.slice()
                .reverse()
                .map((p) => 'L' + px(p.x).toFixed(1) + ' ' + py(Math.min(p[yk], p[nk])).toFixed(1))
                .join(' ') +
              ' Z'
            }
          />
        )}

        {rateMode && (
          <line
            x1={0}
            x2={WIDTH}
            y1={py(capY)}
            y2={py(capY)}
            stroke={fluidMode ? CHART_COLORS.water : CHART_COLORS.carb}
            strokeWidth={1}
            strokeDasharray="3 5"
            opacity={0.8}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {!rateMode && (
          <path
            d={polyline(S, 'intake', px, py)}
            fill="none"
            stroke={CHART_COLORS.carb}
            strokeWidth={1.2}
            strokeDasharray="2 4"
            opacity={0.55}
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
            strokeWidth={2.6}
            strokeLinejoin="miter"
            strokeLinecap="butt"
            vectorEffect="non-scaling-stroke"
            d={run.pts
              .map((p, j) => (j ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p[yk]).toFixed(1))
              .join(' ')}
          />
        ))}

        {!rateMode && worst.d > 12 && (
          <line
            x1={px(worst.x)}
            x2={px(worst.x)}
            y1={4}
            y2={height - PB}
            stroke={CHART_COLORS.climb}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {showAxis &&
          yTicks.map((v, i) => (
            <Fragment key={'yg' + i}>
              {v > 0 && (
                <line
                  x1={0}
                  x2={WIDTH}
                  y1={py(v)}
                  y2={py(v)}
                  stroke="#EDEFEA"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              <text
                x={4}
                y={py(v) - 4}
                fill={CHART_COLORS.muted}
                fontSize={10}
                fontFamily="JetBrains Mono, monospace"
              >
                {Math.round(v) + yUnit}
              </text>
            </Fragment>
          ))}
        {showAxis &&
          ticks.map((k, i) => (
            <Fragment key={'t' + i}>
              <text
                x={px(k) + 4}
                y={height - 6}
                fill={CHART_COLORS.muted}
                fontSize={11}
                fontFamily="JetBrains Mono, monospace"
              >
                {fmtX(k, i === ticks.length - 1, route, xUnit)}
              </text>
            </Fragment>
          ))}

        {scrubX != null && (
          <line
            x1={px(scrubX)}
            x2={px(scrubX)}
            y1={0}
            y2={height - PB}
            stroke="var(--ink)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}
      </svg>

      {badgeLines && scrubFrac != null && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: badgeFlip ? undefined : `calc(${scrubFrac * 100}% + 10px)`,
            right: badgeFlip ? `calc(${(1 - scrubFrac) * 100}% + 10px)` : undefined,
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
          {badgeLines.map((line, i) => (
            <span
              key={i}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: i === 1 ? 15 : 10,
                fontWeight: i === 1 ? 700 : 400,
                color: i === 1 ? '#fff' : '#A8AEA9',
              }}
            >
              {line}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
