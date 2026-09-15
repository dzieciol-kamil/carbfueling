import qrcode from 'qrcode-generator';

// The one place the app encodes a QR code. Returns the raw module matrix rather than an
// image, so the same matrix feeds both the badge layout and the print-sized "Sam QR"
// format from one canvas renderer — and so it can be unit-tested without a DOM.

/** Error-correction level. 'H' recovers ~30% of the code, which is what lets the app icon
 *  sit in the middle without making it unscannable. Do not lower this while the logo is
 *  drawn over the centre. */
const ERROR_CORRECTION = 'H';

/** 0 = pick the smallest version that fits the payload. */
const AUTO_VERSION = 0;

export function qrModules(text: string): boolean[][] {
  const qr = qrcode(AUTO_VERSION, ERROR_CORRECTION);
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, row) =>
    Array.from({ length: n }, (_, col) => qr.isDark(row, col)),
  );
}

/** Modules of light that have to surround the symbol on every side. ISO/IEC 18004 mandates a
 *  quiet zone of 4 modules, and the matrix `qrModules()` returns does NOT include it — drawing
 *  that matrix edge-to-edge is why many scanners refuse the code. */
export const QR_QUIET_MODULES = 4;

/**
 * Pixel geometry for drawing a `qrModules()` matrix at roughly `cellPx` pixels per module.
 * `side` is the full extent of the drawn block, quiet zone on both sides included.
 *
 * The cell is snapped to a whole pixel so every module boundary lands on a pixel boundary. That
 * is what lets the renderer tile modules exactly — no sub-pixel seams to hide, so no need to
 * over-draw each module, which is what destroys the light/dark balance at small cell sizes.
 */
export function qrCanvasMetrics(
  moduleCount: number,
  cellPx: number,
  quietModules: number = QR_QUIET_MODULES,
): { side: number; cell: number; quiet: number } {
  const cell = Math.max(1, Math.round(cellPx));
  const quiet = quietModules * cell;
  return { side: moduleCount * cell + quiet * 2, cell, quiet };
}
