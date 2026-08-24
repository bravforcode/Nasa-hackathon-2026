/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NavigationTab = 
  | 'region' 
  | 'habitat' 
  | 'relay' 
  | 'science' 
  | 'constraints' 
  | 'components';

export type FailureScenarioType = 
  | 'nominal'
  | 'relay_failure'
  | 'power_loss'
  | 'comms_blackout'
  | 'space_weather';

export type PlanOption = 'safety' | 'balanced' | 'science';

export interface RelayNode {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  elevKm: number;
  type: 'surface_tower' | 'ridge_mast' | 'orbital_lunanet';
  status: 'active' | 'offline' | 'degraded' | 'candidate';
  coverageRadiusKm: number;
  frequencyBand: string;
  healthPercent: number;
  isCandidate?: boolean;
}

export interface DeadZone {
  id: string;
  name: string;
  code: string;
  xPercent: number;
  yPercent: number;
  radiusKm: number;
  reason: string;
  severity: 'critical' | 'moderate';
}

export interface ScienceSite {
  id: string;
  name: string;
  code: string;
  lat: number;
  lon: number;
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  scienceYieldPercent: number;
  estDurationHours: number;
  status: 'completed' | 'active' | 'pending' | 'at_risk' | 'aborted';
}

export interface RoutePlan {
  id: PlanOption;
  name: string;
  title: string;
  viabilityPercent: number;
  coveragePercent: number;
  batteryMarginPercent: number;
  distanceKm: number;
  travelTimeHours: number;
  recoveryTimeHours: number;
  maxGradientDeg: number;
  peakSolarExposurePercent: number;
  minSignalDbm: number;
  completedSitesCount: number;
  totalSitesCount: number;
  abortedSites: string[];
  redundancyLevel: string;
  narrative: string;
  radarScores: {
    safety: number;
    communication: number;
    power: number;
    resilience: number;
    science: number;
  };
  scoreBreakdown: {
    safetyScore: number;
    speedIndex: number;
    riskMitigation: number;
    powerReserve: number;
    scienceYield: number;
    compositeJ: number;
  };
}

export interface LunarRegion {
  id: string;
  name: string;
  code: string;
  centerLat: string;
  centerLon: string;
  terrainType: string;
  lolaResolution: string;
  illuminationAvg: number;
  psrCount: number;
}

export interface NasaDataSource {
  dataset: string;
  instrument: string;
  mission: string;
  purpose: string;
  citation: string;
  lastUpdated: string;
  url: string;
  status: 'ONLINE' | 'CACHED' | 'REAL-TIME';
}
