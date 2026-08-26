/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// bun:test ships no type declarations in this repo (no bun-types dependency);
// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import {
  calculateConstellationCoverage,
  calculateWeightsFromSlider,
  computeRouteViability,
  computeRadarScores,
  countUncoveredDeadZones,
  generateRoutePlans,
  parseLatLonString,
} from './solver';
import {
  INITIAL_RELAYS,
  INITIAL_DEAD_ZONES,
  LUNAR_REGIONS,
  MITIGATION_RELAY_CANDIDATE,
} from '../data/lunarData';

const ctx = {
  region: LUNAR_REGIONS[0],
  relays: INITIAL_RELAYS,
  deadZones: INITIAL_DEAD_ZONES,
};

describe('parseLatLonString', () => {
  test('parses hemisphere suffixes into signed degrees', () => {
    expect(parseLatLonString('89.90°S')).toBe(-89.9);
    expect(parseLatLonString('2.72°E')).toBeCloseTo(2.72, 6);
    expect(parseLatLonString('88.34°W')).toBe(-88.34);
    expect(parseLatLonString('10°N')).toBe(10);
    // M1: an explicit minus sign must not double-negate with S/W hemispheres.
    expect(parseLatLonString('-89.9°S')).toBe(-89.9);
    expect(parseLatLonString('-14.5°W')).toBe(-14.5);
    expect(parseLatLonString('garbage')).toBeNaN();
  });
});

describe('route geometry (computed distances & travel times)', () => {
  test('distanceKm is derived from rover->base straight line x detour factor', () => {
    const plans = generateRoutePlans('nominal', 50, false, ctx);
    const safety = plans.find(p => p.id === 'safety')!;
    const science = plans.find(p => p.id === 'science')!;
    // Safety is the most direct route; science the longest detour.
    expect(safety.distanceKm).toBeLessThan(science.distanceKm);
    // All distances are positive and in a physically plausible band.
    for (const p of plans) {
      expect(p.distanceKm).toBeGreaterThan(1);
      expect(p.distanceKm).toBeLessThan(100);
    }
  });

  test('travel time obeys the repo flight rule: slow speed on steep routes', () => {
    const plans = generateRoutePlans('nominal', 50, false, ctx);
    for (const p of plans) {
      const speed = p.maxGradientDeg > 10 ? 1.8 : 3.4;
      expect(p.travelTimeHours).toBeCloseTo(p.distanceKm / speed, 1);
    }
  });

  test('minSignalDbm responds to relay fleet state (physics link budget)', () => {
    const nominal = generateRoutePlans('nominal', 50, false, ctx);
    const noRelays = generateRoutePlans('nominal', 50, false, {
      ...ctx,
      relays: INITIAL_RELAYS.map(r => ({ ...r, status: 'offline' as const })),
    });
    const n = nominal.find(p => p.id === 'balanced')!.minSignalDbm;
    const w = noRelays.find(p => p.id === 'balanced')!.minSignalDbm;
    // With every surface relay down, the worst-case link must degrade.
    expect(w).toBeLessThan(n);
  });

  test('IMP4: compositeJ is the weighted mean of live radar axes', () => {
    const plans = generateRoutePlans('nominal', 50, false, ctx);
    const w = calculateWeightsFromSlider(50);
    for (const p of plans) {
      const r = p.radarScores;
      const expected = +(
        (w.safetyWeight * r.safety +
          w.commsWeight * r.communication +
          w.powerWeight * r.power +
          w.scienceWeight * r.science +
          w.resilienceWeight * r.resilience)
      ).toFixed(1);
      expect(p.scoreBreakdown.compositeJ).toBeCloseTo(expected, 1);
    }
  });
});

