import { dist, samples, type Sample } from '../../domain/fuel';
import { qrCanvasMetrics, qrModules } from '../../domain/shareQr';
import { fmtHydration, type ShareStats } from '../../domain/shareSummary';
import type { PlanState } from '../../domain/types';
import { CHART_COLORS } from '../chart/theme';

// One canvas renderer for all three downloadable share formats. The panel's live preview and
// the "Pobierz PNG" download call this same function against the same input, so the preview
// is the file. Layout-specific geometry is the only thing that branches.

export type ShareLayout = 'badge' | 'qr' | 'chart';

export interface ShareLabels {
  distance: string;
  duration: string;
  carbs: string;
  hydration: string;
  vessels: string;
  stops: string;
  /** Legend of the plot. Bare nouns with no units — see `drawPlot`. */
  legendCarbs: string;
  legendWater: string;
}

export interface ShareRenderInput {
  layout: ShareLayout;
  /** The share link the QR encodes. */
  url: string;
  stats: ShareStats;
  /** One-line caption under the chart layout. */
  caption: string;
  labels: ShareLabels;
  plan: PlanState;
}

/** Pixels per QR module. The layout used to squeeze the code into a fixed box, which at a
 *  realistic plan link (105 modules) left ~3 px/module — far below what a phone camera can
 *  resolve, so the code simply did not scan. The module size is the constant now and the canvas
 *  grows with the payload instead. The 'qr' format is meant to be printed and taped to a top
 *  tube, so 12 px keeps it legible even when the paper is scaled down. */
const QR_ONLY_CELL = 12;

const BADGE_PAD = 44;
const BADGE_GAP = 44;
/** Stat column: the wordmark and the six rows. `BADGE_VALUE_DX` is where the value sits relative
 *  to the label's left edge — wide enough for the longest label ("Kohlenhydrate") at its type
 *  size, and the column is that plus the widest value ("~1.5 l" in 44 px mono). */
const BADGE_STATS_W = 500;
const BADGE_VALUE_DX = 300;
const BADGE_ROW_H = 68;
const BADGE_ROWS_TOP = BADGE_PAD + 74;
const BADGE_PLOT_W = 560;
/** Fixed again: with the QR gone, nothing about the badge depends on the link's length. */
const BADGE_SIZE = {
  w: BADGE_PAD * 2 + BADGE_STATS_W + BADGE_GAP + BADGE_PLOT_W,
  h: 640,
};

const QR_ONLY_PAD = 70;
const QR_ONLY_FOOTER = 80;

const CHART_SIZE = { w: 1200, h: 720 };

const PAPER = '#FFFFFF';
const INK = CHART_COLORS.ink;
const MUTED = CHART_COLORS.muted;
const ACCENT = CHART_COLORS.carb;

const WORDMARK = 'CARB FUELING';
const SITE = 'carbfueling.com';

/** Canvas size for the 'qr' layout, whose code block came out `side` pixels square. */
function qrOnlySize(side: number): { w: number; h: number } {
  return { w: side + QR_ONLY_PAD * 2, h: side + QR_ONLY_PAD * 2 + QR_ONLY_FOOTER };
}

/** Only the 'qr' layout sizes itself from the code, so only it depends on the link being
 *  encoded — but the `url` argument stays for every layout so callers need no special case. The
 *  panel's preview needs these numbers for its CSS aspect-ratio, which is why this stays
 *  exported. Encoding is not free (tens of ms on a long link), so callers should not invoke this
 *  on every render. */
export function canvasSize(layout: ShareLayout, url: string): { w: number; h: number } {
  if (layout === 'chart') return CHART_SIZE;
  if (layout === 'badge') return BADGE_SIZE;
  return qrOnlySize(qrCanvasMetrics(qrModules(url).length, QR_ONLY_CELL).side);
}

