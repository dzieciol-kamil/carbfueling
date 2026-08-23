import type { ProfilePoint } from '../../domain/fuel';
import { CHART_COLORS } from './theme';

interface ElevationLayerProps {
  pts: ProfilePoint[];
  distanceKm: number;
  width: number;
  height: number;
  bottomPadding: number;
  share: number;
  visible: boolean;
}

export function niceStep(max: number, targetTicks = 4): number {
  const raw = max / targetTicks || 1;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

export interface ElevationTick {
  value: number;
  y: number;
}

export function elevationTicks(
  pts: ProfilePoint[],
  height: number,
  bottomPadding: number,
  share: number,
): ElevationTick[] {
  // The `, 1` floor keeps this from landing on exactly 0 for a genuinely flat profile (real
  // sea-level GPX data, or the empty-track fallback in prof()) — dividing by a 0 maxEle in py()
  // below would turn every y-coordinate into NaN, breaking the whole elevation path/ticks.
  const maxEle = Math.max(...pts.map((p) => p.ele), 1) * 1.1;
  const top = (height - bottomPadding) * (1 - share);
  const py = (ele: number) =>
    height - bottomPadding - (ele / maxEle) * (height - bottomPadding - top);
  const step = niceStep(maxEle);
  const ticks: ElevationTick[] = [];
  for (let v = 0; v <= maxEle + 0.001; v += step) ticks.push({ value: Math.round(v), y: py(v) });
  return ticks;
}

export function ElevationLayer({
  pts,
  distanceKm,
  width,
  height,
  bottomPadding,
  share,
  visible,
}: ElevationLayerProps) {
  if (!visible) return null;

  // See the `, 1` floor comment on elevationTicks' maxEle above.
  const maxEle = Math.max(...pts.map((p) => p.ele), 1) * 1.1;
  const top = (height - bottomPadding) * (1 - share);
  const px = (x: number) => (x / distanceKm) * width;
  const py = (ele: number) =>
    height - bottomPadding - (ele / maxEle) * (height - bottomPadding - top);
  const path = pts
    .map((p, i) => (i ? 'L' : 'M') + px(p.x).toFixed(1) + ' ' + py(p.ele).toFixed(1))
    .join(' ');
  const ticks = elevationTicks(pts, height, bottomPadding, share);

  const bands = pts
    .map((p, i) => {
      if (!i) return null;
      const color = p.grad > 2.5 ? CHART_COLORS.climb : p.grad < -2.5 ? CHART_COLORS.water : null;
      if (!color) return null;
      return (
        <rect
          key={'eb' + i}
          x={px(pts[i - 1].x)}
          y={0}
          width={px(p.x) - px(pts[i - 1].x) + 1}
          height={height - bottomPadding}
          fill={color}
          opacity={0.075}
        />
      );
    })
    .filter(Boolean);

  const gridlines = ticks.map((tick) => (
    <line
      key={'eg' + tick.value}
      x1={0}
      x2={width}
      y1={tick.y}
      y2={tick.y}
      stroke="#B9C0BB"
      strokeWidth={1}
      strokeDasharray="3 4"
      vectorEffect="non-scaling-stroke"
      opacity={0.6}
    />
  ));

  return (
    <>
      {bands}
      <path
        d={
          path +
          ' L' +
          width +
          ' ' +
          (height - bottomPadding) +
          ' L0 ' +
          (height - bottomPadding) +
          ' Z'
        }
        fill="#C6CEC8"
        opacity={0.5}
      />
      {gridlines}
      <path
        d={path}
        fill="none"
        stroke="#9AA39C"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}
