import type { CSSProperties, ReactNode } from 'react';
import type { YMode } from '../../store/appStore';
import type { StringTable } from '../../i18n/strings';
// `rate` mode's diagram is a real (compressed) screenshot of the live chart rather than a
// hand-drawn SVG reconstruction — attempts at faithfully redrawing the gut band / deficit
// fill / gel-vs-bottle color coding by hand kept drifting from how the real chart actually
// behaves (e.g. gut content dipping mid-way through a still-ongoing bottle fill), so the
// source of truth is a real capture instead. `fluid`/`sum` still use hand-authored SVG below.
// Same image regardless of app language — the callout list below is already localized, and
// the on-image "Izo · 650 ml" / "Energy gel" labels are legible either way.
import chartHelpRateImg from '../../assets/chart-help-rate.jpg';
import { CHART_COLORS } from './theme';

interface ChartHelpDiagramProps {
  mode: YMode;
  strings: StringTable;
  desktop: boolean;
}

interface Callout {
  n: number;
  // Only needed for callouts rendered as SVG markers (fluid/sum) — rate mode uses a real
  // screenshot instead of a hand-drawn diagram, so its callouts have no on-image marker.
  x?: number;
  y?: number;
  color: string;
  label: string;
  body: string;
}

const VIEW_W = 400;
const VIEW_H = 230;

// Fixed, hand-authored demo shapes for `fluid`/`sum` — deliberately not derived from any
// live or store data (see the "Why a static diagram" note in the plan's Global Constraints).
const NEED_PTS: [number, number][] = [
  [30, 200],
  [80, 150],
  [130, 120],
  [180, 105],
  [230, 98],
  [280, 95],
  [330, 93],
  [380, 91],
];
const ABSORBED_PTS: [number, number][] = [
  [30, 200],
  [55, 185],
  [80, 195],
  [105, 175],
  [130, 190],
  [155, 165],
  [180, 180],
  [205, 150],
  [230, 145],
  [255, 115],
  [280, 100],
  [330, 90],
  [380, 80],
];
const GUT_PTS: [number, number][] = [
  [30, 40],
  [70, 30],
  [110, 38],
  [150, 34],
  [190, 26],
  [230, 32],
  [270, 28],
  [310, 20],
  [350, 24],
  [380, 22],
];

const SUM_ABSORBED_PTS: [number, number][] = [
  [30, 200],
  [80, 175],
  [130, 155],
  [180, 140],
  [230, 125],
  [280, 105],
  [330, 85],
  [380, 60],
];
const SUM_NEED_PTS: [number, number][] = [
  [30, 200],
  [80, 165],
  [130, 135],
  [180, 110],
  [230, 90],
  [280, 72],
  [330, 58],
  [380, 45],
];
const SUM_INTAKE_PTS: [number, number][] = [
  [30, 200],
  [80, 170],
  [130, 145],
  [180, 120],
  [230, 95],
  [280, 75],
  [330, 55],
  [380, 35],
];
const CAP_Y = 70;
const GUT_LIMIT_Y = 14;
const GUT_BASE_Y = 48;

function pathFrom(pts: [number, number][]): string {
  return pts.map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y).join(' ');
}

function marker(n: number, x: number, y: number, color: string) {
  return (
    <g key={'m' + n}>
      <circle cx={x} cy={y} r={9} fill="#fff" stroke={color} strokeWidth={1.6} />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={700}
        fontFamily="'JetBrains Mono', monospace"
        fill={color}
      >
        {n}
      </text>
    </g>
  );
}

function frame(children: ReactNode) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {children}
    </svg>
  );
}

// Percent-of-image position for each numbered marker overlaid on the rate-mode screenshot
// (read off the actual saved image — see src/assets/chart-help-rate.jpg). Both the pl/en
// captures share the same chart geometry (only the on-image text differs), so one set of
// coordinates works for both.
const RATE_IMG_MARKERS: { n: number; leftPct: number; topPct: number; color: string }[] = [
  { n: 1, leftPct: 36, topPct: 42, color: CHART_COLORS.neutralLine },
  { n: 2, leftPct: 74, topPct: 10.2, color: '#B08E1E' },
  { n: 3, leftPct: 61, topPct: 44, color: CHART_COLORS.carb },
  { n: 4, leftPct: 11, topPct: 27, color: CHART_COLORS.carb },
  { n: 5, leftPct: 11, topPct: 52, color: CHART_COLORS.climb },
];

function htmlMarker(n: number, leftPct: number, topPct: number, color: string) {
  return (
    <span
      key={'hm' + n}
      style={{
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-50%, -50%)',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: '#fff',
        border: `1.6px solid ${color}`,
        color,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    >
      {n}
    </span>
  );
}

function rateDiagram(strings: StringTable) {
  // A real screenshot of the live chart, not a hand-drawn reconstruction — see the module
  // doc comment at the top of this file for why.
  const callouts: Callout[] = [
    { n: 1, color: CHART_COLORS.neutralLine, label: strings.need, body: strings.chartHelpNeedBody },
    { n: 2, color: '#B08E1E', label: strings.gutLane, body: strings.chartHelpGutBody },
    {
      n: 3,
      color: CHART_COLORS.carb,
      label: strings.absorbed,
      body: strings.chartHelpAbsorbedBody,
    },
    { n: 4, color: CHART_COLORS.carb, label: strings.legCap, body: strings.chartHelpCapBody },
    {
      n: 5,
      color: CHART_COLORS.climb,
      label: strings.chartHelpDeficitLabel,
      body: strings.chartHelpDeficitBody,
    },
  ];
  const svg = (
    <div style={{ position: 'relative' }}>
      <img
        src={chartHelpRateImg}
        alt=""
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 8 }}
      />
      {RATE_IMG_MARKERS.map((m) => htmlMarker(m.n, m.leftPct, m.topPct, m.color))}
    </div>
  );
  return { svg, callouts, lanes: undefined as ReactNode };
}

