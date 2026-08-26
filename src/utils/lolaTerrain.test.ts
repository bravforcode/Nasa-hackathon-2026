/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import {
  GriddedDemTerrain,
  latLonToPolarStereoM,
} from './lolaTerrain';

// Tiny fixture grid: 4x4 posts, 100 m posting, origin -150 m.
// DN == height (scale 1). Heights form a simple plane h = x + y (meters).
const N = 4;
const dn = new Int16Array(N * N);
for (let j = 0; j < N; j++) {
  for (let i = 0; i < N; i++) {
    const x = -150 + i * 100;
    const y = -150 + j * 100;
    dn[j * N + i] = (x + y) / 2; // scale=1 -> height = DN
  }
}
const meta = { n: N, postM: 100, originM: -150, scale: 1, minH: -300, maxH: 300, srcLabel: 'fixture' };
const b64 = (() => {
  const bytes = new Uint8Array(dn.buffer, dn.byteOffset, dn.byteLength);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
})();

describe('latLonToPolarStereoM', () => {
  test('south pole maps to origin', () => {
    const { xM, yM } = latLonToPolarStereoM(-90, 0);
    expect(Math.abs(xM)).toBeLessThan(1e-6);
    expect(Math.abs(yM)).toBeLessThan(1e-6);
  });

  test('colatitude sets radius: -85 deg => ~151.7 km from pole', () => {
    const { xM, yM } = latLonToPolarStereoM(-85, 0);
    const rho = Math.hypot(xM, yM);
    // rho = 2*R*tan(5 deg / 2) = 151,713 m on R = 1737.4 km
    expect(rho).toBeGreaterThan(150_000);
    expect(rho).toBeLessThan(153_000);
    expect(yM).toBeGreaterThan(0); // lon 0 -> +y (north axis of the grid)
  });
});

describe('GriddedDemTerrain', () => {
  test('recovers the fixture plane at post centers', () => {
    const t = new GriddedDemTerrain(meta, b64);
    // Post (i=2,j=1): x=-150+200=50? no -> x=-150+2*100=50 is wrong; x=-150+200=50... recompute:
    // i=2 => x = -150+200 = 50?? No: -150 + 2*100 = 50. Hmm that's outside a
    // -150..150 span only if N*post/2=150 -> max index 3 => x=150. i=2 => 50.
    // Plane value = (x+y)/2 = (50 + (-50))/2 = 0 for (i=2,j=1).
    const h = t.elevationAt(-90, 0); // exactly the pole -> gx=gy=1.5 center
    // Pole sits between posts; bilinear of plane is exact: (0+0)/2 = 0.
    expect(Math.abs(h)).toBeLessThan(0.5);
  });

  test('bilinear interpolates linearly off-post', () => {
    const t = new GriddedDemTerrain(meta, b64);
    // Stand ~50 m from the pole toward lon 90 (+x axis). Exact pole is a
    // projection singularity, so offset by colatitude ~50 m / R.
    const R_M = 1_737_400;
    const lat = -90 + (50 / R_M) * (180 / Math.PI);
    const h = t.elevationAt(lat, 90);
    // Plane along x at y~0: value = x/2 = 25 m.
    expect(h).toBeCloseTo(25, 3);
  });

  test('outside the window falls back to synthetic provider (finite number)', () => {
    const t = new GriddedDemTerrain(meta, b64);
    const h = t.elevationAt(-80, 0); // far north of the tiny fixture window
    expect(Number.isFinite(h)).toBe(true);
  });

  test('rejects truncated payloads', () => {
    expect(() => new GriddedDemTerrain(meta, b64.slice(0, 8))).toThrow();
  });
});
