/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// bun:test ships no type declarations in this repo (no bun-types dependency);
// suppress the module-resolution error for tsc while bun resolves it natively.
import { describe, expect, test } from 'bun:test';

import {
  COVERAGE_PRNG_SEED,
  DEFAULT_PANEL_AREA_M2,
  DEFAULT_PANEL_EFFICIENCY,
  DEFAULT_RELAY_COMM_RANGE_KM,
  MOON_RADIUS_KM,
  SOLAR_CONSTANT_W_M2,
  batteryMarginPercent,
  constellationCoveragePercent,
  coveragePercentPlanar,
  fsplDb,
  haversineDistanceKm,
  latLonToLocalKm,
  localKmToLatLon,
  receivedPowerDbm,
  sepSeverityFromFlares,
  solarIncidenceFactor,
  solarPowerW,
  type CoverageDeadZone,
  type CoverageRelay,
  type PlanarCircle,
} from './powerModel';

describe('constants', () => {
  test('expose documented physical values', () => {
    expect(MOON_RADIUS_KM).toBe(1737.4);
    expect(SOLAR_CONSTANT_W_M2).toBe(1361);
    expect(DEFAULT_PANEL_AREA_M2).toBe(2.0);
    expect(DEFAULT_PANEL_EFFICIENCY).toBe(0.3);
    expect(DEFAULT_RELAY_COMM_RANGE_KM).toBe(40);
    expect(COVERAGE_PRNG_SEED).toBe(0xa11ce);
  });
});

describe('solarIncidenceFactor', () => {
  test('0 deg => 1 (sun at panel normal)', () => {
    expect(solarIncidenceFactor(0)).toBe(1);
  });

  test('90 deg => 0 (grazing)', () => {
    expect(solarIncidenceFactor(90)).toBe(0);
  });

  test('120 deg => 0 (sun behind plane clamps to 0)', () => {
    expect(solarIncidenceFactor(120)).toBe(0);
  });

  test('45 deg => cos(45 deg) ~= 0.7071', () => {
    expect(solarIncidenceFactor(45)).toBeCloseTo(0.70710678, 4);
  });

  test('negative angle (night / self-shadow) => 0', () => {
    expect(solarIncidenceFactor(-15)).toBe(0);
  });
});

describe('solarPowerW', () => {
  test('zero illumination => 0 W regardless of incidence', () => {
    expect(solarPowerW(0, 0)).toBe(0);
    expect(solarPowerW(0, 45)).toBe(0);
  });

  test(
    'hand-computed: 1361 * 0.8 * cos(60 deg)=0.5 * 2.0 m^2 * 0.30 = 326.64 W',
    () => {
      // 1361 * 0.8 = 1088.8; * 0.5 = 544.4; * 2.0 = 1088.8; * 0.30 = 326.64
      expect(solarPowerW(0.8, 60, 2.0, 0.3)).toBeCloseTo(326.64, 2);
    }
  );

  test('defaults to documented panel area & efficiency', () => {
    // 1361 * 1 * 1 * 2.0 * 0.30 = 816.6 W
    expect(solarPowerW(1, 0)).toBeCloseTo(816.6, 6);
  });

  test('night-side incidence yields 0 W', () => {
    expect(solarPowerW(1, 95)).toBe(0);
  });
});

describe('batteryMarginPercent', () => {
  test('positive margin case', () => {
    // gen: solarPowerW(1, 0) = 1361 * 1 * 1 * 2.0 m^2 * 0.30 = 816.6 W over 2 h = 1633.2 Wh
    // consumed: 100 W * 2 h = 200 Wh; margin = (1633.2 - 200) / 600 * 100 = 238.866..%
    const margin = batteryMarginPercent({
      illuminationFraction: 1,
      incidenceDeg: 0,
      loadW: 100,
      batteryCapacityWh: 600,
      durationHours: 2,
    });
    expect(margin).toBeCloseTo(238.87, 1);
    expect(margin).toBeGreaterThan(0);
  });

  test('deficit case is negative', () => {
    // zero illumination => generated 0 Wh; consumed 150 W * 4 h = 600 Wh
    // margin = (0 - 600) / 300 * 100 = -200%
    const margin = batteryMarginPercent({
      illuminationFraction: 0,
      loadW: 150,
      batteryCapacityWh: 300,
      durationHours: 4,
    });
    expect(margin).toBe(-200);
  });
});

describe('haversineDistanceKm', () => {
  test('zero distance to self', () => {
    expect(haversineDistanceKm(10, 20, 10, 20)).toBe(0);
  });

  test('quarter circumference along a meridian', () => {
    // 90 deg of latitude arc = (pi/2) * R
    const expected = (Math.PI / 2) * MOON_RADIUS_KM;
    expect(haversineDistanceKm(0, 0, 90, 0)).toBeCloseTo(expected, 6);
  });
});

