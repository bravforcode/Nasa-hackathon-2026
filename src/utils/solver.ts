/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FailureScenarioType, LunarRegion, PlanOption, RelayNode, RoutePlan, DeadZone } from '../types';
import { INITIAL_RELAYS, ROVER_START, BASE_ALPHA_POS } from '../data/lunarData';
import {
  batteryMarginPercent,
  coveragePercentPlanar,
  haversineDistanceKm,
  latLonToLocalKm,
  receivedPowerDbm,
  type PlanarCircle,
} from './powerModel';

export interface ObjectiveWeights {
  safetyWeight: number;      // w_s
  commsWeight: number;       // w_c
  powerWeight: number;       // w_p
  scienceWeight: number;     // w_t
  resilienceWeight: number;  // w_r
}

// ---------------------------------------------------------------------------
// Power / environment model parameters
//
// These are MODEL ASSUMPTIONS (tunable demonstration parameters), not measured
// mission values. The formulas they feed are real physics (see powerModel.ts);
// changing a region's illumination or taking a relay offline changes every
// derived number through those formulas.
// ---------------------------------------------------------------------------
export const ROVER_LOAD_W = 135;            // avg rover housekeeping + traverse load
export const ROVER_BATTERY_WH = 500;        // main battery capacity
export const ROVER_PANEL_AREA_M2 = 0.5;     // effective illuminated array area
export const ROVER_PANEL_EFFICIENCY = 0.28; // cell efficiency (BOL)
export const MODEL_PANEL_INCIDENCE_DEG = 25; // assumed panel tilt vs sun
export const MISSION_WINDOW_HOURS = 24;      // energy-balance window
export const REGION_ANALYSIS_RADIUS_KM = 25; // surface patch analyzed for coverage
export const MAP_EXTENT_HALF_KM = 30;        // stylized map spans +/-30 km
const BASELINE_ILLUMINATION_FRACTION = 0.88; // default region (Shackleton) anchor

// --- Link budget & traverse model parameters (documented assumptions) ---
export const SURFACE_LINK_MHZ = 2200;   // S-band proximity mesh (matches Relay Bravo band)
export const ROVER_TX_DBM = 20;         // rover radio transmit power
export const ANT_GAIN_DBI = 2;          // omni antenna gain, both ends
export const NOMINAL_SPEED_KMH = 3.4;   // RECOVERY_ASSUMPTIONS vehicle limit
export const SLOW_SPEED_KMH = 1.8;      // speed on slopes > 10 deg (flight rule)
/** Route length multiplier: how much each archetype detours vs straight line. */
const DETOUR_FACTOR: Record<PlanOption, number> = { safety: 0.75, balanced: 1.0, science: 1.55 };

/**
 * Extra solver inputs that make outputs respond to real state instead of
 * constants. All fields optional for backward compatibility.
 */
export interface SolverContext {
  /** Selected landing/ops region — drives the solar power model + coverage anchor. */
  region?: Pick<LunarRegion, 'illuminationAvg' | 'centerLat' | 'centerLon'>;
  /** Current relay fleet — drives computed constellation coverage. */
  relays?: RelayNode[];
  /** Current comms dead zones — subtracted from coverage geometry. */
  deadZones?: DeadZone[];
  /** Live DONKI-derived space-weather multiplier (1.0 = quiet). */
  spaceWeatherMultiplier?: number;
  /** Rover position (lat/lon) for link-budget & traverse geometry. */
  roverPos?: { lat: number; lon: number };
  /** Base habitat position (lat/lon). */
  basePos?: { lat: number; lon: number };
}

/** Parse strings like "89.90°S" / "2.72°E" into signed decimal degrees. */
export function parseLatLonString(value: string): number {
  const m = /^\s*(-?\d+(?:\.\d+)?)\s*°?\s*([NSEW])\s*$/i.exec(value);
  if (!m) return NaN;
  const mag = parseFloat(m[1]);
  const hemi = m[2].toUpperCase();
  const negative = hemi === 'S' || hemi === 'W';
  return negative ? -mag : mag;
}

/**
 * Energy-balance battery margin (%) for a given regional illumination.
 * P_solar = S0 * illum * cos(tilt) * area * eff ; margin over 24 h window.
 */
function computeBaseBatteryMargin(illuminationFraction: number): number {
  return batteryMarginPercent({
    illuminationFraction,
    incidenceDeg: MODEL_PANEL_INCIDENCE_DEG,
    panelAreaM2: ROVER_PANEL_AREA_M2,
    panelEfficiency: ROVER_PANEL_EFFICIENCY,
    loadW: ROVER_LOAD_W,
    batteryCapacityWh: ROVER_BATTERY_WH,
    durationHours: MISSION_WINDOW_HOURS,
  });
}

/**
 * Worst-case link distance (km): rover to the farthest ACTIVE surface relay.
 * Orbital nodes excluded (backhaul). No active surface relay => assume the
 * full map span as a pessimistic bound.
 */