export function renderShareImage(canvas: HTMLCanvasElement, input: ShareRenderInput): void {
  // Encoded once here and handed to the layout: the canvas size and the drawing both need the
  // matrix, and encoding a long link at level 'H' costs tens of milliseconds. Only 'qr' still
  // carries a code — the badge shows the plan's curve instead.
  const modules = input.layout === 'qr' ? qrModules(input.url) : null;
  const { w, h } = modules
    ? qrOnlySize(qrCanvasMetrics(modules.length, QR_ONLY_CELL).side)
    : input.layout === 'badge'
      ? BADGE_SIZE
      : CHART_SIZE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Always light: these are files that get pasted onto other people's backgrounds and
  // printed, so they carry their own paper rather than inheriting the app's theme.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  if (modules) drawQrOnly(ctx, w, h, modules);
  else if (input.layout === 'badge') drawBadge(ctx, w, h, input);
  else drawChart(ctx, w, h, input);
}

export function shareImageFileName(layout: ShareLayout, now: Date = new Date()): string {
  const iso = now.toISOString().slice(0, 10);
  const kind = layout === 'badge' ? 'odznaka' : layout === 'qr' ? 'qr' : 'wykres';
  return `carb-fueling-${kind}-${iso}.png`;
}

// --- layouts ------------------------------------------------------------------

function drawBadge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  input: ShareRenderInput,
): void {
  const pad = BADGE_PAD;

  ctx.fillStyle = INK;
  ctx.font = '700 34px Archivo, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(WORDMARK, pad, pad);

  const rows: [string, string][] = [
    [input.labels.distance, `${input.stats.distanceKm} km`],
    [input.labels.duration, input.stats.durationLabel],
    [input.labels.carbs, `${input.stats.carbGph} g/h`],
    [input.labels.hydration, fmtHydration(input.stats.hydrationL)],
    [input.labels.vessels, String(input.stats.vessels)],
    [input.labels.stops, String(input.stats.stops)],
  ];
  let y = BADGE_ROWS_TOP;
  for (const [label, value] of rows) {
    ctx.fillStyle = MUTED;
    ctx.font = '600 26px Archivo, Helvetica, sans-serif';
    // The label's cap height is half the value's, so it is nudged down to sit on the same optical
    // line rather than hanging off the value's top edge.
    ctx.fillText(label, pad, y + 10);
    ctx.fillStyle = INK;
    ctx.font = "700 44px 'JetBrains Mono', monospace";
    ctx.fillText(value, pad + BADGE_VALUE_DX, y);
    y += BADGE_ROW_H;
  }

  ctx.fillStyle = MUTED;
  ctx.font = '600 22px Archivo, Helvetica, sans-serif';
  ctx.fillText(SITE, pad, h - pad - 26);

  // The same curve the 'chart' layout draws, at the badge's own size: the rows say what the plan
  // is, the shape says what it looks like.
  drawPlot(ctx, input, {
    x: w - pad - BADGE_PLOT_W,
    y: BADGE_ROWS_TOP,
    w: BADGE_PLOT_W,
    h: y - BADGE_ROWS_TOP,
    labelPx: 18,
    strokePx: 4,
  });
}

function drawQrOnly(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  modules: boolean[][],
): void {
  const pad = QR_ONLY_PAD;
  const { side } = qrCanvasMetrics(modules.length, QR_ONLY_CELL);
  drawQr(ctx, modules, (w - side) / 2, pad, QR_ONLY_CELL);

  ctx.fillStyle = INK;
  ctx.font = '700 34px Archivo, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(WORDMARK, w / 2, h - pad - 26);
  ctx.fillStyle = MUTED;
  ctx.font = '600 22px Archivo, Helvetica, sans-serif';
  ctx.fillText(SITE, w / 2, h - pad + 8);
  ctx.textAlign = 'left';
}