describe('constellationCoveragePercent', () => {
  const REGION = { regionLat: 0, regionLon: 0, regionRadiusKm: 50 };

  const centerRelayHugeRange: CoverageRelay = {
    id: 'r-center',
    lat: 0,
    lon: 0,
    status: 'active',
    commRangeKm: 1_000_000,
  };

  test('(a) active relay at region center with huge range => 100%', () => {
    expect(constellationCoveragePercent([centerRelayHugeRange], [], REGION)).toBe(100);
  });

  test('(a2) same relay + central dead zone carves coverage below 100%', () => {
    const dz: CoverageDeadZone = { id: 'dz', lat: 0, lon: 0, radiusKm: 15 };
    const coverage = constellationCoveragePercent([centerRelayHugeRange], [dz], REGION);
    // Inner cap of 15 km inside a 50 km region removes ~(15/50)^2 = 9% of area.
    expect(coverage).toBeLessThan(100);
    expect(coverage).toBeGreaterThan(80);
  });

  test('(b) no relays => 0%', () => {
    expect(constellationCoveragePercent([], [], REGION)).toBe(0);
  });

  test('(b2) offline relays do not contribute', () => {
    const offline: CoverageRelay = { ...centerRelayHugeRange, status: 'offline' };
    expect(constellationCoveragePercent([offline], [], REGION)).toBe(0);
  });

  test('(c) monotonic: adding an active relay never decreases coverage', () => {
    const base: CoverageRelay = { id: 'r1', lat: 0, lon: 0, status: 'active', commRangeKm: 20 };
    const extra: CoverageRelay = { id: 'r2', lat: 0.3, lon: 0.4, status: 'active', commRangeKm: 25 };

    const before = constellationCoveragePercent([base], [], REGION);
    const after = constellationCoveragePercent([base, extra], [], REGION);

    expect(after).toBeGreaterThanOrEqual(before);
    // Caps are disjoint here (~56 km apart vs 20+25 km radii), so coverage grows.
    expect(after).toBeGreaterThan(before);
  });

  test('(d) dead zone at center reduces coverage vs none', () => {
    const relay: CoverageRelay = { id: 'r1', lat: 0, lon: 0, status: 'active', commRangeKm: 1_000_000 };
    const dz: CoverageDeadZone = { id: 'dz', lat: 0, lon: 0, radiusKm: 20 };

    const clean = constellationCoveragePercent([relay], [], REGION);
    const carved = constellationCoveragePercent([relay], [dz], REGION);

    expect(clean).toBe(100);
    expect(carved).toBeLessThan(clean);
  });

  test('deterministic: identical inputs give identical output', () => {
    const relay: CoverageRelay = { id: 'r1', lat: 0.1, lon: 0.2, status: 'active', commRangeKm: 30 };
    const a = constellationCoveragePercent([relay], [], REGION);
    const b = constellationCoveragePercent([relay], [], REGION);
    expect(a).toBe(b);
  });
});

describe('sepSeverityFromFlares', () => {
  test('any X-class => severe 1.60 (even alongside stronger C counts)', () => {
    expect(sepSeverityFromFlares([{ classType: 'C9.9' }, { classType: 'X1.0' }])).toEqual({
      level: 'severe',
      multiplier: 1.6,
    });
  });

  test('any M-class (no X) => elevated 1.35', () => {
    expect(sepSeverityFromFlares([{ classType: 'M1.2' }, { classType: 'C4.0' }])).toEqual({
      level: 'elevated',
      multiplier: 1.35,
    });
  });

  test('>= 5 C-class flares (no M/X) => moderate 1.15', () => {
    const flares = [
      { classType: 'C4.0' },
      { classType: 'C2.1' },
      { classType: 'C7.7' },
      { classType: 'C1.3' },
      { classType: 'C5.5' },
    ];
    expect(sepSeverityFromFlares(flares)).toEqual({ level: 'moderate', multiplier: 1.15 });
  });

  test('fewer than 5 C-class => low 1.00', () => {
    expect(sepSeverityFromFlares([{ classType: 'C4.0' }, { classType: 'C2.1' }])).toEqual({
      level: 'low',
      multiplier: 1.0,
    });
  });

  test('empty list => low 1.00', () => {
    expect(sepSeverityFromFlares([])).toEqual({ level: 'low', multiplier: 1.0 });
  });

  test('malformed entries are ignored', () => {
    const flares = [
      { classType: 'garbage' },
      { classType: 'X' }, // missing magnitude
      { classType: 'Z2.0' }, // unknown prefix
      { classType: '123' }, // missing prefix
      { classType: '' },
      { classType: '  M5.6  ' }, // whitespace-padded but valid
    ];
    expect(sepSeverityFromFlares(flares)).toEqual({ level: 'elevated', multiplier: 1.35 });
  });
});

