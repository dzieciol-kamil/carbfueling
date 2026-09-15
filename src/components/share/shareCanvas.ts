import { dist, samples, type Sample } from '../../domain/fuel';
import { qrModules } from '../../domain/shareQr';
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

/** Output pixel sizes. 'qr' is deliberately the largest — it is meant to be printed and
 *  taped to a top tube or a race number, so it has to survive being scaled down on paper. */
const SIZES: Record<ShareLayout, { w: number; h: number }> = {
  badge: { w: 1000, h: 420 },
  qr: { w: 1200, h: 1200 },
  chart: { w: 1200, h: 720 },
};

const PAPER = '#FFFFFF';
const INK = CHART_COLORS.ink;
const MUTED = CHART_COLORS.muted;
const ACCENT = CHART_COLORS.carb;

const WORDMARK = 'CARB FUELING';
const SITE = 'carbfueling.com';

export function canvasSize(layout: ShareLayout): { w: number; h: number } {
  return SIZES[layout];
}

export function renderShareImage(canvas: HTMLCanvasElement, input: ShareRenderInput): void {
  const { w, h } = SIZES[input.layout];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Always light: these are files that get pasted onto other people's backgrounds and
  // printed, so they carry their own paper rather than inheriting the app's theme.
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  if (input.layout === 'badge') drawBadge(ctx, w, h, input);
  else if (input.layout === 'qr') drawQrOnly(ctx, w, h, input);
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
  const pad = 44;
  const qrSize = h - pad * 2;
  const qrX = w - pad - qrSize;

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

  drawQr(ctx, input.url, qrX, pad, qrSize);
}

function drawQrOnly(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  input: ShareRenderInput,
): void {
  const pad = 70;
  const footer = 80;
  const size = Math.min(w - pad * 2, h - pad * 2 - footer);
  drawQr(ctx, input.url, (w - size) / 2, pad, size);

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

function drawQr(
  ctx: CanvasRenderingContext2D,
  url: string,
  x: number,
  y: number,
  size: number,
): void {
  const modules = qrModules(url);
  const n = modules.length;
  const cell = size / n;

  ctx.fillStyle = PAPER;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = INK;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!modules[row][col]) continue;
      // +1 on the extent, not on the origin: adjacent cells must overlap by a hair or
      // sub-pixel gaps show up as white hairlines across a scanned code.
      ctx.fillRect(x + col * cell, y + row * cell, cell + 1, cell + 1);
    }
  }

  // The app icon over the centre. Error-correction level 'H' (see shareQr.ts) is what makes
  // this safe; keep the badge under ~22% of the code's width.
  const logo = Math.round(size * 0.2);
  const lx = x + (size - logo) / 2;
  const ly = y + (size - logo) / 2;
  const quiet = Math.round(logo * 0.12);
  ctx.fillStyle = PAPER;
  roundRect(ctx, lx - quiet, ly - quiet, logo + quiet * 2, logo + quiet * 2, logo * 0.3);
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
