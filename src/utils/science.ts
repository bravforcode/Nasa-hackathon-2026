/**
 * Pure science-yield scoring for a rover corridor.
 *
 * Scores how much science value a rover traverse (rover pos -> base pos)
 * captures: sites within `corridorKm` of the straight-line path contribute
 * value scaled by priority, mission status, and whether they sit inside an
 * active surface-relay's coverage circle (real-time downlink) or not
 * (record-and-forward penalty).
 */
import { latLonToLocalKm } from './powerModel';
import { relayLosFactorCached } from './terrainRuntime';
import type { ScienceSite, RelayNode, LunarRegion } from '../types';

/** Multiplier by site priority. */
const PRIORITY_WEIGHTS: Record<ScienceSite['priority'], number> = {
  High: 1,
  Medium: 0.7,
  Low: 0.4,
};

/** Multiplier by mission status — at-risk sites are discounted, aborted count for nothing. */
const STATUS_FACTORS: Record<ScienceSite['status'], number> = {
  pending: 1,
  active: 1.1,
  at_risk: 0.8,
  completed: 0.25,
  aborted: 0,
};

/** Comm factor when a site is OUTSIDE every cover circle (store-and-forward relay). */
const RECORD_AND_FORWARD_FACTOR = 0.5;

/** Score normalizer: total value equal to TWO fully-yielded sites => score 10. */
const FULL_YIELD_SITES = 2.0;

/** Euclidean distance from point P to segment AB; degenerate AB falls back to |PA|. */
function pointToSegmentDistanceKm(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) {
    const dx = px - ax;
    const dy = py - ay;
    return Math.hypot(dx, dy);
  }
  let t = ((px - ax) * abx + (py - ay) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

export function computeScienceYield(
  sites: ScienceSite[],
  relays: RelayNode[],
  roverPos: { lat: number; lon: number },
  basePos: { lat: number; lon: number },
  _region: Pick<LunarRegion, 'centerLat' | 'centerLon'>,
  corridorKm: number
): number {
  // 1. Anchor = midpoint of rover/base so both endpoints project with minimal distortion.
  const anchorLat = (roverPos.lat + basePos.lat) / 2;
  const anchorLon = (roverPos.lon + basePos.lon) / 2;

  // 2. Project all points onto the local km plane around the anchor.
  const roverKm = latLonToLocalKm(roverPos.lat, roverPos.lon, anchorLat, anchorLon);
  const baseKm = latLonToLocalKm(basePos.lat, basePos.lon, anchorLat, anchorLon);

  // 3. Active surface relays only; effective radius shrinks by terrain LOS factor.
  const covers = relays
    .filter(r => r.status === 'active' && r.type !== 'orbital_lunanet')
    .map(r => ({
      xKm: latLonToLocalKm(r.lat, r.lon, anchorLat, anchorLon).xKm,
      yKm: latLonToLocalKm(r.lat, r.lon, anchorLat, anchorLon).yKm,
      radiusKm: r.coverageRadiusKm * relayLosFactorCached(r.id, r.lat, r.lon),
    }));

  let total = 0;
  for (const site of sites) {
    // 4. Skip sites off-corridor (distance to the rover->base SEGMENT).
    const p = latLonToLocalKm(site.lat, site.lon, anchorLat, anchorLon);
    const corridorDist = pointToSegmentDistanceKm(
      p.xKm,
      p.yKm,
      roverKm.xKm,
      roverKm.yKm,
      baseKm.xKm,
      baseKm.yKm
    );
    if (corridorDist > corridorKm) continue;

    // 5. Value = yield * priority * status * comm(real-time vs record-and-forward).
    const inCoverage = covers.some(
      c => Math.hypot(p.xKm - c.xKm, p.yKm - c.yKm) <= c.radiusKm
    );
    const commFactor = inCoverage ? 1 : RECORD_AND_FORWARD_FACTOR;
    total +=
      (site.scienceYieldPercent / 100) *
      PRIORITY_WEIGHTS[site.priority] *
      STATUS_FACTORS[site.status] *
      commFactor;
  }

  // 6. Normalize: two fully-yielded sites saturate the score at 10.
  return Math.round(Math.min(1, total / FULL_YIELD_SITES) * 10);
}
