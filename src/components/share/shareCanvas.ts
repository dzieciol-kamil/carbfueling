import { dist, samples, type Sample } from '../../domain/fuel';
import { qrCanvasMetrics, qrModules } from '../../domain/shareQr';
import type { ShareStats } from '../../domain/shareSummary';
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
  vessels: string;
  stops: string;
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

/** Pixels per QR module. The layouts used to squeeze the code into a fixed box, which at a
 *  realistic plan link (105 modules) left ~3 px/module — far below what a phone camera can
 *  resolve, so the badge's code simply did not scan. The module size is the constant now and
 *  the canvas grows with the payload instead.
 *
 *  6 px is the floor at which a module survives the rescaling a messaging app applies to an
 *  attached image; the 'qr' format is meant to be printed and taped to a top tube, so it gets
 *  double that and stays legible when the paper is scaled down. */
const BADGE_QR_CELL = 6;
const QR_ONLY_CELL = 12;

const BADGE_PAD = 44;
const BADGE_GAP = 40;
/** Width reserved for the wordmark and the stat rows beside the code. */
const BADGE_STATS_W = 480;
/** Height the stat column needs on its own: wordmark, five rows, site line. The badge is only
 *  ever taller than this because of the code, but the layout must not collapse if it isn't. */
const BADGE_STATS_H = 382;

const QR_ONLY_PAD = 70;
const QR_ONLY_FOOTER = 80;

const CHART_SIZE = { w: 1200, h: 720 };

const PAPER = '#FFFFFF';
const INK = CHART_COLORS.ink;
const MUTED = CHART_COLORS.muted;
const ACCENT = CHART_COLORS.carb;

const WORDMARK = 'CARB FUELING';
const SITE = 'carbfueling.com';

const QR_CELL: Record<'badge' | 'qr', number> = { badge: BADGE_QR_CELL, qr: QR_ONLY_CELL };

/** Canvas size for a QR layout whose code block came out `side` pixels square. */
function sizeFor(layout: 'badge' | 'qr', side: number): { w: number; h: number } {
  if (layout === 'qr') {
    return { w: side + QR_ONLY_PAD * 2, h: side + QR_ONLY_PAD * 2 + QR_ONLY_FOOTER };
  }
  return {
    w: BADGE_PAD * 2 + BADGE_STATS_W + BADGE_GAP + side,
    h: BADGE_PAD * 2 + Math.max(side, BADGE_STATS_H),
  };
}

/** The two QR layouts size themselves from the code, so the output size depends on the link
 *  being encoded — hence the `url` argument. The panel's preview needs the same numbers for its
 *  CSS aspect-ratio, which is why this stays exported. Encoding is not free (tens of ms on a
 *  long link), so callers should not invoke this on every render. */
export function canvasSize(layout: ShareLayout, url: string): { w: number; h: number } {
  if (layout === 'chart') return CHART_SIZE;
  return sizeFor(layout, qrCanvasMetrics(qrModules(url).length, QR_CELL[layout]).side);
}

export function renderShareImage(canvas: HTMLCanvasElement, input: ShareRenderInput): void {
  // Encoded once here and handed to the layout: the canvas size and the drawing both need the
  // matrix, and encoding a long link at level 'H' costs tens of milliseconds.
  const modules = input.layout === 'chart' ? null : qrModules(input.url);
  const { w, h } =
    input.layout === 'chart' || !modules
      ? CHART_SIZE
      : sizeFor(input.layout, qrCanvasMetrics(modules.length, QR_CELL[input.layout]).side);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Always light: these are files that get pasted onto other people's backgrounds and
  // printed, so they carry their own paper rather than inheriting the app's theme.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  if (modules && input.layout === 'badge') drawBadge(ctx, w, h, input, modules);
  else if (modules && input.layout === 'qr') drawQrOnly(ctx, w, h, modules);
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
  modules: boolean[][],
): void {
  const pad = BADGE_PAD;
  const { side } = qrCanvasMetrics(modules.length, BADGE_QR_CELL);

  ctx.fillStyle = INK;
  ctx.font = '700 30px Archivo, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(WORDMARK, pad, pad);

  const rows: [string, string][] = [
    [input.labels.distance, `${input.stats.distanceKm} km`],
    [input.labels.duration, input.stats.durationLabel],
    [input.labels.carbs, `${input.stats.carbGph} g/h`],
    [input.labels.vessels, String(input.stats.vessels)],
    [input.labels.stops, String(input.stats.stops)],
  ];
  let y = pad + 62;
  for (const [label, value] of rows) {
    ctx.fillStyle = MUTED;
    ctx.font = '600 20px Archivo, Helvetica, sans-serif';
    ctx.fillText(label, pad, y + 8);
    ctx.fillStyle = INK;
    ctx.font = "700 34px 'JetBrains Mono', monospace";
    ctx.fillText(value, pad + 240, y);
    y += 56;
  }

  ctx.fillStyle = MUTED;
  ctx.font = '600 18px Archivo, Helvetica, sans-serif';
  ctx.fillText(SITE, pad, h - pad - 20);

  drawQr(ctx, modules, w - pad - side, pad + Math.round((h - pad * 2 - side) / 2), BADGE_QR_CELL);
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
  const plotTop = pad + 56;
  const plotBottom = h - pad - 96;
  const plotLeft = pad;
  const plotRight = w - pad;

  ctx.fillStyle = INK;
  ctx.font = '700 30px Archivo, Helvetica, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(WORDMARK, pad, pad);

  const S = samples(input.plan);
  const D = dist(input.plan.route);
  if (S.length > 1 && D > 0) {
    const maxY = Math.max(10, ...S.map((p) => Math.max(p.rate, p.needRate))) * 1.15;
    const px = (x: number) => plotLeft + (x / D) * (plotRight - plotLeft);
    const py = (v: number) => plotBottom - (v / maxY) * (plotBottom - plotTop);

    // Need first, so the supply line reads on top of it.
    strokeSeries(ctx, S, 'needRate', px, py, MUTED, 3, [10, 8]);
    strokeSeries(ctx, S, 'rate', px, py, ACCENT, 5, []);
  }

  ctx.strokeStyle = '#D8DCD6';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotBottom);
  ctx.lineTo(plotRight, plotBottom);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = '600 26px Archivo, Helvetica, sans-serif';
  ctx.fillText(input.caption, pad, plotBottom + 28);
  ctx.fillStyle = MUTED;
  ctx.font = '600 20px Archivo, Helvetica, sans-serif';
  ctx.fillText(SITE, pad, plotBottom + 66);
}

function strokeSeries(
  ctx: CanvasRenderingContext2D,
  S: Sample[],
  key: 'rate' | 'needRate',
  px: (x: number) => number,
  py: (v: number) => number,
  color: string,
  width: number,
  dash: number[],
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  S.forEach((p, i) => {
    const x = px(p.x);
    const y = py(p[key]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);
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
