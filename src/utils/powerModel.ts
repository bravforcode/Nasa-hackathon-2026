/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Pure physics & geometry helpers for the Lunar Relay OS solver.
 *
 * Every function here is deterministic and side-effect free so it can be
 * unit-tested in isolation and reused across solver strategies. All physical
 * constants are exported with JSDoc stating their source / assumption.
 */

/** Mean lunar radius in km. Source: NASA Moon Fact Sheet (mean radius 1737.4 km). */
export const MOON_RADIUS_KM = 1737.4;

/**
 * Mean solar irradiance at 1 AU in W/m^2.
 * Source: standard AM0 solar constant, ~1361 W/m^2 (Kopp & Lean 2011).
 */
export const SOLAR_CONSTANT_W_M2 = 1361;

/** Assumed rover-class solar array area in m^2 (VIPER-class single-panel estimate). */
export const DEFAULT_PANEL_AREA_M2 = 2.0;

/**
 * Assumed solar cell efficiency (triple-junction III-V space cells reach ~30%
 * beginning-of-life efficiency).
 */
export const DEFAULT_PANEL_EFFICIENCY = 0.3;

/** Default mast-relay line-of-sight comm range in km (12 m ridge-mast LOS assumption). */
export const DEFAULT_RELAY_COMM_RANGE_KM = 40;

/** Deterministic PRNG seed for coverage Monte Carlo (hex pun: 0xA11CE "Alice"). */
export const COVERAGE_PRNG_SEED = 0xa11ce;

/** Default Monte Carlo sample count for constellation coverage estimation. */
export const DEFAULT_COVERAGE_SAMPLES = 5000;

/** A relay node as seen by the coverage model (subset of RelayNode fields). */
export interface CoverageRelay {
  id: string;
  lat: number;
  lon: number;
  status: string;
  commRangeKm?: number;
}

/** A circular surface region where communications are unavailable. */
export interface CoverageDeadZone {
  id: string;
  lat: number;
  lon: number;
  radiusKm: number;
}

/** Minimal shape of a DONKI flare class entry used for severity mapping. */
export interface FlareLike {
  classType?: string;
}

/** Space-weather severity level derived from DONKI flare classes. */
export type SepSeverityLevel = 'low' | 'moderate' | 'elevated' | 'severe';

/** Severity multiplier applied by the solver for a severe (X-class) environment. */
export const SEP_SEVERE_MULTIPLIER = 1.6;

/** Severity multiplier applied by the solver for an elevated (M-class) environment. */
export const SEP_ELEVATED_MULTIPLIER = 1.35;

/** Severity multiplier applied by the solver for a moderate (>=5 C-class) environment. */
export const SEP_MODERATE_MULTIPLIER = 1.15;

/** Severity multiplier applied by the solver for a quiet space-weather environment. */
export const SEP_LOW_MULTIPLIER = 1.0;

/** Number of C-class flares required to escalate severity to 'moderate'. */
export const MODERATE_C_CLASS_THRESHOLD = 5;

const DEG_TO_RAD = Math.PI / 180;

/**
 * Cosine of the solar incidence angle (degrees from the panel normal),
 * clamped to [0, 1]. Negative angles (night / slope self-shadow) yield 0,
 * and angles beyond 90 deg clamp to 0 via the cosine sign.
 */
export function solarIncidenceFactor(incidenceDeg: number): number {
  if (incidenceDeg < 0) return 0; // sun below the local horizon plane
  if (incidenceDeg >= 90) return 0; // grazing or behind plane (exact 0, avoids fp dust)
  const c = Math.cos(incidenceDeg * DEG_TO_RAD);
  return c <= 0 ? 0 : Math.min(1, c);
}

/**
 * Instantaneous solar array output in watts.
 *
 * P = S0 * illuminationFraction * cos(incidence) * area * efficiency
 *
 * @param illuminationFraction Fraction of full illumination in [0, 1]
 *   (e.g. region `illuminationAvg` percent divided by 100).
 * @param incidenceDeg Solar incidence angle from panel normal, degrees.
 */