function drawChart(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  input: ShareRenderInput,
): void {
  const pad = 56;
  const plotTop = pad + 66;
  const plotBottom = h - pad - 100;

  ctx.fillStyle = INK;
  ctx.font = '700 34px Archivo, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(WORDMARK, pad, pad);

  drawPlot(ctx, input, {
    x: pad,
    y: plotTop,
    w: w - pad * 2,
    h: plotBottom - plotTop,
    labelPx: 22,
    strokePx: 6,
  });

  ctx.fillStyle = INK;
  ctx.font = '600 26px Archivo, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(input.caption, pad, plotBottom + 30);
  ctx.fillStyle = MUTED;
  ctx.font = '600 20px Archivo, Helvetica, sans-serif';
  ctx.fillText(SITE, pad, plotBottom + 68);
}

// --- the plot -----------------------------------------------------------------

interface PlotBox {
  x: number;
  y: number;
  w: number;
  /** Includes the legend strip along the bottom — the curves get what's left above it. */
  h: number;
  labelPx: number;
  strokePx: number;
}

/**
 * The plan's two curves, shared by the 'chart' and 'badge' layouts so they cannot drift apart.
 *
 * Decoration, not a graph: it carries no numbers at all — no units, no ticks, no gridlines, no
 * axis values — because nobody reads values off a shared PNG. Every figure worth having is
 * printed as text elsewhere (the badge's stat rows, the chart's caption). That is also why the
 * two series can each be normalised against their own peak despite being g/h and ml/h: with no
 * scale on the canvas there is no reading to mislead, and both curves fill the box as shapes.
 * The legend is the one thing that has to be there — it says which colour is which.
 */
function drawPlot(ctx: CanvasRenderingContext2D, input: ShareRenderInput, box: PlotBox): void {
  const legendH = Math.round(box.labelPx * 2.2);
  const bottom = box.y + box.h - legendH;

  const S = samples(input.plan);
  const D = dist(input.plan.route);
  if (S.length > 1 && D > 0) {
    const px = (x: number) => box.x + (x / D) * box.w;
    // 1.12 keeps the peak off the top edge; a flat-zero series collapses onto the baseline
    // rather than dividing by zero.
    const scale = (max: number) => (v: number) =>
      bottom - (max > 0 ? v / (max * 1.12) : 0) * (bottom - box.y);
    const pyCarb = scale(Math.max(...S.map((p) => p.rate)));
    const pyFluid = scale(Math.max(...S.map((p) => p.fluidRate)));

    // Water underneath, carbs on top: carbs are the plan's subject, so they take the front.
    drawSeries(ctx, S, 'fluidRate', px, pyFluid, CHART_COLORS.water, box.strokePx, bottom);
    drawSeries(ctx, S, 'rate', px, pyCarb, ACCENT, box.strokePx, bottom);
  }

  ctx.strokeStyle = '#D8DCD6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(box.x, bottom);
  ctx.lineTo(box.x + box.w, bottom);
  ctx.stroke();

  drawLegend(ctx, input.labels, box, bottom + legendH / 2 + box.labelPx * 0.2);
}

/** A soft fill under the curve plus the stroke on top. The fill is what makes the pair read as a
 *  graphic rather than two wires; '22' is ~13% alpha, light enough that the overlap of the two
 *  stays legible. */