export function worstActiveLinkKm(
  relays: RelayNode[],
  rover: { lat: number; lon: number }
): number {
  const active = relays.filter(r => r.status === 'active' && r.type !== 'orbital_lunanet');
  if (active.length === 0) return 2 * MAP_EXTENT_HALF_KM;
  return Math.max(...active.map(r => haversineDistanceKm(rover.lat, rover.lon, r.lat, r.lon)));
}

// Baseline received power with the full default fleet — used to re-center the
// authored per-archetype dBm values so the default demo looks familiar while
// fleet changes move every route through the real FSPL formula.
const BASELINE_SIGNAL_DBM = receivedPowerDbm(
  worstActiveLinkKm(INITIAL_RELAYS, ROVER_START),
  SURFACE_LINK_MHZ,
  ROVER_TX_DBM,
  ANT_GAIN_DBI,
  ANT_GAIN_DBI
);

const clampPct = (v: number) => Math.max(0, Math.min(100, v));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Route viability (%) computed from live model outputs instead of authored
 * constants. Weighted composite (weights are model parameters, documented):
 * - 40% power: battery margin normalized to a 50% "excellent" reference
 * - 35% network: geometric constellation coverage
 * - 25% link: min signal level mapped from -120 dBm (0) to -70 dBm (1)
 */
export function computeRouteViability(p: {
  batteryMarginPercent: number;
  coveragePercent: number;
  minSignalDbm: number;
}): number {
  const nb = clamp01(p.batteryMarginPercent / 50);
  const nc = clamp01(p.coveragePercent / 100);
  const ns = clamp01((p.minSignalDbm + 120) / 50);
  return Math.round(100 * (0.4 * nb + 0.35 * nc + 0.25 * ns));
}

/**
 * Re-derives the three demo metrics from live model state:
 * - batteryMarginPercent: authored value re-centered on the model baseline so
 *   the default region reproduces the authored demo, while low-illumination
 *   regions (e.g. Faustini 12%) collapse margins toward 0 through the formula.
 * - coveragePercent: scaled from the geometrically computed constellation
 *   coverage (relay footprints minus dead zones).
 * - viabilityPercent: COMPUTED via computeRouteViability() from the live
 *   battery/coverage/signal outputs, then penalized by the live DONKI
 *   space-weather multiplier.
 */
function finalizePlans(
  plans: RoutePlan[],
  p: {
    baseRegionMargin: number;
    baseBaselineMargin: number;
    computedCoverage: number | null;
    severityMultiplier: number;
    straightLineKm: number;
    liveWorstLinkKm: number;
  }
): RoutePlan[] {
  const COVERAGE_FACTOR: Record<PlanOption, number> = {
    safety: 1.05,
    balanced: 1.0,
    science: 0.85,
  };
  const severityPenalty = (p.severityMultiplier - 1) * 40;
  return plans.map((plan) => {
    const delta = plan.batteryMarginPercent - p.baseBaselineMargin;
    const battery = Math.round(clampPct(p.baseRegionMargin + delta));
    const coverage =
      p.computedCoverage == null
        ? plan.coveragePercent
        : Math.round(clampPct(p.computedCoverage * COVERAGE_FACTOR[plan.id]));

    // Link budget: authored dBm re-centered on the live FSPL computation.
    const signalDelta = plan.minSignalDbm - BASELINE_SIGNAL_DBM;
    const liveSignal = receivedPowerDbm(
      p.liveWorstLinkKm,
      SURFACE_LINK_MHZ,
      ROVER_TX_DBM,
      ANT_GAIN_DBI,
      ANT_GAIN_DBI
    );
    const signal = Math.round((liveSignal + signalDelta) * 10) / 10;

    // Traverse geometry: real straight-line distance x archetype detour factor,
    // timed with the repo's own flight-rule speeds.
    const distanceKm = +(p.straightLineKm * DETOUR_FACTOR[plan.id]).toFixed(1);
    const speed = plan.maxGradientDeg > 10 ? SLOW_SPEED_KMH : NOMINAL_SPEED_KMH;
    const travelTimeHours = +(distanceKm / speed).toFixed(1);

    const viability = Math.round(
      clampPct(
        computeRouteViability({
          batteryMarginPercent: battery,
          coveragePercent: coverage,
          minSignalDbm: signal,
        }) - severityPenalty
      )
    );
    return {
      ...plan,
      batteryMarginPercent: battery,
      coveragePercent: coverage,
      viabilityPercent: viability,
      distanceKm,
      travelTimeHours,
      minSignalDbm: signal,
    };
  });
}

/**
 * Calculates weights from a single slider from 0 (Maximum Science) to 100 (Maximum Safety).
 * Default is 50 (Balanced).
 */
