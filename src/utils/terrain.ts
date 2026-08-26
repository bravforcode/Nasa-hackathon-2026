/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Terrain model + horizon ray-casting (roadmap item: "DEM ray-casting").
 *
 * HONEST SCOPE: the ray-marching algorithm below is real and unit-tested, but
 * it currently runs over a SYNTHETIC-CALIBRATED terrain model — deterministic
 * value noise plus two hand-placed features (a caldera depression and a ridge
 * highland), clamped to a declared band. It is NOT LOLA DEM data. Swapping in
 * real DEM is a matter of implementing another `TerrainProvider` (e.g., backed
 * by precomputed polar visibility grids); no call-site needs to change.
 */

import { localKmToLatLon } from './powerModel';

/** Anything that can answer "how high is the ground here, in meters". */
export interface TerrainProvider {
  elevationAt(latDeg: number, lonDeg: number): number;
}

// --- Deterministic value noise ---------------------------------------------

function hash2(ix: number, iy: number, seed: number): number {
  let h = ix * 374761393 + iy * 668265263 + seed * 1442695040888963407;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295; // [0,1)
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);
  const v00 = hash2(ix, iy, seed);
  const v10 = hash2(ix + 1, iy, seed);
  const v01 = hash2(ix, iy + 1, seed);
  const v11 = hash2(ix + 1, iy + 1, seed);
  return v00 + (v10 - v00) * fx + (v01 - v00) * fy + (v00 - v10 - v01 + v11) * fx * fy;
}

// --- Synthetic-calibrated south-polar terrain -------------------------------

/** Declared synthetic band (meters) — asserted by tests so drift is caught. */
export const TERRAIN_MIN_M = -2000;
export const TERRAIN_MAX_M = 3500;

const CALDERA = { lat: -89.9, lon: 0, depthM: -1500, sigmaKm: 8 };
const HIGHLAND = { lat: -88.8, lon: 20, heightM: 900, sigmaKm: 12 };
const KM_PER_DEG = Math.PI * 1737.4 / 180;

/**
 * Deterministic synthetic terrain for the south-polar operations area.
 * Two octaves of value noise (+/-700 m) with a caldera depression and a
 * highland dome superimposed. Fully deterministic across sessions.
 */
export class SyntheticPolarTerrain implements TerrainProvider {
  private readonly seed: number;

  constructor(seed = 0x5eed) {
    this.seed = seed >>> 0;
  }

  elevationAt(latDeg: number, lonDeg: number): number {
    // Two octaves of noise on a ~4 km / ~12 km grid. Amplitude reflects
    // SITE-ADJUSTED roughness: relay masts are surveyed onto locally clear
    // spots, so we model half of the raw regional relief.
    const x = latDeg * (KM_PER_DEG / 4);
    const y = lonDeg * (KM_PER_DEG / 4) * Math.max(Math.cos(latDeg * Math.PI / 180), 1e-6);
    let h =
      (valueNoise(x, y, this.seed) - 0.5) * 2 * 225 +
      (valueNoise(x / 3, y / 3, this.seed + 7) - 0.5) * 2 * 125;

    // Gaussian features via local-plane km offsets from each feature center.
    const gauss = (fl: { lat: number; lon: number }, sigmaKm: number): number => {
      const dLatKm = (latDeg - fl.lat) * KM_PER_DEG;
      const dLonKm =
        (((lonDeg - fl.lon + 540) % 360) - 180) *
        KM_PER_DEG *
        Math.max(Math.cos(fl.lat * Math.PI / 180), 1e-6);
      return Math.exp(-(dLatKm * dLatKm + dLonKm * dLonKm) / (2 * sigmaKm * sigmaKm));
    };

    h += CALDERA.depthM * gauss(CALDERA, CALDERA.sigmaKm);
    h += HIGHLAND.heightM * gauss(HIGHLAND, HIGHLAND.sigmaKm);

    return Math.max(TERRAIN_MIN_M, Math.min(TERRAIN_MAX_M, h));
  }
}

// --- Horizon ray-marching ---------------------------------------------------

export interface HorizonProfile {
  /** Highest terrain angle above the observer's local plane, degrees. */
  maxHorizonDeg: number;
  /** Fraction of sampled azimuths whose horizon exceeds BLOCK_ANGLE_DEG. */
  blockedFraction: number;
}

const BLOCK_ANGLE_DEG = 2;
const RAD2DEG = 180 / Math.PI;

/**
 * Ray-march the horizon around an observer. For `azimuths` rays we step
 * outward to `maxDistKm`, sample terrain, and track the max elevation angle
 * atan((h - h_obs) / groundDistance). This is the classic horizon sweep used
 * by solar-array / comms siting tools; swap the TerrainProvider for real DEM
 * data without touching this function.
 */
export function horizonProfile(
  terrain: TerrainProvider,
  latDeg: number,
  lonDeg: number,
  opts?: { azimuths?: number; maxDistKm?: number; stepKm?: number; mastHeightM?: number }
): HorizonProfile {
  const azimuths = opts?.azimuths ?? 16;
  const maxDistKm = opts?.maxDistKm ?? 30;
  const stepKm = opts?.stepKm ?? 0.75;
  const mastHeightM = opts?.mastHeightM ?? 12;

  // Observer plane = ground + mast height (relay masts are 12 m per
  // RECOVERY_ASSUMPTIONS); distant samples stay at ground level.
  const h0 = terrain.elevationAt(latDeg, lonDeg) + mastHeightM;
  let maxHorizonDeg = 0;
  let blockedCount = 0;

  for (let a = 0; a < azimuths; a++) {
    const az = (a / azimuths) * 2 * Math.PI;
    const dx = Math.sin(az);
    const dy = Math.cos(az);
    let best = 0;
    for (let d = stepKm; d <= maxDistKm; d += stepKm) {
      const { lat, lon } = localKmToLatLon(dx * d, dy * d, latDeg, lonDeg);
      const h = terrain.elevationAt(lat, lon);
      const angleDeg = Math.atan2(h - h0, d * 1000) * RAD2DEG;
      if (angleDeg > best) best = angleDeg;
    }
    if (best > maxHorizonDeg) maxHorizonDeg = best;
    if (best > BLOCK_ANGLE_DEG) blockedCount++;
  }

  return {
    maxHorizonDeg: Math.round(maxHorizonDeg * 10) / 10,
    blockedFraction: Math.round((blockedCount / azimuths) * 100) / 100,
  };
}

/** Floor for the LOS range multiplier — even bad sites keep some utility. */
export const MIN_LOS_FACTOR = 0.55;

/**
 * First-order mapping from a site's horizon profile to an effective fraction
 * of its nominal comm range (documented approximation pending real DEM):
 *   factor = clamp(1 - 0.06*maxHorizonDeg - 0.2*blockedFraction, 0.55, 1)
 */
export function losFactor(p: HorizonProfile): number {
  const raw = 1 - 0.06 * p.maxHorizonDeg - 0.2 * p.blockedFraction;
  return Math.max(MIN_LOS_FACTOR, Math.min(1, Math.round(raw * 100) / 100));
}
