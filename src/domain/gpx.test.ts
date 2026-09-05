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

  test('keeps the original coordinates, rounded, for writing course files', () => {
    const result = parseGpxXml(trkGpx(linePoints(8)));

    expect(result.pts).toHaveLength(8);
    expect(result.pts[0]).toEqual({ lat: 50, lon: 19, ele: 100 });
    expect(result.pts[7]).toEqual({ lat: 50.07, lon: 19, ele: 170 });
  });

  test('thins a dense track to the cap, keeping the first and last points', () => {
    const raw = linePoints(7001);
    const result = parseGpxXml(trkGpx(raw));

    expect(result.pts.length).toBeLessThanOrEqual(3000);
    expect(result.pts.length).toBeGreaterThan(2000);
    expect(result.pts[0]).toMatchObject({ lat: raw[0].lat });
    // Thinning by a whole step would otherwise stop short of the finish and cut the route's end.
    expect(result.pts[result.pts.length - 1]).toMatchObject({ lat: raw[7000].lat });
  });

  test('reads a TCX course, so the file the app exports can be loaded back in', () => {
    const body = linePoints(8)
      .map(
        (p) =>
          `<Trackpoint><Time>2020-01-01T06:00:00.000Z</Time>` +
          `<Position><LatitudeDegrees>${p.lat}</LatitudeDegrees>` +
          `<LongitudeDegrees>${p.lon}</LongitudeDegrees></Position>` +
          `<AltitudeMeters>${p.ele}</AltitudeMeters></Trackpoint>`,
      )
      .join('');
    const xml = `<?xml version="1.0"?><TrainingCenterDatabase><Courses><Course><Track>${body}</Track></Course></Courses></TrainingCenterDatabase>`;
    const result = parseGpxXml(xml);

    expect(result.ele[0]).toBeCloseTo(100, 6);
    expect(result.ele[400]).toBeCloseTo(170, 6);
    expect(result.pts).toHaveLength(8);
  });

  test('reads a TCX whose elements are namespace-qualified', () => {
    const body = linePoints(8)
      .map(
        (p) =>
          `<ns:Trackpoint><ns:Position><ns:LatitudeDegrees>${p.lat}</ns:LatitudeDegrees>` +
          `<ns:LongitudeDegrees>${p.lon}</ns:LongitudeDegrees></ns:Position>` +
          `<ns:AltitudeMeters>${p.ele}</ns:AltitudeMeters></ns:Trackpoint>`,
      )
      .join('');
    const result = parseGpxXml(`<?xml version="1.0"?><ns:Track>${body}</ns:Track>`);

    expect(result.pts).toHaveLength(8);
    expect(result.pts[0]).toEqual({ lat: 50, lon: 19, ele: 100 });
  });

  test('prefers the GPX track when a file somehow carries both', () => {
    const gpx = trkGpx(linePoints(8));
    const tcx = `<Trackpoint><Position><LatitudeDegrees>10</LatitudeDegrees><LongitudeDegrees>10</LongitudeDegrees></Position></Trackpoint>`;
    const result = parseGpxXml(gpx.replace('</gpx>', `${tcx}</gpx>`));

    expect(result.pts[0]).toEqual({ lat: 50, lon: 19, ele: 100 });
  });

  // The append of the finish line used to push the total to 3001 for 78 different input sizes under
  // 40k — 6000 among them — and settings import rejects a whole backup one point over the cap.
  test('never exceeds the cap, whatever the file size', () => {
    for (const n of [2999, 3000, 3001, 5999, 6000, 6001, 8999, 9000, 11998, 12000, 40000]) {
      const result = parseGpxXml(trkGpx(linePoints(n)));
      expect(result.pts.length, `${n} points in`).toBeLessThanOrEqual(3000);
      expect(result.pts[result.pts.length - 1].lat).toBeCloseTo(linePoints(n)[n - 1].lat, 5);
    }
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