export function solarPowerW(
  illuminationFraction: number,
  incidenceDeg: number,
  panelAreaM2: number = DEFAULT_PANEL_AREA_M2,
  panelEfficiency: number = DEFAULT_PANEL_EFFICIENCY
): number {
  const fraction = Math.max(0, Math.min(1, illuminationFraction));
  return SOLAR_CONSTANT_W_M2 * fraction * solarIncidenceFactor(incidenceDeg) * panelAreaM2 * panelEfficiency;
}

/**
 * Battery energy margin over a mission window, as % of capacity.
 *
 * generated Wh = solarPowerW(...) * durationHours (illuminationFraction already
 *   scales output)
 * consumed Wh = loadW * durationHours
 * margin% = (generated - consumed) / batteryCapacityWh * 100
 *
 * Negative results indicate an energy deficit over the window.
 */
export function batteryMarginPercent(p: {
  illuminationFraction: number;
  incidenceDeg?: number;
  panelAreaM2?: number;
  panelEfficiency?: number;
  loadW: number;
  batteryCapacityWh: number;
  durationHours: number;
}): number {
  const generatedWh =
    solarPowerW(
      p.illuminationFraction,
      p.incidenceDeg ?? 0,
      p.panelAreaM2 ?? DEFAULT_PANEL_AREA_M2,
      p.panelEfficiency ?? DEFAULT_PANEL_EFFICIENCY
    ) * p.durationHours;
  const consumedWh = p.loadW * p.durationHours;
  if (p.batteryCapacityWh === 0) return 0;
  return ((generatedWh - consumedWh) / p.batteryCapacityWh) * 100;
}

/**
 * Great-circle distance between two points on the lunar sphere, in km
 * (haversine formula on MOON_RADIUS_KM).
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * DEG_TO_RAD;
  const dLon = (lon2 - lon1) * DEG_TO_RAD;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const a =
    sinLat * sinLat + Math.cos(lat1 * DEG_TO_RAD) * Math.cos(lat2 * DEG_TO_RAD) * sinLon * sinLon;
  return 2 * MOON_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Mulberry32 PRNG — tiny, fast, fully deterministic for a given integer seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Constellation coverage % of a circular surface region.
 *
 * Model:
 * - Each relay with status 'active' covers a spherical cap of angular radius
 *   commRangeKm / MOON_RADIUS_KM (falls back to DEFAULT_RELAY_COMM_RANGE_KM).
 * - Dead zones carve out caps of their own radiusKm.
 * - Coverage = (samples inside >= 1 relay cap AND outside all dead-zone caps)
 *   / accepted samples * 100.
 *
 * Implementation: deterministic Monte Carlo using mulberry32 seeded with
 * COVERAGE_PRNG_SEED (0xA11CE). Candidate points are drawn uniformly in the
 * region's lat/lon bounding box and filtered to within regionRadiusKm
 * great-circle distance of the region center. Result clamped to [0, 100] and
 * rounded to 1 decimal place.
 */
export function constellationCoveragePercent(
  relays: CoverageRelay[],
  deadZones: CoverageDeadZone[],
  opts: { regionLat: number; regionLon: number; regionRadiusKm: number; sampleCount?: number }
): number {
  const { regionLat, regionLon, regionRadiusKm } = opts;
  const sampleCount = opts.sampleCount ?? DEFAULT_COVERAGE_SAMPLES;
  if (!(sampleCount > 0) || !(regionRadiusKm > 0)) return 0;

  const activeRelays = relays.filter((r) => r.status === 'active');
  const rand = mulberry32(COVERAGE_PRNG_SEED);

  // Bounding box around the region center that contains the circular region.
  const dLatDeg = regionRadiusKm / MOON_RADIUS_KM / DEG_TO_RAD;
  // Guard against division by ~0 at the poles (region collapses to a point there).
  const cosLat = Math.max(Math.cos(regionLat * DEG_TO_RAD), 1e-6);
  const dLonDeg = dLatDeg / cosLat;
  const minLat = Math.max(-90, regionLat - dLatDeg);
  const maxLat = Math.min(90, regionLat + dLatDeg);
  const minLon = regionLon - dLonDeg;
  const maxLon = regionLon + dLonDeg;

  // Bounded attempts guarantee termination even for polar regions where most
  // bbox candidates fall outside the circle.
  const maxAttempts = sampleCount * 50;
  let accepted = 0;
  let covered = 0;

  for (let attempt = 0; attempt < maxAttempts && accepted < sampleCount; attempt++) {
    const lat = minLat + rand() * (maxLat - minLat);
    const lon = minLon + rand() * (maxLon - minLon);
    if (haversineDistanceKm(regionLat, regionLon, lat, lon) > regionRadiusKm) continue;
    accepted++;

    const inRelayCap = activeRelays.some(
      (r) => haversineDistanceKm(lat, lon, r.lat, r.lon) <= (r.commRangeKm ?? DEFAULT_RELAY_COMM_RANGE_KM)
    );
    if (!inRelayCap) continue;

    const inDeadZone = deadZones.some(
      (dz) => haversineDistanceKm(lat, lon, dz.lat, dz.lon) <= dz.radiusKm
    );
    if (inDeadZone) continue;

    covered++;
  }

  if (accepted === 0) return 0;
  const pct = (covered / accepted) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)) * 10) / 10;
}