function fluidDiagram(strings: StringTable) {
  const callouts: Callout[] = [
    {
      n: 1,
      x: 255,
      y: 115,
      color: CHART_COLORS.water,
      label: strings.legFluid,
      body: strings.chartHelpFluidAbsorbedBody,
    },
    {
      n: 2,
      x: 330,
      y: 93,
      color: CHART_COLORS.neutralLine,
      label: strings.legSweat,
      body: strings.chartHelpSweatBody,
    },
    {
      n: 3,
      x: 350,
      y: 70,
      color: CHART_COLORS.water,
      label: strings.legCap,
      body: strings.chartHelpFluidCapBody,
    },
  ];
  const svg = frame(
    <>
      <line
        x1={30}
        x2={380}
        y1={CAP_Y}
        y2={CAP_Y}
        stroke={CHART_COLORS.water}
        strokeWidth={1}
        strokeDasharray="3 5"
        opacity={0.8}
      />
      <path
        d={pathFrom(NEED_PTS)}
        fill="none"
        stroke="#A8AEA9"
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      <path d={pathFrom(ABSORBED_PTS)} fill="none" stroke={CHART_COLORS.water} strokeWidth={2.8} />
      {callouts.map((c) => marker(c.n, c.x!, c.y!, c.color))}
    </>,
  );
  return { svg, callouts, lanes: undefined as ReactNode };
}

function sumDiagram(strings: StringTable) {
  const callouts: Callout[] = [
    {
      n: 1,
      x: 280,
      y: 105,
      color: CHART_COLORS.carb,
      label: strings.absorbed,
      body: strings.chartHelpSumAbsorbedBody,
    },
    {
      n: 2,
      x: 330,
      y: 58,
      color: CHART_COLORS.neutralLine,
      label: strings.need,
      body: strings.chartHelpSumNeedBody,
    },
    {
      n: 3,
      x: 230,
      y: 95,
      color: CHART_COLORS.carb,
      label: strings.intake,
      body: strings.chartHelpSumIntakeBody,
    },
    {
      n: 4,
      x: 200,
      y: 34,
      color: '#B08E1E',
      label: strings.gutLane,
      body: strings.chartHelpGutBody,
    },
  ];
  const svg = frame(
    <>
      <path
        d={
          pathFrom(GUT_PTS) +
          ` L${GUT_PTS[GUT_PTS.length - 1][0]},${GUT_BASE_Y} L${GUT_PTS[0][0]},${GUT_BASE_Y} Z`
        }
        fill="#C9A227"
        opacity={0.18}
      />
      <path d={pathFrom(GUT_PTS)} fill="none" stroke="#B08E1E" strokeWidth={1.6} />
      <line
        x1={30}
        x2={380}
        y1={GUT_LIMIT_Y}
        y2={GUT_LIMIT_Y}
        stroke={CHART_COLORS.climb}
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.7}
      />
      <line x1={30} x2={380} y1={GUT_BASE_Y} y2={GUT_BASE_Y} stroke="#E3E5E0" strokeWidth={1} />
      <path
        d={pathFrom(SUM_NEED_PTS)}
        fill="none"
        stroke="#A8AEA9"
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      <path
        d={pathFrom(SUM_INTAKE_PTS)}
        fill="none"
        stroke={CHART_COLORS.carb}
        strokeWidth={1.2}
        strokeDasharray="2 4"
        opacity={0.7}
      />
      <path
        d={pathFrom(SUM_ABSORBED_PTS)}
        fill="none"
        stroke={CHART_COLORS.carb}
        strokeWidth={2.8}
      />
      {callouts.map((c) => marker(c.n, c.x!, c.y!, c.color))}
    </>,
  );
  return { svg, callouts, lanes: undefined as ReactNode };
}

const listItemStyle: CSSProperties = {
  display: 'flex',
  gap: 9,
  alignItems: 'flex-start',
  fontSize: 12.5,
  lineHeight: 1.5,
  color: 'var(--ink-soft)',
};
const badgeStyle = (color: string): CSSProperties => ({
  flexShrink: 0,
  width: 18,
  height: 18,
  borderRadius: '50%',
  border: `1.6px solid ${color}`,
  color,
  fontSize: 10,
  fontWeight: 700,
  fontFamily: "'JetBrains Mono', monospace",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export function ChartHelpDiagram({ mode, strings, desktop }: ChartHelpDiagramProps) {
  const { svg, callouts, lanes } =
    mode === 'fluid'
      ? fluidDiagram(strings)
      : mode === 'sum'
        ? sumDiagram(strings)
        : rateDiagram(strings);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {svg}
      {lanes}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {callouts.map((c) => (
          <div key={c.n} style={listItemStyle}>
            <span style={badgeStyle(c.color)}>{c.n}</span>
            <span>
              <b>{c.label}</b> — {c.body}
            </span>
          </div>
        ))}
      </div>
      <span style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--muted)' }}>
        {desktop ? strings.chartHelpAxisNote : strings.chartHelpScrubNote}
      </span>
    </div>
  );
}
