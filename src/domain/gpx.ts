import type { GpxPoint, GpxTrack } from './types';

const RESAMPLE_POINTS = 400;
const EARTH_RADIUS_KM = 6371;

/**
 * Cap on how many of the original points we keep for writing course files. A 300 km route at this
 * cap still has a point every ~100 m, which a head unit navigates without visibly cutting corners,
 * and the thinned track costs ~80 KB in localStorage — affordable next to everything else the
 * store persists. Files below the cap are kept whole, so ordinary rides lose nothing.
 */
const MAX_TRACK_POINTS = 3000;

interface RawPoint {
  lat: number;
  lon: number;
  ele: number;
}

export interface GpxParseResult {
  ele: number[];
  distanceKm: number;
  pts: GpxPoint[];
}

function extractPoints(xml: string, tag: 'trkpt' | 'rtept'): RawPoint[] {
  const points: RawPoint[] = [];
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)</${tag}>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const attrs = m[1];
    const body = m[2];
    const lat = parseFloat(attrs.match(/\blat="([-0-9.eE]+)"/)?.[1] ?? '');
    const lon = parseFloat(attrs.match(/\blon="([-0-9.eE]+)"/)?.[1] ?? '');
    const eleMatch = body.match(/<ele>([^<]*)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) || 0 : 0;
    if (Number.isFinite(lat) && Number.isFinite(lon)) points.push({ lat, lon, ele });
  }
  return points;
}

type LatLon = { lat: number; lon: number };

/** Great-circle distance in km. */
function haversineKm(a: LatLon, b: LatLon): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Distance from the start to each point, so `[0, …, total]` with one entry per point. */
export function cumulativeKm(pts: LatLon[]): number[] {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + haversineKm(pts[i - 1], pts[i]);
  return cum;
}

/**
 * Thins the track to at most `MAX_TRACK_POINTS` by keeping every nth original point, first and last
 * always among them. Evenly by index rather than by distance on purpose: index-even keeps the
 * original vertices, so a switchback recorded as three points close together survives as a corner,
 * where distance-even sampling would step over it and round the corner off.
 *
 * Coordinates are rounded to 5 decimals (~1 m) and elevation to 0.1 m — below what a bike GPS can
 * resolve, and it roughly halves what the thinned track costs in localStorage.
 */
function thinTrack(raw: RawPoint[]): GpxPoint[] {
  const step = Math.ceil(raw.length / MAX_TRACK_POINTS);
  const out: GpxPoint[] = [];
  for (let i = 0; i < raw.length; i += step) out.push(roundPoint(raw[i]));
  const last = raw[raw.length - 1];
  const kept = out[out.length - 1];
  if (kept.lat !== round5(last.lat) || kept.lon !== round5(last.lon)) out.push(roundPoint(last));
  return out;
}

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

const roundPoint = (p: RawPoint): GpxPoint => ({
  lat: round5(p.lat),
  lon: round5(p.lon),
  ele: Math.round(p.ele * 10) / 10,
});

export function parseGpxXml(xml: string): GpxParseResult {
  const track = extractPoints(xml, 'trkpt');
  const raw = track.length ? track : extractPoints(xml, 'rtept');
  if (raw.length < 8) throw new Error('too few points');

  const cum = cumulativeKm(raw);
  const total = cum[cum.length - 1];
  if (!(total > 1)) throw new Error('no distance');

  const ele: number[] = [];
  for (let i = 0; i <= RESAMPLE_POINTS; i++) {
    const target = (total * i) / RESAMPLE_POINTS;
    let j = 1;
    while (j < cum.length - 1 && cum[j] < target) j++;
    const t0 = cum[j - 1];
    const t1 = cum[j];
    const k = t1 > t0 ? (target - t0) / (t1 - t0) : 0;
    ele.push(raw[j - 1].ele + (raw[j].ele - raw[j - 1].ele) * k);
  }

  return { ele, distanceKm: total, pts: thinTrack(raw) };
}

const MAX_GPX_FILE_BYTES = 20 * 1024 * 1024;

export function loadGpxFile(
  file: File,
): Promise<{ track: GpxTrack; distanceKm: number; fileName: string }> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_GPX_FILE_BYTES) {
      reject(new Error('gpx file too large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { ele, distanceKm, pts } = parseGpxXml(String(reader.result));
        resolve({
          track: { id: Date.now(), ele, pts },
          distanceKm: Math.max(5, Math.round(distanceKm)),
          fileName: file.name,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error('gpx parse error'));
      }
    };
    reader.onerror = () => reject(new Error('gpx read error'));
    reader.readAsText(file);
  });
}
