/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// bun:test ships no type declarations in this repo (no bun-types dependency);
// @ts-expect-error — no type declarations available for 'bun:test'
import { describe, expect, test } from 'bun:test';

import {
  computeRouteViability,
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
});

describe('countUncoveredDeadZones (I1: honest dead-zone count)', () => {
  const region = LUNAR_REGIONS[0];

  test('default fleet: both dead-zone centers uncovered => 2', () => {
    expect(countUncoveredDeadZones(INITIAL_RELAYS, INITIAL_DEAD_ZONES, false, region)).toBe(2);
  });

  test('apex mitigation genuinely covers D-Zone 2 center => 1', () => {
    const fleet = [...INITIAL_RELAYS, { ...MITIGATION_RELAY_CANDIDATE, status: 'active' as const }];
    expect(countUncoveredDeadZones(fleet, INITIAL_DEAD_ZONES, true, region)).toBe(1);
  });

  test('all relays offline => every zone uncovered', () => {
    const down = INITIAL_RELAYS.map(r => ({ ...r, status: 'offline' as const }));
    expect(countUncoveredDeadZones(down, INITIAL_DEAD_ZONES, false, region)).toBe(2);
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