/**
 * Map a DONKI flare list to space-weather severity for the solver. Pure.
 *
 * Rules (first match wins):
 * - any X-class flare            => 'severe'   (SEP_SEVERE_MULTIPLIER)
 * - else any M-class flare       => 'elevated' (SEP_ELEVATED_MULTIPLIER)
 * - else >= MODERATE_C_CLASS_THRESHOLD C-class flares => 'moderate' (SEP_MODERATE_MULTIPLIER)
 * - otherwise                    => 'low'      (SEP_LOW_MULTIPLIER)
 *
 * Malformed classType entries (missing/unknown prefix letter or magnitude)
 * are ignored.
 */
export function sepSeverityFromFlares(flares: FlareLike[]): {
  level: SepSeverityLevel;
  multiplier: number;
} {
  const FLARE_CLASS_RE = /^([ABCMX])(\d+(?:\.\d+)?)$/i;
  let cClassCount = 0;

  for (const flare of flares) {
    const match = typeof flare?.classType === 'string' ? flare.classType.trim().match(FLARE_CLASS_RE) : null;
    if (!match) continue;
    const prefix = match[1].toUpperCase();
    if (prefix === 'X') return { level: 'severe', multiplier: SEP_SEVERE_MULTIPLIER };
    if (prefix === 'M') return { level: 'elevated', multiplier: SEP_ELEVATED_MULTIPLIER };
    if (prefix === 'C') cClassCount++;
  }

  if (cClassCount >= MODERATE_C_CLASS_THRESHOLD) {
    return { level: 'moderate', multiplier: SEP_MODERATE_MULTIPLIER };
  }
  return { level: 'low', multiplier: SEP_LOW_MULTIPLIER };
}

/**
 * A circle in the local tangent plane, expressed in km offsets from a region
 * anchor (+x = east, +y = north). Used for coverage math near the lunar poles
 * where lat/lon spherical caps degenerate (cos(lat) -> 0).
 */
export interface PlanarCircle {
  id: string;
  xKm: number;
  yKm: number;
  radiusKm: number;
}

/**
 * Convert lat/lon to local tangent-plane km offsets from an anchor point
 * (equirectangular / local ENU approximation).
 *
 * Valid for patches of roughly <=100 km. Near the poles the x-axis is scaled
 * by cos(anchorLat), which is the correct first-order local approximation.
 */
export function latLonToLocalKm(
  lat: number,
  lon: number,
  anchorLat: number,
  anchorLon: number
): { xKm: number; yKm: number } {
  const KM_PER_DEG_LAT = Math.PI * MOON_RADIUS_KM / 180; // ~30.32 km/deg on the Moon
  const dLat = lat - anchorLat;
  let dLon = lon - anchorLon;
  // Wrap longitude to [-180, 180].
  while (dLon > 180) dLon -= 360;
  while (dLon < -180) dLon += 360;
  const xKm = dLon * KM_PER_DEG_LAT * Math.max(Math.cos(anchorLat * DEG_TO_RAD), 1e-6);
  const yKm = dLat * KM_PER_DEG_LAT;
  return { xKm, yKm };
}

