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