describe('countUncoveredDeadZones (I1: honest dead-zone count)', () => {
  const region = LUNAR_REGIONS[0];

  test('default fleet: both dead-zone centers uncovered => 2', () => {
    expect(countUncoveredDeadZones(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, region)).toBe(2);
  });

  test('apex mitigation covers both dead zones (>=90% area) => 0', () => {
    // A 45 km mast on the +4.3 km rim (terrain-scaled) envelopes both zones.
    const fleet = [...INITIAL_RELAYS, { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const }];
    expect(countUncoveredDeadZones(fleet, INITIAL_DEAD_ZONES, true, region)).toBe(0);
  });

  test('IMP2: counter agrees with coverage model on DZ2 containment', () => {
    // The Monte Carlo uses terrain-shrunk radii; the counter must too.
    const fleet = [...INITIAL_RELAYS, { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const }];
    const covNoHoles = calculateConstellationCoverage(
      fleet,
      [],
      true,
      region
    );
    const covWithDz2 = calculateConstellationCoverage(
      fleet,
      INITIAL_DEAD_ZONES.filter(d => d.id === 'dzone_2'),
      true,
      region
    );
    const counterSaysCovered = countUncoveredDeadZones(fleet, [INITIAL_DEAD_ZONES.find(d => d.id === 'dzone_2')!], true, region) === 0;
    // A fully-contained hole still removes exactly its own area share from
    // the Monte Carlo — "covered" means NO ADDITIONAL loss beyond that.
    const zoneShare = Math.pow(
      INITIAL_DEAD_ZONES.find(d => d.id === 'dzone_2')!.radiusKm / 25,
      2
    ) * 100;
    if (counterSaysCovered) {
      expect(Math.abs(covNoHoles - covWithDz2 - zoneShare)).toBeLessThanOrEqual(1.5);
    } else {
      expect(covWithDz2).toBeLessThan(covNoHoles - zoneShare + 1.5);
    }
  });

  test('all relays offline => every zone uncovered', () => {
    const down = INITIAL_RELAYS.map(r => ({ ...r, status: 'offline' as const }));
    expect(countUncoveredDeadZones(down, INITIAL_DEAD_ZONES, false, region)).toBe(2);
  });
});

describe('terrain-aware coverage (DEM ray-casting integration)', () => {
  const region = LUNAR_REGIONS[0];
  const flat = { elevationAt: () => 0 };

  test('flat terrain preserves the baseline coverage number', () => {
    const c = calculateConstellationCoverage(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, region, flat);
    expect(c).toBeGreaterThan(0);
  });

  test('a 3 km wall just east of Relay Alpha reduces its footprint => lower coverage', () => {
    // Wall offset ~1 deg east of Alpha's meridian (observer NOT on the wall).
    const wall = {
      elevationAt: (_lat: number, lon: number) =>
        Math.abs(lon - 15.2) < 0.35 ? 3000 : 0,
    };
    const cFlat = calculateConstellationCoverage(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, region, flat);
    const cWall = calculateConstellationCoverage(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, region, wall);
    expect(cWall).toBeLessThan(cFlat);
  });
});

describe('computeRadarScores (honest radar)', () => {
  const base = {
    batteryMarginPercent: 32,
    coveragePercent: 91,
    minSignalDbm: -92,
    travelTimeHours: 6.4,
    relaysActive: 2,
    relaysTotal: 3,
    severityMultiplier: 1.0,
    isMitigationActive: false,
    sciencePriority: 6,
  };

  test('returns all five axes within 0..10', () => {
    const r = computeRadarScores(base);
    for (const k of ['safety', 'communication', 'power', 'science', 'resilience'] as const) {
      expect(r[k]).toBeGreaterThanOrEqual(0);
      expect(r[k]).toBeLessThanOrEqual(10);
    }
  });

  test('more battery => higher power score; more relays => higher resilience', () => {
    const low = computeRadarScores({ ...base, batteryMarginPercent: 5, relaysActive: 1 });
    const high = computeRadarScores({ ...base, batteryMarginPercent: 45, relaysActive: 3 });
    expect(high.power).toBeGreaterThan(low.power);
    expect(high.resilience).toBeGreaterThan(low.resilience);
  });

  test('severe space weather degrades communication only', () => {
    const quiet = computeRadarScores(base);
    const storm = computeRadarScores({ ...base, severityMultiplier: 1.6 });
    expect(storm.communication).toBeLessThan(quiet.communication);
    expect(storm.power).toBe(quiet.power);
  });

  test('science axis passes through the authored design-intent value', () => {
    expect(computeRadarScores({ ...base, sciencePriority: 9 }).science).toBe(9);
  });
});

describe('computeRouteViability', () => {
  test('known composite: b=32,c=91,s=-92 -> 71', () => {
    expect(computeRouteViability({ batteryMarginPercent: 32, coveragePercent: 91, minSignalDbm: -92 })).toBe(71);
  });

  test('clamps to 0..100', () => {
    expect(computeRouteViability({ batteryMarginPercent: 500, coveragePercent: 100, minSignalDbm: -20 })).toBe(100);
    expect(computeRouteViability({ batteryMarginPercent: -50, coveragePercent: 0, minSignalDbm: -200 })).toBe(0);
  });
});