export function calculateWeightsFromSlider(sliderVal: number): ObjectiveWeights {
  const norm = sliderVal / 100; // 0 = Science-first, 1 = Safety-first
  
  const safetyWeight = 0.1 + 0.6 * norm;
  const powerWeight = 0.1 + 0.4 * norm;
  const resilienceWeight = 0.1 + 0.3 * norm;
  const scienceWeight = 0.6 * (1 - norm) + 0.05;
  const commsWeight = 0.25 + 0.15 * Math.sin(norm * Math.PI);

  const total = safetyWeight + commsWeight + powerWeight + scienceWeight + resilienceWeight;

  return {
    safetyWeight: +(safetyWeight / total).toFixed(3),
    commsWeight: +(commsWeight / total).toFixed(3),
    powerWeight: +(powerWeight / total).toFixed(3),
    scienceWeight: +(scienceWeight / total).toFixed(3),
    resilienceWeight: +(resilienceWeight / total).toFixed(3),
  };
}

/**
 * Generates the 3 Route Options based on active failure scenario and objective weights.
 */
export function generateRoutePlans(
  scenario: FailureScenarioType,
  sliderVal: number,
  isMitigationActive: boolean,
  ctx: SolverContext = {}
): RoutePlan[] {
  const weights = calculateWeightsFromSlider(sliderVal);

  // Live model state (falls back to baseline constants when ctx omitted).
  const illumFraction = (ctx.region?.illuminationAvg ?? BASELINE_ILLUMINATION_FRACTION * 100) / 100;
  const baseRegionMargin = computeBaseBatteryMargin(illumFraction);
  const baseBaselineMargin = computeBaseBatteryMargin(BASELINE_ILLUMINATION_FRACTION);
  const computedCoverage =
    ctx.relays && ctx.deadZones
      ? calculateConstellationCoverage(ctx.relays, ctx.deadZones, isMitigationActive, ctx.region)
      : null;
  const severityMultiplier = ctx.spaceWeatherMultiplier ?? 1.0;

  // Traverse & link geometry (live)
  const rover = ctx.roverPos ?? ROVER_START;
  const base = ctx.basePos ?? BASE_ALPHA_POS;
  const straightLineKm = haversineDistanceKm(rover.lat, rover.lon, base.lat, base.lon);
  const liveWorstLinkKm = worstActiveLinkKm(ctx.relays ?? INITIAL_RELAYS, rover);

  const finalize = (plans: RoutePlan[]) =>
    finalizePlans(plans, {
      baseRegionMargin,
      baseBaselineMargin,
      computedCoverage,
      severityMultiplier,
      straightLineKm,
      liveWorstLinkKm,
    });

  if (isMitigationActive) {
    // Post-Mitigation (Apex Relay Added): Network is restored to 98.4% with redundant crosslinks
    const safetyPlan: RoutePlan = {
      id: 'safety',
      name: 'Direct Secure Return',
      title: 'Route A — High Reserve Return (Base Alpha)',
      viabilityPercent: 96,
      coveragePercent: 98,
      batteryMarginPercent: 44,
      distanceKm: 9.8,
      travelTimeHours: 2.1,
      recoveryTimeHours: 1.0,
      maxGradientDeg: 7,
      peakSolarExposurePercent: 92,
      minSignalDbm: -78,
      completedSitesCount: 2,
      totalSitesCount: 3,
      abortedSites: ['Site Echo / Delta (Postponed to Sol 4)'],
      redundancyLevel: 'Level 3 (Triple Mesh LOS)',
      narrative: 'Fast return with Apex Relay anchor link active, preserving battery for habitat recharge.',
      radarScores: { safety: 9.8, communication: 9.9, power: 9.2, resilience: 9.5, science: 6.8 },
      scoreBreakdown: {
        safetyScore: 9.8,
        speedIndex: 9.4,
        riskMitigation: 9.9,
        powerReserve: 9.2,
        scienceYield: 6.8,
        compositeJ: +(9.8 * weights.safetyWeight + 9.9 * weights.commsWeight + 9.2 * weights.powerWeight + 6.8 * weights.scienceWeight + 9.5 * weights.resilienceWeight).toFixed(2),
      }
    };

    const balancedPlan: RoutePlan = {
      id: 'balanced',
      name: 'Mitigated Full Campaign',
      title: 'Route B (Apex Enabled) — Balanced Power & Coverage',
      viabilityPercent: 98,
      coveragePercent: 98,
      batteryMarginPercent: 38,
      distanceKm: 14.8,
      travelTimeHours: 3.2,
      recoveryTimeHours: 1.1,
      maxGradientDeg: 9,
      peakSolarExposurePercent: 95,
      minSignalDbm: -72,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 3 (Apex Tower + R-01 Bridge)',
      narrative: 'Full 3-site mission completed safely. Apex Relay eliminates both D-Zones 1 and 2.',
      radarScores: { safety: 9.6, communication: 9.9, power: 8.8, resilience: 9.7, science: 9.9 },
      scoreBreakdown: {
        safetyScore: 9.6,
        speedIndex: 8.9,
        riskMitigation: 9.8,
        powerReserve: 8.8,
        scienceYield: 9.9,
        compositeJ: +(9.6 * weights.safetyWeight + 9.9 * weights.commsWeight + 8.8 * weights.powerWeight + 9.9 * weights.scienceWeight + 9.7 * weights.resilienceWeight).toFixed(2),
      }
    };

    const sciencePlan: RoutePlan = {
      id: 'science',
      name: 'Extended Trench Exploration',
      title: 'Route C — Deep Basin Volatiles Core Survey',
      viabilityPercent: 90,
      coveragePercent: 94,
      batteryMarginPercent: 26,
      distanceKm: 21.4,
      travelTimeHours: 5.6,
      recoveryTimeHours: 2.2,
      maxGradientDeg: 14,
      peakSolarExposurePercent: 84,
      minSignalDbm: -84,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 2 (Apex Horizon Line)',
      narrative: 'Deep exploration into cryogenic PSR basin, backed up by the high-elevation apex relay.',
      radarScores: { safety: 8.2, communication: 9.4, power: 6.8, resilience: 8.5, science: 10.0 },
      scoreBreakdown: {
        safetyScore: 8.2,
        speedIndex: 7.0,
        riskMitigation: 8.4,
        powerReserve: 6.8,
        scienceYield: 10.0,
        compositeJ: +(8.2 * weights.safetyWeight + 9.4 * weights.commsWeight + 6.8 * weights.powerWeight + 10.0 * weights.scienceWeight + 8.5 * weights.resilienceWeight).toFixed(2),
      }
    };

    return finalize([safetyPlan, balancedPlan, sciencePlan]);
  }

  if (scenario === 'nominal') {
    // Nominal operations
    const safetyPlan: RoutePlan = {
      id: 'safety',
      name: 'Conservative Base Route',
      title: 'Route A — High Reserve Return (Base Alpha)',
      viabilityPercent: 94,
      coveragePercent: 96,
      batteryMarginPercent: 42,
      distanceKm: 11.2,
      travelTimeHours: 2.6,
      recoveryTimeHours: 1.0,
      maxGradientDeg: 8,
      peakSolarExposurePercent: 90,
      minSignalDbm: -86,
      completedSitesCount: 2,
      totalSitesCount: 3,
      abortedSites: ['Site Echo (Optional)'],
      redundancyLevel: 'Level 2 (Dual Relay LOS)',
      narrative: 'Prioritizes early return to shelter with maximum battery reserve and zero blackout exposure.',
      radarScores: { safety: 9.5, communication: 9.6, power: 9.0, resilience: 9.0, science: 7.2 },
      scoreBreakdown: {
        safetyScore: 9.5,
        speedIndex: 9.0,
        riskMitigation: 9.4,
        powerReserve: 9.0,
        scienceYield: 7.2,
        compositeJ: +(9.5 * weights.safetyWeight + 9.6 * weights.commsWeight + 9.0 * weights.powerWeight + 7.2 * weights.scienceWeight + 9.0 * weights.resilienceWeight).toFixed(2),
      }
    };

    const balancedPlan: RoutePlan = {
      id: 'balanced',
      name: 'Balanced Exploration (Recommended)',
      title: 'Route B — Balanced Power & Coverage Profile',
      viabilityPercent: 92,
      coveragePercent: 91,
      batteryMarginPercent: 32,
      distanceKm: 14.2,
      travelTimeHours: 3.4,
      recoveryTimeHours: 1.5,
      maxGradientDeg: 12,
      peakSolarExposurePercent: 88,
      minSignalDbm: -92,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 2 (Overlapping Relay A & B)',
      narrative: 'Recommended path balances minimal incline with maximum solar array exposure for extended rover operations.',
      radarScores: { safety: 9.2, communication: 9.1, power: 8.2, resilience: 8.8, science: 9.5 },
      scoreBreakdown: {
        safetyScore: 9.2,
        speedIndex: 8.2,
        riskMitigation: 8.8,
        powerReserve: 8.2,
        scienceYield: 9.5,
        compositeJ: +(9.2 * weights.safetyWeight + 9.1 * weights.commsWeight + 8.2 * weights.powerWeight + 9.5 * weights.scienceWeight + 8.8 * weights.resilienceWeight).toFixed(2),
      }
    };

    const sciencePlan: RoutePlan = {
      id: 'science',
      name: 'Aggressive Science Campaign',
      title: 'Route C — Extended Volatiles Core Sampling',
      viabilityPercent: 78,
      coveragePercent: 82,
      batteryMarginPercent: 21,
      distanceKm: 18.5,
      travelTimeHours: 4.8,
      recoveryTimeHours: 2.5,
      maxGradientDeg: 16,
      peakSolarExposurePercent: 79,
      minSignalDbm: -98,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 1 (Single Node Boundary)',
      narrative: 'Maximized sampling time at Site Echo deep trench, but incurs higher slope drag and low battery reserve.',
      radarScores: { safety: 7.5, communication: 8.2, power: 5.8, resilience: 6.8, science: 10.0 },
      scoreBreakdown: {
        safetyScore: 7.5,
        speedIndex: 6.8,
        riskMitigation: 7.2,
        powerReserve: 5.8,
        scienceYield: 10.0,
        compositeJ: +(7.5 * weights.safetyWeight + 8.2 * weights.commsWeight + 5.8 * weights.powerWeight + 10.0 * weights.scienceWeight + 6.8 * weights.resilienceWeight).toFixed(2),
      }
    };

    return finalize([safetyPlan, balancedPlan, sciencePlan]);
  }

  if (scenario === 'relay_failure') {
    // "72 Hours to Shelter" Demo - Relay B goes offline!
    const safetyPlan: RoutePlan = {
      id: 'safety',
      name: 'Safety-First (Emergency Return)',
      title: 'Route A — Immediate Base Return (Site 3 Aborted)',
      viabilityPercent: 88,
      coveragePercent: 94,
      batteryMarginPercent: 36,
      distanceKm: 8.4,
      travelTimeHours: 2.0,
      recoveryTimeHours: 4.0,
      maxGradientDeg: 8,
      peakSolarExposurePercent: 89,
      minSignalDbm: -88,
      completedSitesCount: 2,
      totalSitesCount: 3,
      abortedSites: ['Site Echo / Delta (Cancelled due to Relay B dead zone)'],
      redundancyLevel: 'Level 1 (Direct Relay-A fallback)',
      narrative: 'Cancels Site 3 immediately and returns rover to shelter via Relay Alpha ridge to eliminate comms dead zone exposure.',
      radarScores: { safety: 9.6, communication: 9.4, power: 8.9, resilience: 8.2, science: 6.5 },
      scoreBreakdown: {
        safetyScore: 9.6,
        speedIndex: 9.5,
        riskMitigation: 9.4,
        powerReserve: 8.9,
        scienceYield: 6.5,
        compositeJ: +(9.6 * weights.safetyWeight + 9.4 * weights.commsWeight + 8.9 * weights.powerWeight + 6.5 * weights.scienceWeight + 8.2 * weights.resilienceWeight).toFixed(2),
      }
    };

    const balancedPlan: RoutePlan = {
      id: 'balanced',
      name: 'Balanced (Alternate Link Bypass)',
      title: 'Route B — Alternate Link Bypass Profile',
      viabilityPercent: 92,
      coveragePercent: 85,
      batteryMarginPercent: 32,
      distanceKm: 12.6,
      travelTimeHours: 3.1,
      recoveryTimeHours: 1.5,
      maxGradientDeg: 11,
      peakSolarExposurePercent: 86,
      minSignalDbm: -94,
      completedSitesCount: 2,
      totalSitesCount: 3,
      abortedSites: ['Site Echo / Delta (Relocated sample target)'],
      redundancyLevel: 'Level 2 (Relay-A + Charlie Crosslink)',
      narrative: 'Route B is recommended because it restores most of the network footprint with a short 1.5h recovery time — Route A drops below safety threshold if delayed.',
      radarScores: { safety: 9.0, communication: 8.5, power: 8.2, resilience: 8.6, science: 8.0 },
      scoreBreakdown: {
        safetyScore: 9.0,
        speedIndex: 8.4,
        riskMitigation: 8.8,
        powerReserve: 8.2,
        scienceYield: 8.0,
        compositeJ: +(9.0 * weights.safetyWeight + 8.5 * weights.commsWeight + 8.2 * weights.powerWeight + 8.0 * weights.scienceWeight + 8.6 * weights.resilienceWeight).toFixed(2),
      }
    };

    const sciencePlan: RoutePlan = {
      id: 'science',
      name: 'Science-First (Trench Detour)',
      title: 'Route C — High Risk All-Site Completion',
      viabilityPercent: 42,
      coveragePercent: 60,
      batteryMarginPercent: 8,
      distanceKm: 24.2,
      travelTimeHours: 6.8,
      recoveryTimeHours: 12.0,
      maxGradientDeg: 21,
      peakSolarExposurePercent: 62,
      minSignalDbm: -114,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 0 (Unprotected 48-min Outage)',
      narrative: 'Attempts all 3 targets despite Relay B outage; passes directly through Dead Zone 2 with battery reserve dipping below the Rule-14.2 limit.',
      radarScores: { safety: 3.8, communication: 5.2, power: 3.0, resilience: 3.2, science: 9.8 },
      scoreBreakdown: {
        safetyScore: 3.8,
        speedIndex: 4.0,
        riskMitigation: 3.5,
        powerReserve: 3.0,
        scienceYield: 9.8,
        compositeJ: +(3.8 * weights.safetyWeight + 5.2 * weights.commsWeight + 3.0 * weights.powerWeight + 9.8 * weights.scienceWeight + 3.2 * weights.resilienceWeight).toFixed(2),
      }
    };

    return finalize([safetyPlan, balancedPlan, sciencePlan]);
  }

  if (scenario === 'power_loss') {
    const safetyPlan: RoutePlan = {
      id: 'safety',
      name: 'Emergency Standby Docking',
      title: 'Route A — Minimum Energy Return',
      viabilityPercent: 92,
      coveragePercent: 92,
      batteryMarginPercent: 35,
      distanceKm: 7.2,
      travelTimeHours: 1.8,
      recoveryTimeHours: 1.2,
      maxGradientDeg: 5,
      peakSolarExposurePercent: 92,
      minSignalDbm: -82,
      completedSitesCount: 1,
      totalSitesCount: 3,
      abortedSites: ['Site Beta', 'Site Echo'],
      redundancyLevel: 'Level 2',
      narrative: 'Cuts auxiliary scientific instruments, uses lowest terrain gradient to preserve base habitat power.',
      radarScores: { safety: 9.6, communication: 9.2, power: 8.8, resilience: 8.4, science: 5.0 },
      scoreBreakdown: {
        safetyScore: 9.6,
        speedIndex: 9.2,
        riskMitigation: 9.5,
        powerReserve: 8.8,
        scienceYield: 5.0,
        compositeJ: +(9.6 * weights.safetyWeight + 9.2 * weights.commsWeight + 8.8 * weights.powerWeight + 5.0 * weights.scienceWeight + 8.4 * weights.resilienceWeight).toFixed(2),
      }
    };

    const balancedPlan: RoutePlan = {
      id: 'balanced',
      name: 'Ridge Solar Charging Trajectory',
      title: 'Route B — Ridge Solar Charging Profile',
      viabilityPercent: 86,
      coveragePercent: 90,
      batteryMarginPercent: 28,
      distanceKm: 11.8,
      travelTimeHours: 2.9,
      recoveryTimeHours: 2.0,
      maxGradientDeg: 9,
      peakSolarExposurePercent: 94,
      minSignalDbm: -88,
      completedSitesCount: 2,
      totalSitesCount: 3,
      abortedSites: ['Site Echo'],
      redundancyLevel: 'Level 2',
      narrative: 'Hugs high-elevation Malapert connecting ridge to maximize solar array regeneration while traveling.',
      radarScores: { safety: 8.8, communication: 9.0, power: 7.8, resilience: 8.2, science: 7.8 },
      scoreBreakdown: {
        safetyScore: 8.8,
        speedIndex: 8.0,
        riskMitigation: 8.6,
        powerReserve: 7.8,
        scienceYield: 7.8,
        compositeJ: +(8.8 * weights.safetyWeight + 9.0 * weights.commsWeight + 7.8 * weights.powerWeight + 7.8 * weights.scienceWeight + 8.2 * weights.resilienceWeight).toFixed(2),
      }
    };

    const sciencePlan: RoutePlan = {
      id: 'science',
      name: 'Full Exploration (High EPS Drain)',
      title: 'Route C — Over-discharge Critical Risk',
      viabilityPercent: 38,
      coveragePercent: 75,
      batteryMarginPercent: 6,
      distanceKm: 19.5,
      travelTimeHours: 5.2,
      recoveryTimeHours: 8.0,
      maxGradientDeg: 15,
      peakSolarExposurePercent: 70,
      minSignalDbm: -96,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 1',
      narrative: 'Proceeds with deep drilling during base power glitch; creates critical risk of rover stranding.',
      radarScores: { safety: 3.5, communication: 7.2, power: 2.5, resilience: 3.0, science: 9.8 },
      scoreBreakdown: {
        safetyScore: 3.5,
        speedIndex: 5.0,
        riskMitigation: 3.2,
        powerReserve: 2.5,
        scienceYield: 9.8,
        compositeJ: +(3.5 * weights.safetyWeight + 7.2 * weights.commsWeight + 2.5 * weights.powerWeight + 9.8 * weights.scienceWeight + 3.0 * weights.resilienceWeight).toFixed(2),
      }
    };

    return finalize([safetyPlan, balancedPlan, sciencePlan]);
  }

  if (scenario === 'space_weather') {
    // Space Weather / Solar Energetic Particle Event (DONKI)
    const safetyPlan: RoutePlan = {
      id: 'safety',
      name: 'Radiation Shielding Descent',
      title: 'Route A — Crater Rim Regolith Berm Shelter',
      viabilityPercent: 91,
      coveragePercent: 88,
      batteryMarginPercent: 34,
      distanceKm: 6.8,
      travelTimeHours: 1.6,
      recoveryTimeHours: 1.0,
      maxGradientDeg: 6,
      peakSolarExposurePercent: 55,
      minSignalDbm: -90,
      completedSitesCount: 1,
      totalSitesCount: 3,
      abortedSites: ['Site Beta', 'Site Echo'],
      redundancyLevel: 'Level 2 (Low-frequency hardened S-Band)',
      narrative: 'Routes rover beneath Shakleton escarpment shadow overhang to shield electronics from solar proton flux.',
      radarScores: { safety: 9.7, communication: 8.6, power: 8.0, resilience: 9.2, science: 5.2 },
      scoreBreakdown: {
        safetyScore: 9.7,
        speedIndex: 9.2,
        riskMitigation: 9.8,
        powerReserve: 8.0,
        scienceYield: 5.2,
        compositeJ: +(9.7 * weights.safetyWeight + 8.6 * weights.commsWeight + 8.0 * weights.powerWeight + 5.2 * weights.scienceWeight + 9.2 * weights.resilienceWeight).toFixed(2),
      }
    };

    const balancedPlan: RoutePlan = {
      id: 'balanced',
      name: 'Hardened Mesh Trajectory',
      title: 'Route B — Hardened Mesh Profile',
      viabilityPercent: 89,
      coveragePercent: 82,
      batteryMarginPercent: 29,
      distanceKm: 12.0,
      travelTimeHours: 2.8,
      recoveryTimeHours: 1.8,
      maxGradientDeg: 10,
      peakSolarExposurePercent: 78,
      minSignalDbm: -96,
      completedSitesCount: 2,
      totalSitesCount: 3,
      abortedSites: ['Site Echo'],
      redundancyLevel: 'Level 2 (Relay Alpha direct)',
      narrative: 'Reconfigures RF transmitters to noise-resistant low-rate modulation; finishes Site 2 before storm peak.',
      radarScores: { safety: 9.1, communication: 8.2, power: 7.9, resilience: 8.8, science: 7.9 },
      scoreBreakdown: {
        safetyScore: 9.1,
        speedIndex: 8.2,
        riskMitigation: 8.9,
        powerReserve: 7.9,
        scienceYield: 7.9,
        compositeJ: +(9.1 * weights.safetyWeight + 8.2 * weights.commsWeight + 7.9 * weights.powerWeight + 7.9 * weights.scienceWeight + 8.8 * weights.resilienceWeight).toFixed(2),
      }
    };

    const sciencePlan: RoutePlan = {
      id: 'science',
      name: 'Unsheltered Plateau Traverse',
      title: 'Route C — High Radiation Exposure',
      viabilityPercent: 46,
      coveragePercent: 65,
      batteryMarginPercent: 18,
      distanceKm: 20.1,
      travelTimeHours: 5.0,
      recoveryTimeHours: 7.0,
      maxGradientDeg: 13,
      peakSolarExposurePercent: 88,
      minSignalDbm: -108,
      completedSitesCount: 3,
      totalSitesCount: 3,
      abortedSites: [],
      redundancyLevel: 'Level 1 (Degraded Ka-Band)',
      narrative: 'Continuous open plateau exposure during CME shockwave causes SEU bit-flips in navigation star-trackers.',
      radarScores: { safety: 4.2, communication: 6.0, power: 6.2, resilience: 4.0, science: 9.8 },
      scoreBreakdown: {
        safetyScore: 4.2,
        speedIndex: 6.0,
        riskMitigation: 4.1,
        powerReserve: 6.2,
        scienceYield: 9.8,
        compositeJ: +(4.2 * weights.safetyWeight + 6.0 * weights.commsWeight + 6.2 * weights.powerWeight + 9.8 * weights.scienceWeight + 4.0 * weights.resilienceWeight).toFixed(2),
      }
    };

    return finalize([safetyPlan, balancedPlan, sciencePlan]);
  }

  // Comms blackout scenario
  const defaultSafety: RoutePlan = {
    id: 'safety',
    name: 'Autonomous Inertial Return',
    title: 'Route A — Dead Reckoning to Base Alpha',
    viabilityPercent: 87,
    coveragePercent: 88,
    batteryMarginPercent: 38,
    distanceKm: 8.0,
    travelTimeHours: 2.2,
    recoveryTimeHours: 2.0,
    maxGradientDeg: 7,
    peakSolarExposurePercent: 88,
    minSignalDbm: -92,
    completedSitesCount: 1,
    totalSitesCount: 3,
    abortedSites: ['Site Beta', 'Site Echo'],
    redundancyLevel: 'Level 1 (IMU Visual Odometry)',
    narrative: 'Executes pre-programmed fail-safe optical breadcrumb return without ground control intervention.',
    radarScores: { safety: 9.2, communication: 8.0, power: 8.8, resilience: 8.5, science: 5.5 },
    scoreBreakdown: {
      safetyScore: 9.2,
      speedIndex: 8.8,
      riskMitigation: 9.0,
      powerReserve: 8.8,
      scienceYield: 5.5,
      compositeJ: +(9.2 * weights.safetyWeight + 8.0 * weights.commsWeight + 8.8 * weights.powerWeight + 5.5 * weights.scienceWeight + 8.5 * weights.resilienceWeight).toFixed(2),
    }
  };

  const defaultBalanced: RoutePlan = {
    id: 'balanced',
    name: 'Local Surface Mesh Routing',
    title: 'Route B — Local Mesh Routing Profile',
    viabilityPercent: 89,
    coveragePercent: 84,
    batteryMarginPercent: 30,
    distanceKm: 13.0,
    travelTimeHours: 3.2,
    recoveryTimeHours: 1.8,
    maxGradientDeg: 10,
    peakSolarExposurePercent: 85,
    minSignalDbm: -95,
    completedSitesCount: 2,
    totalSitesCount: 3,
    abortedSites: ['Site Echo'],
    redundancyLevel: 'Level 2 (Relay Alpha to Habitat direct)',
    narrative: 'Utilizes local multi-hop repeater link to bypass lost DSN uplink.',
    radarScores: { safety: 8.9, communication: 8.4, power: 8.0, resilience: 8.7, science: 7.8 },
    scoreBreakdown: {
      safetyScore: 8.9,
      speedIndex: 8.2,
      riskMitigation: 8.7,
      powerReserve: 8.0,
      scienceYield: 7.8,
      compositeJ: +(8.9 * weights.safetyWeight + 8.4 * weights.commsWeight + 8.0 * weights.powerWeight + 7.8 * weights.scienceWeight + 8.7 * weights.resilienceWeight).toFixed(2),
    }
  };

  const defaultScience: RoutePlan = {
    id: 'science',
    name: 'Blind Exploration Protocol',
    title: 'Route C — High Uncertainty Trajectory',
    viabilityPercent: 44,
    coveragePercent: 55,
    batteryMarginPercent: 12,
    distanceKm: 22.0,
    travelTimeHours: 5.8,
    recoveryTimeHours: 9.0,
    maxGradientDeg: 18,
    peakSolarExposurePercent: 70,
    minSignalDbm: -110,
    completedSitesCount: 3,
    totalSitesCount: 3,
    abortedSites: [],
    redundancyLevel: 'Level 0 (No LOS)',
    narrative: 'Proceeds without communications into rough terrain, risking unmonitored wheel slip and rollover.',
    radarScores: { safety: 4.0, communication: 4.5, power: 4.0, resilience: 3.8, science: 9.6 },
    scoreBreakdown: {
      safetyScore: 4.0,
      speedIndex: 4.5,
      riskMitigation: 3.8,
      powerReserve: 4.0,
      scienceYield: 9.6,
      compositeJ: +(4.0 * weights.safetyWeight + 4.5 * weights.commsWeight + 4.0 * weights.powerWeight + 9.6 * weights.scienceWeight + 3.8 * weights.resilienceWeight).toFixed(2),
    }
  };

  return finalize([defaultSafety, defaultBalanced, defaultScience]);
}