function drawSeries(
  ctx: CanvasRenderingContext2D,
  S: Sample[],
  key: 'rate' | 'fluidRate',
  px: (x: number) => number,
  py: (v: number) => number,
  color: string,
  width: number,
  baseline: number,
): void {
  const trace = () =>
    S.forEach((p, i) => {
      const x = px(p.x);
      const y = py(p[key]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

  ctx.beginPath();
  trace();
  ctx.lineTo(px(S[S.length - 1].x), baseline);
  ctx.lineTo(px(S[0].x), baseline);
  ctx.closePath();
  ctx.fillStyle = color + '22';
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  trace();
  ctx.stroke();
}

/** Swatch + word per series, laid out left to right from measured widths so a long translation
 *  ("Kohlenhydrate") pushes the next entry along instead of being written over. */
function drawLegend(
  ctx: CanvasRenderingContext2D,
  labels: ShareLabels,
  box: PlotBox,
  cy: number,
): void {
  const swatchW = box.labelPx * 1.7;
  const swatchH = Math.max(3, Math.round(box.labelPx * 0.3));
  const gap = box.labelPx * 0.6;

  ctx.font = `600 ${box.labelPx}px Archivo, Helvetica, sans-serif`;
  ctx.textBaseline = 'middle';
  let x = box.x;
  for (const [color, label] of [
    [ACCENT, labels.legendCarbs],
    [CHART_COLORS.water, labels.legendWater],
  ] as const) {
    ctx.fillStyle = color;
    roundRect(ctx, x, cy - swatchH / 2, swatchW, swatchH, swatchH / 2);
    ctx.fill();
    ctx.fillStyle = MUTED;
    ctx.fillText(label, x + swatchW + gap, cy);
    x += swatchW + gap + ctx.measureText(label).width + box.labelPx * 1.8;
  }
  ctx.textBaseline = 'top';
}

// --- QR -----------------------------------------------------------------------

/** Draws the matrix at (x, y) with `cellPx` pixels per module. The block it covers is
 *  `qrCanvasMetrics(modules.length, cellPx).side` wide and tall — the callers compute that too,
 *  because it is what the canvas is sized from. */
function drawQr(
  ctx: CanvasRenderingContext2D,
  modules: boolean[][],
  x: number,
  y: number,
  cellPx: number,
): void {
  const n = modules.length;
  const { side, cell, quiet } = qrCanvasMetrics(n, cellPx);

  // Paints the quiet zone as well: those 4 modules of light are part of the symbol as far as a
  // decoder is concerned, so they are drawn rather than left to whatever sits behind the code.
  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, side, side);

  const ox = x + quiet;
  const oy = y + quiet;
  ctx.fillStyle = INK;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!modules[row][col]) continue;
      // Exact integer tiling: `cell` is a whole number of pixels, so neighbouring modules abut
      // with nothing between them. The previous code padded every rect to `cell + 1` to hide
      // sub-pixel seams, which at a small cell fattened each dark module by a third and wrecked
      // the light/dark balance a scanner thresholds on.
      ctx.fillRect(ox + col * cell, oy + row * cell, cell, cell);
    }
  }

  // The app icon over the centre. Error-correction level 'H' (see shareQr.ts) recovers ~30% of
  // the symbol, and the icon plus its white halo has to stay inside that: measured against the
  // symbol width (quiet zone excluded), 0.17 × 1.24 ≈ 21%.
  const symbol = n * cell;
  const logo = Math.round(symbol * 0.17);
  const halo = Math.round(logo * 0.12);
  const lx = ox + (symbol - logo) / 2;
  const ly = oy + (symbol - logo) / 2;
  ctx.fillStyle = PAPER;
  roundRect(ctx, lx - halo, ly - halo, logo + halo * 2, logo + halo * 2, logo * 0.3);
  ctx.fill();
  drawAppIcon(ctx, lx, ly, logo);
}

/** The favicon, redrawn rather than loaded: `public/favicon.svg` is four path commands on a
 *  32×32 box, and redrawing it keeps the renderer synchronous and free of any image-loading
 *  or canvas-tainting concern. Keep in sync with `public/favicon.svg`. */
function drawAppIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = size / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#16191c';
  roundRect(ctx, 0, 0, 32 * s, 32 * s, 7 * s);
  ctx.fill();
  ctx.strokeStyle = '#5aa33f';
  ctx.lineWidth = 2.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(5 * s, 21 * s);
  ctx.bezierCurveTo(10 * s, 22 * s, 12 * s, 12 * s, 16.5 * s, 12 * s);
  // The SVG's `S` command reflects the previous control point: (2*16.5-12, 2*12-12).
  ctx.bezierCurveTo(21 * s, 12 * s, 23 * s, 20 * s, 27 * s, 8 * s);
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
