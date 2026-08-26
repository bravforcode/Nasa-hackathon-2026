/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Real-DEM TerrainProvider: bilinear sampling over the build-time LOLA grid
 * (src/data/demGrid.generated.ts). Outside the embedded window it falls back
 * to the synthetic-calibrated provider — documented hybrid, so regions at
 * latitudes north of the DEM coverage still return plausible values.
 */

import { SyntheticPolarTerrain, type TerrainProvider } from './terrain';

export interface DemGridMeta {
  n: number;
  postM: number;
  originM: number;
  scale: number;
  minH: number;
  maxH: number;
  srcLabel: string;
}

const R_M = 1_737_400;
const DEG2RAD = Math.PI / 180;

function worldToGridPx(xM: number, yM: number, postM: number, originM: number): { gx: number; gy: number } {
  return { gx: (xM - originM) / postM, gy: (yM - originM) / postM };
}

/** lat/lon (deg, south-polar) -> local polar-stereographic meters from pole. */
export function latLonToPolarStereoM(latDeg: number, lonDeg: number): { xM: number; yM: number } {
  const colatDeg = 90 + latDeg; // 0 at the south pole
  const rho = 2 * R_M * Math.tan((colatDeg / 2) * DEG2RAD);
  const lam = lonDeg * DEG2RAD;
  return { xM: rho * Math.sin(lam), yM: rho * Math.cos(lam) };
}

function decodeBase64ToInt16(b64: string): Int16Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const out = new Int16Array(bytes.buffer);
  if (bytes.byteOffset % 2 !== 0) {
    // Unaligned buffer safety: copy into an aligned view.
    const aligned = new Int16Array(bytes.length >> 1);
    const dv = new DataView(bytes.buffer);
    for (let i = 0; i < aligned.length; i++) aligned[i] = dv.getInt16(i * 2, true);
    return aligned;
  }
  if (out.length * 2 !== bytes.length) {
    return out.subarray(0, bytes.length >> 1);
  }
  return out;
}

export class GriddedDemTerrain implements TerrainProvider {
  readonly meta: DemGridMeta;
  private dn: Int16Array;
  private fallback = new SyntheticPolarTerrain();

  constructor(meta: DemGridMeta, dnBase64: string) {
    this.meta = meta;
    this.dn = decodeBase64ToInt16(dnBase64);
    if (this.dn.length < meta.n * meta.n) {
      throw new Error(`DEM grid too small: ${this.dn.length} < ${meta.n * meta.n}`);
    }
  }

  elevationAt(latDeg: number, lonDeg: number): number {
    const { xM, yM } = latLonToPolarStereoM(latDeg, lonDeg);
    const { gx, gy } = worldToGridPx(xM, yM, this.meta.postM, this.meta.originM);

    if (gx < 0 || gy < 0 || gx > this.meta.n - 1 || gy > this.meta.n - 1) {
      // Outside the embedded window -> documented synthetic fallback.
      return this.fallback.elevationAt(latDeg, lonDeg);
    }

    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const x1 = Math.min(x0 + 1, this.meta.n - 1);
    const y1 = Math.min(y0 + 1, this.meta.n - 1);
    const tx = gx - x0;
    const ty = gy - y0;

    const n = this.meta.n;
    const d00 = this.dn[y0 * n + x0];
    const d10 = this.dn[y0 * n + x1];
    const d01 = this.dn[y1 * n + x0];
    const d11 = this.dn[y1 * n + x1];

    const top = d00 + (d10 - d00) * tx;
    const bot = d01 + (d11 - d01) * tx;
    const dnValue = top + (bot - top) * ty;
    return dnValue * this.meta.scale;
  }
}