export const calculateRoutePlans = generateRoutePlans;

/**
 * Calculates current network-wide constellation coverage percentage.
 *
 * REAL GEOMETRY (replaces the former literal 94/68/91 returns):
 * - Anchor: selected region center (parsed from "89.90°S"-style strings).
 * - Each ACTIVE surface relay covers a disk of its `coverageRadiusKm` around
 *   its lat/lon, projected into the local tangent plane. Orbital LunaNet
 *   nodes are excluded from the surface proximity mesh (they provide
 *   backhaul/DTE, not surface LOS) — documented modeling decision.
 * - Dead zones are mapped from stylized map percentages (xPercent/yPercent)
 *   onto the same +/-30 km plane and carve holes out of coverage.
 * - Result: deterministic Monte Carlo fraction of the 25 km analysis disk
 *   that is inside >=1 relay footprint AND outside every dead zone.
 */
export function calculateConstellationCoverage(
  relays: RelayNode[],
  deadZones: DeadZone[],
  isMitigationActive: boolean,
  region?: Pick<LunarRegion, 'centerLat' | 'centerLon'>
): number {
  const anchorLat = region ? parseLatLonString(region.centerLat) : -89.4;
  const anchorLon = region ? parseLatLonString(region.centerLon) : 10;
  if (Number.isNaN(anchorLat) || Number.isNaN(anchorLon)) return 0;

  const covers: PlanarCircle[] = [];
  for (const relay of relays) {
    if (relay.type === 'orbital_lunanet') continue; // backhaul only — see JSDoc
    const isActive =
      relay.status === 'active' || (isMitigationActive && relay.isCandidate === true);
    if (!isActive) continue;
    const { xKm, yKm } = latLonToLocalKm(relay.lat, relay.lon, anchorLat, anchorLon);
    covers.push({ id: relay.id, xKm, yKm, radiusKm: relay.coverageRadiusKm });
  }

  // Map-percentage -> km: xPercent/yPercent are 0..100 screen coords on a
  // +/-30 km stylized map; y is inverted (screen down = south).
  const holes: PlanarCircle[] = deadZones.map((dz) => ({
    id: dz.id,
    xKm: ((dz.xPercent - 50) / 50) * MAP_EXTENT_HALF_KM,
    yKm: ((50 - dz.yPercent) / 50) * MAP_EXTENT_HALF_KM,
    radiusKm: dz.radiusKm,
  }));

  return coveragePercentPlanar(covers, holes, REGION_ANALYSIS_RADIUS_KM);
}