describe('link budget (free-space path loss)', () => {
  test('FSPL at 15 km / 2200 MHz matches hand-computed 122.81 dB', () => {
    // 20*log10(15) + 20*log10(2200) + 32.44 = 23.5218 + 66.8485 + 32.44
    expect(fsplDb(15, 2200)).toBeCloseTo(122.81, 1);
  });

  test('FSPL at 1 km / 2200 MHz = 99.29 dB', () => {
    expect(fsplDb(1, 2200)).toBeCloseTo(99.29, 1);
  });

  test('FSPL grows 6 dB per distance doubling', () => {
    const a = fsplDb(10, 2200);
    const b = fsplDb(20, 2200);
    expect(b - a).toBeCloseTo(6.02, 1);
  });

  test('received power: 15 km S-band, +20 dBm tx, 2+2 dBi => -98.81 dBm', () => {
    expect(receivedPowerDbm(15, 2200, 20, 2, 2)).toBeCloseTo(-98.81, 1);
  });

  test('received power: 30 km Ka-band, +23 dBm tx => about -123.4 dBm', () => {
    expect(receivedPowerDbm(30, 26500, 23, 2, 2)).toBeCloseTo(-123.45, 0);
  });
});

describe('latLonToLocalKm', () => {
  test('anchor maps to origin', () => {
    expect(latLonToLocalKm(-89.9, 0, -89.9, 0)).toEqual({ xKm: 0, yKm: 0 });
  });

  test('1 degree of latitude ~30.32 km northward', () => {
    const { yKm } = latLonToLocalKm(-88.9, 0, -89.9, 0);
    expect(yKm).toBeCloseTo((Math.PI * MOON_RADIUS_KM) / 180, 1);
    expect(yKm).toBeGreaterThan(30);
    expect(yKm).toBeLessThan(31);
  });

  test('longitude scaling uses anchor latitude (polar compression)', () => {
    // At lat -89.9, cos = ~0.00175 -> 10 deg of lon is only ~0.53 km east.
    const { xKm } = latLonToLocalKm(-89.9, 10, -89.9, 0);
    expect(Math.abs(xKm)).toBeGreaterThan(0.4);
    expect(Math.abs(xKm)).toBeLessThan(0.7);
  });

  test('roundtrip localKmToLatLon inverts latLonToLocalKm', () => {
    // NOTE: the tangent-plane model is only valid for |dLon| << 180 deg.
    // At anchor lat -89.0, +/-28 km spans about +/-53 deg of longitude, so
    // these cases stay inside the model's validity envelope (the same clamp
    // the map drag interaction enforces).
    const anchorLat = -89.0;
    const anchorLon = -5;
    const cases: [number, number][] = [
      [0.5, 14.6],
      [-13.2, -14.4],
      [16.8, 16.8],
      [-20, 25],
      [28, -28],
    ];
    for (const [xKm, yKm] of cases) {
      const { lat, lon } = localKmToLatLon(xKm, yKm, anchorLat, anchorLon);
      const back = latLonToLocalKm(lat, lon, anchorLat, anchorLon);
      expect(back.xKm).toBeCloseTo(xKm, 6);
      expect(back.yKm).toBeCloseTo(yKm, 6);
    }
  });
});

describe('coveragePercentPlanar', () => {
  const R = 25;

  test('no cover circles => 0%', () => {
    expect(coveragePercentPlanar([], [], R)).toBe(0);
  });

  test('full-cover circle centered at region => 100% when no holes', () => {
    const full: PlanarCircle[] = [{ id: 'c1', xKm: 0, yKm: 0, radiusKm: R * Math.SQRT2 }];
    expect(coveragePercentPlanar(full, [], R)).toBe(100);
  });

  test('inscribed hole of half radius over full cover ~75% (analytic check)', () => {
    const covers: PlanarCircle[] = [{ id: 'c', xKm: 0, yKm: 0, radiusKm: R * Math.SQRT2 }];
    const holes: PlanarCircle[] = [{ id: 'h', xKm: 0, yKm: 0, radiusKm: R / 2 }];
    // Analytic: (R^2 - (R/2)^2) / R^2 = 75%. Monte Carlo tolerance +-3.
    const pct = coveragePercentPlanar(covers, holes, R, 20000);
    expect(pct).toBeGreaterThanOrEqual(72);
    expect(pct).toBeLessThanOrEqual(78);
  });

  test('monotonic: adding a cover circle never decreases coverage', () => {
    const one: PlanarCircle[] = [{ id: 'a', xKm: 10, yKm: 0, radiusKm: 12 }];
    const two: PlanarCircle[] = [...one, { id: 'b', xKm: -12, yKm: 5, radiusKm: 14 }];
    expect(coveragePercentPlanar(two, [], R)).toBeGreaterThanOrEqual(
      coveragePercentPlanar(one, [], R)
    );
  });

  test('deterministic for identical inputs', () => {
    const covers: PlanarCircle[] = [
      { id: 'a', xKm: 8, yKm: -3, radiusKm: 15 },
      { id: 'b', xKm: -10, yKm: 6, radiusKm: 13 },
    ];
    const holes: PlanarCircle[] = [{ id: 'h', xKm: 0, yKm: 0, radiusKm: 5 }];
    expect(coveragePercentPlanar(covers, holes, R)).toBe(
      coveragePercentPlanar(covers, holes, R)
    );
  });
});
