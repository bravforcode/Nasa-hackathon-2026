/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import {
  SyntheticPolarTerrain,
  horizonProfile,
  losFactor,
  MIN_LOS_FACTOR,
} from './terrain';

describe('SyntheticPolarTerrain', () => {
  test('deterministic: same query => same elevation', () => {
    const t = new SyntheticPolarTerrain();
    const a = t.elevationAt(-89.42, 14.12);
    const b = t.elevationAt(-89.42, 14.12);
    expect(a).toBe(b);
  });

  test('elevations stay within the declared synthetic band [-2000 m, +3500 m]', () => {
    const t = new SyntheticPolarTerrain();
    for (let i = 0; i < 200; i++) {
      const lat = -90 + (i * 0.04);
      const lon = -180 + i * 1.8;
      const h = t.elevationAt(lat, lon);
      expect(h).toBeGreaterThanOrEqual(-2000);
      expect(h).toBeLessThanOrEqual(3500);
    }
  });

  test('crater depression lowers elevation near the caldera center', () => {
    const t = new SyntheticPolarTerrain();
    const inside = t.elevationAt(-89.9, 0); // caldera center
    const far = t.elevationAt(-88.5, 60);   // far away
    expect(inside).toBeLessThan(far);
  });
});

describe('horizonProfile (ray-marched horizon)', () => {
  test('flat terrain yields ~0 deg horizon in every azimuth', () => {
    const flat = { elevationAt: () => 0 };
    const p = horizonProfile(flat, -89.4, 14.0);
    expect(p.maxHorizonDeg).toBeCloseTo(0, 1);
    expect(p.blockedFraction).toBe(0);
  });

  test('a tall ridge east of the observer raises the eastern horizon', () => {
    // Ridge wall occupying 0.5–2.5 km due east. At lat -89.4 the local
    // east-west scale is cos(89.4 deg)*30.32 = 0.3175 km per degree of lon.
    const KM_PER_DEG_LON = 0.3175;
    const ridge = {
      elevationAt: (lat: number, lon: number) => {
        void lat;
        const dxKm = (lon - 14.0) * KM_PER_DEG_LON;
        return dxKm > 0.5 && dxKm < 2.5 ? 2500 : 0;
      },
    };
    const p = horizonProfile(ridge, -89.4, 14.0, { azimuths: 36 });
    expect(p.maxHorizonDeg).toBeGreaterThan(10);
    expect(p.blockedFraction).toBeGreaterThan(0);
    expect(p.blockedFraction).toBeLessThan(0.5); // only some azimuths blocked
  });
});

describe('losFactor', () => {
  test('flat horizon => full range (factor 1)', () => {
    expect(losFactor({ maxHorizonDeg: 0, blockedFraction: 0 })).toBe(1);
  });

  test('degrades with horizon angle and clamps at MIN_LOS_FACTOR', () => {
    const mid = losFactor({ maxHorizonDeg: 5, blockedFraction: 0.2 });
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(MIN_LOS_FACTOR);
    const extreme = losFactor({ maxHorizonDeg: 40, blockedFraction: 0.9 });
    expect(extreme).toBe(MIN_LOS_FACTOR);
  });
});
