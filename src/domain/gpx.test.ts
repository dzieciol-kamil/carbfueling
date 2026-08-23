import { describe, expect, test } from 'vitest';
import { parseGpxXml } from './gpx';

function trkGpx(points: { lat: number; lon: number; ele: number }[]): string {
  const body = points
    .map((p) => `<trkpt lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele></trkpt>`)
    .join('\n');
  return `<?xml version="1.0"?><gpx><trk><trkseg>${body}</trkseg></trk></gpx>`;
}

function linePoints(n: number) {
  return Array.from({ length: n }, (_, i) => ({ lat: 50 + i * 0.01, lon: 19, ele: 100 + i * 10 }));
}

describe('parseGpxXml', () => {
  test('resamples elevation to 401 points spanning the track', () => {
    const result = parseGpxXml(trkGpx(linePoints(8)));
    expect(result.ele).toHaveLength(401);
    expect(result.ele[0]).toBeCloseTo(100, 6);
    expect(result.ele[400]).toBeCloseTo(170, 6);
    expect(result.distanceKm).toBeGreaterThan(1);
  });

  test('falls back to rtept when no trkpt is present', () => {
    const body = linePoints(8)
      .map((p) => `<rtept lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele></rtept>`)
      .join('\n');
    const xml = `<?xml version="1.0"?><gpx><rte>${body}</rte></gpx>`;
    const result = parseGpxXml(xml);
    expect(result.ele).toHaveLength(401);
    expect(result.ele[0]).toBeCloseTo(100, 6);
  });

  test('throws when there are too few points', () => {
    expect(() => parseGpxXml(trkGpx(linePoints(3)))).toThrow();
  });

  test('throws on malformed XML with no usable points', () => {
    expect(() => parseGpxXml('<not-gpx></not-gpx>')).toThrow();
  });

  test('parses a large degenerate file (unclosed trkpt tags) in roughly linear time', () => {
    function degenerateGpx(unclosedTags: number): string {
      const junk = '<trkpt lat="50.0" lon="19.0">'.repeat(unclosedTags);
      const valid = linePoints(8)
        .map((p) => `<trkpt lat="${p.lat}" lon="${p.lon}"><ele>${p.ele}</ele></trkpt>`)
        .join('');
      return `<?xml version="1.0"?><gpx><trk><trkseg>${junk}${valid}</trkseg></trk></gpx>`;
    }

    const small = degenerateGpx(35_000); // ~1 MB
    const large = degenerateGpx(280_000); // ~8 MB, 8x small

    parseGpxXml(small); // warm up the JIT before timing
    const t0 = performance.now();
    parseGpxXml(small);
    const smallMs = performance.now() - t0;

    const t1 = performance.now();
    parseGpxXml(large);
    const largeMs = performance.now() - t1;

    // Linear parsing scales ~8x with the input; a generous 25x ceiling still
    // catches quadratic/catastrophic-backtracking blowup (~64x) while tolerating
    // timer noise on small, sub-millisecond durations.
    expect(largeMs).toBeLessThan(Math.max(smallMs * 25, 200));
  });
});