/**
 * Planar constellation coverage % — identical contract and Monte Carlo method
 * as `constellationCoveragePercent`, but computed in the local tangent plane
 * (km) instead of lat/lon space.
 *
 * Use this variant when inputs come from map-percentage coordinates or when
 * the region sits at extreme latitude where spherical-cap sampling degenerates.
 *
 * - `coverCircles`: relay footprints (active relays only — caller filters).
 * - `holeCircles`: dead zones that block surface line-of-sight.
 * - Coverage = fraction of samples inside >= 1 cover circle AND outside all
 *   hole circles, over samples inside the region disk.
 * Deterministic via mulberry32(COVERAGE_PRNG_SEED); result clamped [0,100],
 * rounded to 0.1.
 */
export function coveragePercentPlanar(
  coverCircles: PlanarCircle[],
  holeCircles: PlanarCircle[],
  regionRadiusKm: number,
  sampleCount?: number
): number {
  const count = sampleCount ?? DEFAULT_COVERAGE_SAMPLES;
  if (!(count > 0) || !(regionRadiusKm > 0)) return 0;

  const rand = mulberry32(COVERAGE_PRNG_SEED);
  const maxAttempts = count * 50;
  let accepted = 0;
  let covered = 0;

  for (let attempt = 0; attempt < maxAttempts && accepted < count; attempt++) {
    const x = (rand() * 2 - 1) * regionRadiusKm;
    const y = (rand() * 2 - 1) * regionRadiusKm;
    if (x * x + y * y > regionRadiusKm * regionRadiusKm) continue;
    accepted++;

    const inCover = coverCircles.some((c) => {
      const dx = x - c.xKm;
      const dy = y - c.yKm;
      return dx * dx + dy * dy <= c.radiusKm * c.radiusKm;
    });
    if (!inCover) continue;

    const inHole = holeCircles.some((h) => {
      const dx = x - h.xKm;
      const dy = y - h.yKm;
      return dx * dx + dy * dy < h.radiusKm * h.radiusKm;
    });
    if (inHole) continue;

    covered++;
  }

  if (accepted === 0) return 0;
  const pct = (covered / accepted) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)) * 10) / 10;
}

/** Kilometers per degree of lunar latitude (meridian arc). */
export const KM_PER_DEG_LAT_MOON = (Math.PI * MOON_RADIUS_KM) / 180; // ~30.32 km

/**
 * Free-space path loss in dB (standard engineering formula).
 * FSPL(dB) = 20*log10(d_km) + 20*log10(f_MHz) + 32.44
 */
export function fsplDb(distKm: number, freqMHz: number): number {
  if (!(distKm > 0) || !(freqMHz > 0)) return Infinity;
  return 20 * Math.log10(distKm) + 20 * Math.log10(freqMHz) + 32.44;
}

/**
 * Received signal power in dBm over a free-space link.
 * Prx = Ptx + Gtx + Grx - FSPL  (omni antennas, no atmospheric loss on the Moon).
 */
export function receivedPowerDbm(
  distKm: number,
  freqMHz: number,
  txPowerDbm: number,
  txGainDbi: number,
  rxGainDbi: number
): number {
  const fspl = fsplDb(distKm, freqMHz);
  if (!Number.isFinite(fspl)) return -Infinity;
  return txPowerDbm + txGainDbi + rxGainDbi - fspl;
}

/**
 * Inverse of `latLonToLocalKm`: convert local tangent-plane km offsets back to
 * lat/lon relative to an anchor point. Used by map drag interactions.
 */
export function localKmToLatLon(
  xKm: number,
  yKm: number,
  anchorLat: number,
  anchorLon: number
): { lat: number; lon: number } {
  const dLat = yKm / KM_PER_DEG_LAT_MOON;
  const cosLat = Math.max(Math.cos(anchorLat * DEG_TO_RAD), 1e-6);
  let dLon = xKm / (KM_PER_DEG_LAT_MOON * cosLat);
  let lon = anchorLon + dLon;
  // Wrap to [-180, 180].
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return { lat: anchorLat + dLat, lon };
}
